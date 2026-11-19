import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, CircleHelp, Clock3, Plus, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { supabase } from '../lib/supabase'
import { upcomingEvents, weekActivity } from '../data/demo'
import type { TaskRow } from '../types/database'

function getTaskErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'An unexpected task error occurred.'
}

function formatDueDate(dueAt: string | null) {
  if (!dueAt) return 'No due date'
  const date = new Date(dueAt)
  if (Number.isNaN(date.getTime())) return 'Due date unavailable'

  const today = new Date()
  const isToday = date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  const formattedDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
  return isToday ? 'Due today' : `Due ${formattedDate}`
}

type TaskLoadState = {
  userId: string
  status: 'loading' | 'ready' | 'error'
  message?: string
}

export function Dashboard() {
  const { profile, user } = useAuth()
  const [taskRecords, setTaskRecords] = useState<{ userId: string; tasks: TaskRow[] }>({ userId: '', tasks: [] })
  const [taskLoad, setTaskLoad] = useState<TaskLoadState>({ userId: '', status: 'loading' })
  const [taskActionError, setTaskActionError] = useState<string | null>(null)
  const [savingTask, setSavingTask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [reloadTasks, setReloadTasks] = useState(0)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const userId = user?.id
  const tasks = taskRecords.userId === userId ? taskRecords.tasks : []
  const tasksLoading = Boolean(userId) && (taskLoad.userId !== userId || taskLoad.status === 'loading')
  const taskLoadError = !supabase
    ? 'Supabase is not configured.'
    : !userId
      ? 'Sign in to load your tasks.'
      : taskLoad.userId === userId && taskLoad.status === 'error'
        ? taskLoad.message ?? 'Could not load tasks.'
        : null
  const doneCount = tasks.filter((task) => task.status === 'completed').length
  const [dayContext] = useState(() => {
    const now = new Date()
    return {
      hour: now.getHours(),
      dateLabel: new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(now),
    }
  })
  const greeting = dayContext.hour < 12 ? 'Good morning' : dayContext.hour < 18 ? 'Good afternoon' : 'Good evening'
  const studentName = profile?.full_name || user?.email?.split('@')[0] || 'Student'

  useEffect(() => {
    let active = true
    if (!supabase || !userId) return () => { active = false }
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .neq('status', 'cancelled')
          .order('due_at', { ascending: true, nullsFirst: false })
        if (error) throw error
        if (active) {
          setTaskRecords({ userId, tasks: data ?? [] })
          setTaskLoad({ userId, status: 'ready' })
        }
      } catch (error: unknown) {
        if (active) setTaskLoad({ userId, status: 'error', message: getTaskErrorMessage(error) })
      }
    })()

    return () => { active = false }
  }, [userId, reloadTasks])

  const toggleTask = async (task: TaskRow) => {
    if (!supabase || !userId) {
      setTaskActionError('Sign in to update tasks.')
      return
    }
    const isComplete = task.status === 'completed'
    setUpdatingTaskId(task.id)
    setTaskActionError(null)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: isComplete ? 'todo' : 'completed',
          completed_at: isComplete ? null : new Date().toISOString(),
        })
        .eq('id', task.id)
        .eq('user_id', userId)
        .select('*')
        .single()
      if (error) throw error
      setTaskRecords((current) => current.userId === userId
        ? { ...current, tasks: current.tasks.map((currentTask) => currentTask.id === task.id ? data : currentTask) }
        : current)
    } catch (error: unknown) {
      setTaskActionError(getTaskErrorMessage(error))
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const addTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newTaskTitle.trim()
    if (!title) return
    if (taskLoadError) {
      setTaskActionError('Retry loading your tasks before adding a new one.')
      return
    }
    if (!supabase || !userId) {
      setTaskActionError('Sign in to add tasks.')
      return
    }

    setSavingTask(true)
    setTaskActionError(null)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: userId, title })
        .select('*')
        .single()
      if (error) throw error
      setTaskRecords((current) => current.userId === userId
        ? { ...current, tasks: [...current.tasks, data] }
        : { userId, tasks: [data] })
      setNewTaskTitle('')
      setShowAddTask(false)
    } catch (error: unknown) {
      setTaskActionError(getTaskErrorMessage(error))
    } finally {
      setSavingTask(false)
    }
  }

  const retryTaskLoad = () => {
    if (!userId) return
    setTaskLoad({ userId, status: 'loading' })
    setReloadTasks((count) => count + 1)
  }

  return (
    <div className="dashboard-page page-content">
      <div className="dashboard-welcome">
        <div><div className="welcome-date"><span className="date-dot" />{dayContext.dateLabel}</div><h1>{greeting}, {studentName} <span className="wave-emoji">✦</span></h1><p>Here's what's happening in your life today.</p></div>
        <span className="button button-quiet week-select">This week</span>
      </div>

      <div className="demo-banner"><Sparkles size={14} /><span><b>Partly live</b> — Tasks are saved to your account. Other dashboard stats, charts, schedule, and coach content are sample data.</span><span aria-label="About sample data" title="Only tasks on this dashboard currently use your personal data."><CircleHelp size={15} /></span></div>

      <div className="stat-grid">
        <motion.article className="stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}><div className="stat-top"><span>Tasks completed</span><span className="stat-icon violet"><Check size={17} /></span></div><div className="stat-value">{tasksLoading ? '—' : doneCount}<small> / {tasksLoading ? '—' : tasks.length}</small></div><div className="stat-foot"><span className="trend-neutral">Live data</span><span>from your task list</span></div></motion.article>
        <motion.article className="stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}><div className="stat-top"><span>Focus time</span><span className="stat-icon blue"><Clock3 size={17} /></span></div><div className="stat-value">14.5<small> hrs</small></div><div className="stat-foot"><span className="trend-positive"><TrendingUp size={13} /> 8%</span><span>vs. last week</span><div className="stat-sparkline spark-blue"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div></motion.article>
        <motion.article className="stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}><div className="stat-top"><span>Current GPA</span><span className="stat-icon orange"><Target size={17} /></span></div><div className="stat-value">3.82<small> / 4.0</small></div><div className="stat-foot"><span className="trend-positive"><TrendingUp size={13} /> 0.14</span><span>this semester</span><div className="stat-sparkline spark-orange"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div></motion.article>
        <motion.article className="stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}><div className="stat-top"><span>Weekly rhythm</span><span className="stat-icon green"><Sparkles size={17} /></span></div><div className="stat-value">78<small> / 100</small></div><div className="stat-foot"><span className="trend-neutral"><ArrowUpRight size={13} /> Good pace</span><span>keep it balanced</span><div className="rhythm-track"><i /></div></div></motion.article>
      </div>

      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-heading"><div><h2>Your activity</h2><p>A little progress, day by day.</p></div><span className="select-button">This week</span></div>
          <div className="activity-legend"><span><i className="legend-violet" /> Focus hours</span><span><i className="legend-blue" /> Tasks done</span></div>
          <div className="activity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekActivity} margin={{ top: 12, right: 4, left: -22, bottom: 0 }}><defs><linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient><linearGradient id="taskFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5ca8f6" stopOpacity={0.12} /><stop offset="100%" stopColor="#5ca8f6" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-faint)', fontSize: 11 }} dy={10} /><Tooltip contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }} /><Area type="monotone" dataKey="focus" name="Focus hours" stroke="#9c7af9" strokeWidth={2.3} fill="url(#focusFill)" /><Area type="monotone" dataKey="tasks" name="Tasks done" stroke="#64abf5" strokeWidth={2} fill="url(#taskFill)" /></AreaChart></ResponsiveContainer></div>
        </section>

        <section className="panel rhythm-panel">
          <div className="panel-heading"><div><h2>Your weekly rhythm</h2><p>Consistency over perfection.</p></div><span className="icon-button small-icon" aria-label="A personal snapshot, not a grade." title="A personal snapshot, not a grade."><CircleHelp size={16} /></span></div>
          <div className="rhythm-content"><div className="large-ring"><div><strong>78</strong><span>good pace</span></div></div><div className="rhythm-note"><span className="rhythm-sparkle"><Sparkles size={14} /></span><p>You're finding a nice balance this week. Keep making space for breaks.</p></div></div>
          <div className="rhythm-footer"><span><i className="dot-violet" />Tasks</span><span><i className="dot-blue" />Focus</span><span><i className="dot-green" />Habits</span><span className="info-copy">A personal snapshot, not a grade.</span></div>
        </section>
      </div>

      <div className="dashboard-grid lower-grid">
        <section className="panel agenda-panel">
          <div className="panel-heading"><div><div className="title-with-dot"><span className="live-dot" /><h2>Coming up today</h2></div><p>Your day, at a glance.</p></div><Link to="/calendar" className="text-button">Open calendar <ArrowRight size={14} /></Link></div>
          <div className="agenda-list">{upcomingEvents.map((event) => <div className="agenda-item" key={`${event.time}-${event.title}`}><span className="agenda-time">{event.time}<small>{event.period}</small></span><i className={`agenda-marker ${event.color}`} /><div className="agenda-info"><strong>{event.title}</strong><span>{event.type} <i>·</i> {event.location}</span></div><span className="agenda-more" aria-hidden="true">···</span></div>)}</div>
          <button className="agenda-add" onClick={() => setShowAddTask(true)}><Plus size={15} /> Add to your day</button>
        </section>

        <section className="panel tasks-panel">
          <div className="panel-heading"><div><h2>Your tasks</h2><p>{tasksLoading ? 'Loading your tasks…' : `${doneCount} of ${tasks.length} done`} {!tasksLoading && tasks.length > 0 && <span className="task-progress-inline"><i style={{ width: `${(doneCount / tasks.length) * 100}%` }} /></span>}</p></div><button className="icon-button small-icon" aria-label="Add task" onClick={() => setShowAddTask(true)}><Plus size={17} /></button></div>
          <div className="task-list">
            {tasksLoading && <p className="task-feedback" role="status">Loading tasks…</p>}
            {!tasksLoading && taskLoadError && <div className="task-feedback task-feedback-error" role="alert"><span>{taskLoadError}</span><button type="button" onClick={retryTaskLoad}>Retry</button></div>}
            {!tasksLoading && !taskLoadError && tasks.length === 0 && <p className="task-feedback">No tasks yet. Add one to get started.</p>}
            {!tasksLoading && !taskLoadError && tasks.map((task) => {
              const isComplete = task.status === 'completed'
              const taskStatus = task.status === 'in_progress' ? 'In progress' : 'Personal task'
              const dueLabel = formatDueDate(task.due_at)
              return <label key={task.id} className={`task-row ${isComplete ? 'task-done' : ''}`}><input type="checkbox" checked={isComplete} disabled={updatingTaskId !== null} onChange={() => void toggleTask(task)} /><span className={`custom-check ${isComplete ? 'checked' : ''}`}>{isComplete && <Check size={12} />}</span><span className="task-color violet" /><span className="task-copy"><strong>{task.title}</strong><small>{taskStatus}</small></span><span className={`task-time ${dueLabel === 'Due today' ? 'due-today' : ''}`}>{dueLabel}</span></label>
            })}
          </div>
          {taskActionError && <p className="task-feedback task-feedback-error" role="alert">{taskActionError}</p>}
          {showAddTask && <form className="add-task-form" onSubmit={(event) => void addTask(event)}><input autoFocus maxLength={240} value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="What needs doing?" aria-label="New task title" disabled={savingTask} /><button type="submit" className="icon-button" aria-label="Save task" disabled={savingTask || !newTaskTitle.trim()}><Check size={16} /></button><button type="button" className="icon-button" aria-label="Cancel" disabled={savingTask} onClick={() => setShowAddTask(false)}>×</button></form>}
          <button className="all-tasks-link" onClick={() => setShowAddTask(true)}>Add a priority <ArrowRight size={14} /></button>
        </section>
      </div>

      <section className="coach-nudge"><span className="nudge-icon"><Sparkles size={18} /></span><div><span>YOUR LIFEOS COACH</span><p>Feeling a little behind? You can start with one small thing.</p></div><Link to="/ai-coach" className="coach-nudge-link">Let's make a plan <ArrowRight size={14} /></Link><span className="nudge-decoration">✳</span></section>
      <div className="dashboard-footnote"><span><ArrowDownRight size={13} /> Sample cards</span><span>Tasks, profile, and preferences are saved to your account; the other dashboard cards are examples.</span></div>
    </div>
  )
}
