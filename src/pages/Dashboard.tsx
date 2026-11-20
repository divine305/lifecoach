import { useCallback, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Check, CircleDollarSign, Clock3, GraduationCap, Plus, Sparkles, Target } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { useOwnedRows } from '../lib/ownedRows'
import { localDateString } from '../lib/formValues'
import { supabase } from '../lib/supabase'
import type { AssignmentRow, ExamRow, HabitCompletionRow, HabitRow, TaskRow, TransactionRow, BudgetRow } from '../types/database'

function getTaskErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'An unexpected task error occurred.'
}

function formatDueDate(dueAt: string | null, todayKey: string) {
  if (!dueAt) return 'No due date'
  const date = new Date(dueAt)
  if (Number.isNaN(date.getTime())) return 'Due date unavailable'
  const formattedDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
  return localDateString(date) === todayKey ? 'Due today' : `Due ${formattedDate}`
}

function createTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

function createWeekRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start: start.toISOString(), end: end.toISOString() }
}

function createMonthRange() {
  const now = new Date()
  return {
    start: localDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: localDateString(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
  }
}

function formatShortDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date)
}

export function Dashboard() {
  const { profile, preferences, user } = useAuth()
  const [todayRange] = useState(createTodayRange)
  const [weekRange] = useState(createWeekRange)
  const [monthRange] = useState(createMonthRange)
  const todayKey = localDateString(new Date(todayRange.start))
  const [weekStart] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 6)
    date.setHours(0, 0, 0, 0)
    return date.toISOString()
  })
  const loadTasks = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId)
      .neq('status', 'cancelled').order('due_at', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data ?? []
  }, [])
  const loadEvents = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('calendar_events').select('*').eq('user_id', userId)
      .gte('starts_at', weekRange.start).lt('starts_at', weekRange.end).order('starts_at')
    if (error) throw error
    return data ?? []
  }, [weekRange])
  const loadSessions = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('focus_sessions').select('*').eq('user_id', userId)
      .gte('started_at', weekStart).order('started_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [weekStart])
  const loadGrades = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('grade_records').select('*').eq('user_id', userId)
    if (error) throw error
    return data ?? []
  }, [])
  const loadGoals = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId).eq('status', 'active')
    if (error) throw error
    return data ?? []
  }, [])
  const loadAssignments = useCallback(async (userId: string): Promise<AssignmentRow[]> => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const now = new Date()
    const horizon = new Date(now)
    horizon.setDate(horizon.getDate() + 30)
    const { data, error } = await supabase.from('assignments').select('*').eq('user_id', userId)
      .in('status', ['pending', 'in_progress']).gte('due_at', now.toISOString())
      .lt('due_at', horizon.toISOString()).order('due_at').limit(5)
    if (error) throw error
    return data ?? []
  }, [])
  const loadExams = useCallback(async (userId: string): Promise<ExamRow[]> => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const now = new Date()
    const horizon = new Date(now)
    horizon.setDate(horizon.getDate() + 30)
    const { data, error } = await supabase.from('exams').select('*').eq('user_id', userId)
      .gte('starts_at', now.toISOString()).lt('starts_at', horizon.toISOString())
      .order('starts_at').limit(5)
    if (error) throw error
    return data ?? []
  }, [])
  const loadHabits = useCallback(async (userId: string): Promise<HabitRow[]> => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId)
      .eq('is_active', true).order('name').limit(8)
    if (error) throw error
    return data ?? []
  }, [])
  const loadHabitCompletions = useCallback(async (userId: string): Promise<HabitCompletionRow[]> => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('habit_completions').select('*')
      .eq('user_id', userId).eq('completion_date', todayKey)
    if (error) throw error
    return data ?? []
  }, [todayKey])
  const loadTransactions = useCallback(async (userId: string): Promise<TransactionRow[]> => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId)
      .gte('transaction_date', monthRange.start).lt('transaction_date', monthRange.end)
      .order('transaction_date', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [monthRange])
  const loadBudgets = useCallback(async (userId: string): Promise<BudgetRow[]> => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('budgets').select('*').eq('user_id', userId)
      .lte('period_start', todayKey).gte('period_end', todayKey)
    if (error) throw error
    return data ?? []
  }, [todayKey])
  const tasksData = useOwnedRows(loadTasks)
  const eventsData = useOwnedRows(loadEvents)
  const sessionsData = useOwnedRows(loadSessions)
  const gradesData = useOwnedRows(loadGrades)
  const goalsData = useOwnedRows(loadGoals)
  const assignmentsData = useOwnedRows(loadAssignments)
  const examsData = useOwnedRows(loadExams)
  const habitsData = useOwnedRows(loadHabits)
  const habitCompletionsData = useOwnedRows(loadHabitCompletions)
  const transactionsData = useOwnedRows(loadTransactions)
  const budgetsData = useOwnedRows(loadBudgets)
  const [taskActionError, setTaskActionError] = useState<string | null>(null)
  const [savingTask, setSavingTask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const userId = user?.id
  const tasks = tasksData.rows
  const doneCount = tasks.filter((task) => task.status === 'completed').length
  const weekFocusSeconds = sessionsData.rows.filter((session) => session.session_type === 'focus')
    .reduce((total, session) => total + (session.duration_seconds ?? 0), 0)
  const averageGrade = gradesData.rows.length
    ? gradesData.rows.reduce((total, grade) => total + grade.score / grade.maximum_score * 100, 0) / gradesData.rows.length
    : null
  const incomeThisMonth = transactionsData.rows
    .filter((transaction) => transaction.transaction_type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const spendingThisMonth = transactionsData.rows
    .filter((transaction) => transaction.transaction_type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const budgetThisMonth = budgetsData.rows.reduce((total, budget) => total + budget.amount, 0)
  const formatMoney = (amount: number) => new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: preferences?.preferred_currency ?? 'USD',
  }).format(amount)
  const [dayContext] = useState(() => {
    const now = new Date()
    return {
      hour: now.getHours(),
      nowIso: now.toISOString(),
      dateLabel: new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now),
      monthLabel: new Intl.DateTimeFormat(undefined, { month: 'long' }).format(now),
    }
  })
  const greeting = dayContext.hour < 12 ? 'Good morning' : dayContext.hour < 18 ? 'Good afternoon' : 'Good evening'
  const studentName = profile?.full_name || user?.email?.split('@')[0] || 'Student'
  const weekDoneCount = tasks.filter((task) => task.status === 'completed' && task.completed_at &&
    task.completed_at >= weekStart && task.completed_at <= dayContext.nowIso).length
  const activity = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + index)
    const dateKey = localDateString(date)
    const focusSeconds = sessionsData.rows
      .filter((session) => session.session_type === 'focus' && session.ended_at && localDateString(new Date(session.ended_at)) === dateKey)
      .reduce((total, session) => total + (session.duration_seconds ?? 0), 0)
    const tasksDone = tasks.filter((task) => task.status === 'completed' && task.completed_at &&
      localDateString(new Date(task.completed_at)) === dateKey).length
    return {
      day: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
      focus: Number((focusSeconds / 3600).toFixed(2)),
      tasks: tasksDone,
    }
  }), [sessionsData.rows, tasks, weekStart])
  const auxiliaryError = tasksData.error ?? eventsData.error ?? sessionsData.error ?? gradesData.error ??
    goalsData.error ?? assignmentsData.error ?? examsData.error ?? habitsData.error ??
    habitCompletionsData.error ?? transactionsData.error ?? budgetsData.error
  const activityHasError = Boolean(tasksData.error || sessionsData.error)
  const todayEvents = eventsData.rows.filter((event) => localDateString(new Date(event.starts_at)) === todayKey)
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekRange.start)
    date.setDate(date.getDate() + index)
    const dateKey = localDateString(date)
    return {
      dateKey,
      dayLabel: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
      dateNumber: new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(date),
      events: eventsData.rows.filter((event) => localDateString(new Date(event.starts_at)) === dateKey),
    }
  })
  const completedHabitIds = new Set(habitCompletionsData.rows.map((completion) => completion.habit_id))
  const monthlyLoading = transactionsData.loading || budgetsData.loading
  const habitsLoading = habitsData.loading || habitCompletionsData.loading

  const toggleTask = async (task: TaskRow) => {
    if (!supabase || !userId) {
      setTaskActionError('Sign in to update tasks.')
      return
    }
    const isComplete = task.status === 'completed'
    setUpdatingTaskId(task.id)
    setTaskActionError(null)
    try {
      const { data, error } = await supabase.from('tasks').update({
        status: isComplete ? 'todo' : 'completed',
        completed_at: isComplete ? null : new Date().toISOString(),
      }).eq('id', task.id).eq('user_id', userId).select('*').single()
      if (error) throw error
      tasksData.updateRows((current) => current.map((currentTask) => currentTask.id === task.id ? data : currentTask))
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
    if (tasksData.error) {
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
      const { data, error } = await supabase.from('tasks').insert({ user_id: userId, title }).select('*').single()
      if (error) throw error
      tasksData.updateRows((current) => [...current, data])
      setNewTaskTitle('')
      setShowAddTask(false)
    } catch (error: unknown) {
      setTaskActionError(getTaskErrorMessage(error))
    } finally {
      setSavingTask(false)
    }
  }

  const retryDashboard = () => {
    tasksData.retry()
    eventsData.retry()
    sessionsData.retry()
    gradesData.retry()
    goalsData.retry()
    assignmentsData.retry()
    examsData.retry()
    habitsData.retry()
    habitCompletionsData.retry()
    transactionsData.retry()
    budgetsData.retry()
  }

  return (
    <div className="dashboard-page page-content">
      <div className="dashboard-welcome">
        <div><div className="welcome-date"><span className="date-dot" />{dayContext.dateLabel}</div><h1>{greeting}, {studentName} <span className="wave-emoji">✦</span></h1><p>Your saved tasks, schedule, and progress at a glance.</p></div>
        <div className="dashboard-quick-actions">
          <Link to="/focus" className="button button-primary"><Clock3 size={15} /> Start studying</Link>
          <Link to="/ai-coach" className="button button-quiet week-select"><Sparkles size={14} /> Ask your coach</Link>
        </div>
      </div>

      {auxiliaryError && <div className="workspace-error dashboard-error" role="alert">{auxiliaryError}<button type="button" onClick={retryDashboard}>Retry</button></div>}

      <div className="stat-grid">
        <motion.article className="stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}><div className="stat-top"><span>Tasks completed</span><span className="stat-icon violet"><Check size={17} /></span></div><div className="stat-value">{tasksData.loading ? '—' : doneCount}<small> / {tasksData.loading ? '—' : tasks.length}</small></div><div className="stat-foot"><span>From your saved tasks</span></div></motion.article>
        <motion.article className="stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}><div className="stat-top"><span>Focus this week</span><span className="stat-icon blue"><Clock3 size={17} /></span></div><div className="stat-value">{sessionsData.loading ? '—' : (weekFocusSeconds / 3600).toFixed(1)}<small> hrs</small></div><div className="stat-foot"><span>{sessionsData.loading ? 'Loading sessions…' : `${sessionsData.rows.length} sessions`}</span></div></motion.article>
        <motion.article className="stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}><div className="stat-top"><span>Average recorded score</span><span className="stat-icon orange"><Target size={17} /></span></div><div className="stat-value">{gradesData.loading ? '—' : averageGrade === null ? '—' : averageGrade.toFixed(1)}<small>{averageGrade === null ? '' : '%'}</small></div><div className="stat-foot"><span>{gradesData.loading ? 'Loading grades…' : averageGrade === null ? 'Add grades in Academics' : `${gradesData.rows.length} grade records`}</span></div></motion.article>
        <motion.article className="stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}><div className="stat-top"><span>Active goals</span><span className="stat-icon green"><Sparkles size={17} /></span></div><div className="stat-value">{goalsData.loading ? '—' : goalsData.rows.length}</div><div className="stat-foot"><span>From your saved goals</span></div></motion.article>
      </div>

      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-heading"><div><h2>Your activity</h2><p>Focus sessions and completed tasks from the past seven days.</p></div></div>
          <div className="activity-legend"><span><i className="legend-violet" /> Focus hours</span><span><i className="legend-blue" /> Tasks done</span></div>
          {(tasksData.loading || sessionsData.loading) && <p className="workspace-state" role="status">Loading your activity…</p>}
          {!tasksData.loading && !sessionsData.loading && !activityHasError && activity.every((day) => day.focus === 0 && day.tasks === 0)
            ? <p className="workspace-state">No activity recorded this week.</p>
            : !tasksData.loading && !sessionsData.loading && !activityHasError && <div className="activity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activity} margin={{ top: 12, right: 4, left: -22, bottom: 0 }}><defs><linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient><linearGradient id="taskFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5ca8f6" stopOpacity={0.12} /><stop offset="100%" stopColor="#5ca8f6" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-faint)', fontSize: 11 }} dy={10} /><Tooltip contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }} /><Area type="monotone" dataKey="focus" name="Focus hours" stroke="#9c7af9" strokeWidth={2.3} fill="url(#focusFill)" /><Area type="monotone" dataKey="tasks" name="Tasks done" stroke="#64abf5" strokeWidth={2} fill="url(#taskFill)" /></AreaChart></ResponsiveContainer></div>}
        </section>

        <section className="panel rhythm-panel">
          <div className="panel-heading"><div><h2>This week</h2><p>Counts from your saved records.</p></div></div>
          <div className="dashboard-summary-list">
            <div><span>Focus sessions</span><strong>{sessionsData.loading ? '—' : sessionsData.rows.filter((session) => session.session_type === 'focus' && session.ended_at).length}</strong></div>
            <div><span>Tasks completed</span><strong>{tasksData.loading ? '—' : weekDoneCount}</strong></div>
            <div><span>Goals in progress</span><strong>{goalsData.loading ? '—' : goalsData.rows.length}</strong></div>
          </div>
          <Link to="/analytics" className="text-button">View analytics <ArrowRight size={14} /></Link>
        </section>
      </div>

      <div className="dashboard-grid lower-grid">
        <section className="panel agenda-panel">
          <div className="panel-heading"><div><h2>Today’s schedule</h2><p>Your calendar events for today.</p></div><Link to="/calendar" className="text-button">Open calendar <ArrowRight size={14} /></Link></div>
          {eventsData.loading && <p className="workspace-state" role="status">Loading today’s events…</p>}
          {!eventsData.loading && !eventsData.error && todayEvents.length === 0 && <p className="workspace-state">No events scheduled for today.</p>}
          {!eventsData.loading && !eventsData.error && <div className="agenda-list">{todayEvents.slice(0, 4).map((event) => <div className="agenda-item" key={event.id}><span className="agenda-time">{new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(event.starts_at))}</span><i className={`agenda-marker ${event.event_type === 'deadline' ? 'orange' : event.event_type === 'study' ? 'blue' : 'violet'}`} /><div className="agenda-info"><strong>{event.title}</strong><span>{event.event_type}{event.location ? ` · ${event.location}` : ''}</span></div></div>)}</div>}
          <Link to="/calendar" className="agenda-add"><Plus size={15} /> Add an event</Link>
        </section>

        <section className="panel tasks-panel">
          <div className="panel-heading"><div><h2>Your tasks</h2><p>{tasksData.loading ? 'Loading your tasks…' : `${doneCount} of ${tasks.length} done`} {!tasksData.loading && tasks.length > 0 && <span className="task-progress-inline"><i style={{ width: `${(doneCount / tasks.length) * 100}%` }} /></span>}</p></div><button className="icon-button small-icon" aria-label="Add task" disabled={tasksData.loading || Boolean(tasksData.error)} onClick={() => setShowAddTask(true)}><Plus size={17} /></button></div>
          <div className="task-list">
            {tasksData.loading && <p className="task-feedback" role="status">Loading tasks…</p>}
            {!tasksData.loading && tasksData.error && <div className="task-feedback task-feedback-error" role="alert"><span>{tasksData.error}</span><button type="button" onClick={tasksData.retry}>Retry</button></div>}
            {!tasksData.loading && !tasksData.error && tasks.length === 0 && <p className="task-feedback">No tasks yet. Add one to get started.</p>}
            {!tasksData.loading && !tasksData.error && tasks.slice(0, 5).map((task) => {
              const isComplete = task.status === 'completed'
              const taskStatus = isComplete ? 'Completed' : task.status === 'in_progress' ? 'In progress' : 'To do'
              const dueLabel = formatDueDate(task.due_at, todayKey)
              return <label key={task.id} className={`task-row ${isComplete ? 'task-done' : ''}`}><input type="checkbox" checked={isComplete} disabled={updatingTaskId !== null} onChange={() => void toggleTask(task)} /><span className={`custom-check ${isComplete ? 'checked' : ''}`}>{isComplete && <Check size={12} />}</span><span className="task-color violet" /><span className="task-copy"><strong>{task.title}</strong><small>{taskStatus}</small></span><span className={`task-time ${dueLabel === 'Due today' ? 'due-today' : ''}`}>{dueLabel}</span></label>
            })}
          </div>
          {taskActionError && <p className="task-feedback task-feedback-error" role="alert">{taskActionError}</p>}
          {showAddTask && <form className="add-task-form" onSubmit={(event) => void addTask(event)}><input autoFocus maxLength={240} value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="What needs doing?" aria-label="New task title" disabled={savingTask} /><button type="submit" className="icon-button" aria-label="Save task" disabled={savingTask || !newTaskTitle.trim()}><Check size={16} /></button><button type="button" className="icon-button" aria-label="Cancel" disabled={savingTask} onClick={() => setShowAddTask(false)}>×</button></form>}
          <Link to="/planner" className="all-tasks-link">Open planner <ArrowRight size={14} /></Link>
        </section>
      </div>

      <section className="panel timetable-panel">
        <div className="panel-heading">
          <div><h2>Your week</h2><p>Lectures, study sessions, and events from your calendar.</p></div>
          <Link to="/calendar" className="text-button">Open calendar <ArrowRight size={14} /></Link>
        </div>
        {eventsData.loading && <p className="workspace-state" role="status">Loading your week…</p>}
        {!eventsData.loading && !eventsData.error && eventsData.rows.length === 0 && <p className="workspace-state">No events saved for the next seven days.</p>}
        {!eventsData.loading && !eventsData.error && eventsData.rows.length > 0 && (
          <div className="timetable-scroll">
            <div className="timetable-grid">
              {weekDays.map((day) => (
                <article className={`timetable-day ${day.dateKey === todayKey ? 'timetable-today' : ''}`} key={day.dateKey}>
                  <div className="timetable-day-heading"><strong>{day.dayLabel}</strong><span>{day.dateNumber}</span></div>
                  {day.events.length === 0
                    ? <span className="timetable-empty">—</span>
                    : <div className="timetable-events">{day.events.map((event) => (
                      <div className={`timetable-event timetable-${event.event_type}`} key={event.id}>
                        <strong>{event.title}</strong>
                        <span>{new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(event.starts_at))}</span>
                      </div>
                    ))}</div>}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="dashboard-grid dashboard-academics-grid">
        <section className="panel deadlines-panel">
          <div className="panel-heading"><div><h2>Upcoming assignments</h2><p>Due in the next 30 days.</p></div><BookOpen size={17} className="dashboard-section-icon" /></div>
          {assignmentsData.loading && <p className="workspace-state" role="status">Loading assignments…</p>}
          {!assignmentsData.loading && !assignmentsData.error && assignmentsData.rows.length === 0 && <p className="workspace-state">No upcoming assignment deadlines recorded.</p>}
          {!assignmentsData.loading && !assignmentsData.error && assignmentsData.rows.map((assignment) => (
            <article className="dashboard-upcoming-row" key={assignment.id}>
              <span className="upcoming-marker assignment-marker" />
              <div><strong>{assignment.title}</strong><small>{formatShortDate(assignment.due_at)}</small></div>
              <span className="upcoming-status">{assignment.status.replace('_', ' ')}</span>
            </article>
          ))}
          <Link to="/academics/assignments" className="text-button">Manage assignments <ArrowRight size={14} /></Link>
        </section>
        <section className="panel exams-panel">
          <div className="panel-heading"><div><h2>Upcoming examinations</h2><p>Exams and quizzes in the next 30 days.</p></div><GraduationCap size={18} className="dashboard-section-icon" /></div>
          {examsData.loading && <p className="workspace-state" role="status">Loading examinations…</p>}
          {!examsData.loading && !examsData.error && examsData.rows.length === 0 && <p className="workspace-state">No upcoming exams recorded.</p>}
          {!examsData.loading && !examsData.error && examsData.rows.map((exam) => (
            <article className="dashboard-upcoming-row" key={exam.id}>
              <span className="upcoming-marker exam-marker" />
              <div><strong>{exam.title}</strong><small>{formatShortDate(exam.starts_at)} · {exam.exam_type}</small></div>
              {exam.location && <span className="upcoming-status">{exam.location}</span>}
            </article>
          ))}
          <Link to="/academics/exams" className="text-button">Manage exams <ArrowRight size={14} /></Link>
        </section>
      </div>

      <div className="dashboard-grid dashboard-personal-grid">
        <section className="panel habits-panel">
          <div className="panel-heading"><div><h2>Daily habits</h2><p>Progress from today’s check-ins.</p></div><Target size={17} className="dashboard-section-icon" /></div>
          {habitsLoading && <p className="workspace-state" role="status">Loading your habits…</p>}
          {!habitsLoading && !habitsData.error && !habitCompletionsData.error && habitsData.rows.length === 0 && <p className="workspace-state">No active habits yet. Add one to start building consistency.</p>}
          {!habitsLoading && !habitsData.error && !habitCompletionsData.error && habitsData.rows.map((habit) => (
            <article className="habit-progress-row" key={habit.id}>
              <span className={`habit-check ${completedHabitIds.has(habit.id) ? 'habit-checked' : ''}`}>{completedHabitIds.has(habit.id) && <Check size={12} />}</span>
              <span>{habit.name}</span>
              <small>{completedHabitIds.has(habit.id) ? 'Done today' : 'Not checked in'}</small>
            </article>
          ))}
          <Link to="/habits" className="text-button">View habits <ArrowRight size={14} /></Link>
        </section>
        <section className="panel finance-summary-panel">
          <div className="panel-heading"><div><h2>This month’s finances</h2><p>{dayContext.monthLabel} · from your saved records</p></div><CircleDollarSign size={17} className="dashboard-section-icon" /></div>
          {monthlyLoading && <p className="workspace-state" role="status">Loading your finances…</p>}
          {!monthlyLoading && !transactionsData.error && transactionsData.rows.length === 0 && <p className="workspace-state">No transactions recorded this month.</p>}
          {!monthlyLoading && !transactionsData.error && (
            <div className="finance-summary-metrics">
              <div><span>Income</span><strong>{formatMoney(incomeThisMonth)}</strong></div>
              <div><span>Spending</span><strong>{formatMoney(spendingThisMonth)}</strong></div>
              <div><span>Net</span><strong>{formatMoney(incomeThisMonth - spendingThisMonth)}</strong></div>
            </div>
          )}
          {!monthlyLoading && !budgetsData.error && <p className="finance-budget-note">{budgetsData.rows.length > 0 ? `${formatMoney(budgetThisMonth)} budgeted across active budgets` : 'No active budgets for this month.'}</p>}
          <Link to="/finance" className="text-button">Open finances <ArrowRight size={14} /></Link>
        </section>
      </div>

      <section className="coach-nudge"><span className="nudge-icon"><Sparkles size={18} /></span><div><span>WEEKLY REVIEW</span><p>Write down what you want to carry forward into next week.</p></div><Link to="/review" className="coach-nudge-link">Open review <ArrowRight size={14} /></Link><span className="nudge-decoration">✳</span></section>
      <div className="dashboard-footnote"><span><Check size={13} /> Personal data</span><span>Metrics are calculated from your account records.</span></div>
    </div>
  )
}
