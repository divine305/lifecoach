import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, CircleHelp, Clock3, Plus, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { initialTasks, upcomingEvents, weekActivity } from '../data/demo'

type Task = (typeof initialTasks)[number]

export function Dashboard() {
  const { profile, user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const doneCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks])
  const [dayContext] = useState(() => {
    const now = new Date()
    return {
      hour: now.getHours(),
      dateLabel: new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(now),
    }
  })
  const greeting = dayContext.hour < 12 ? 'Good morning' : dayContext.hour < 18 ? 'Good afternoon' : 'Good evening'
  const studentName = profile?.full_name || user?.email?.split('@')[0] || 'Student'

  const toggleTask = (id: number) => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task))
  const addTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newTaskTitle.trim()
    if (!title) return
    setTasks((current) => [...current, { id: Date.now(), title, course: 'Personal task', time: 'Added just now', done: false, color: 'violet' }])
    setNewTaskTitle('')
    setShowAddTask(false)
  }

  return (
    <div className="dashboard-page page-content">
      <div className="dashboard-welcome">
        <div><div className="welcome-date"><span className="date-dot" />{dayContext.dateLabel}</div><h1>{greeting}, {studentName} <span className="wave-emoji">✦</span></h1><p>Here's what's happening in your life today.</p></div>
        <span className="button button-quiet week-select">This week</span>
      </div>

      <div className="demo-banner"><Sparkles size={14} /><span><b>Preview mode</b> — This dashboard is showing sample information. Your account is active; personal tasks and schedules will connect in upcoming feature phases.</span><span aria-label="About demo data" title="This dashboard is populated with sample information."><CircleHelp size={15} /></span></div>

      <div className="stat-grid">
        <motion.article className="stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}><div className="stat-top"><span>Tasks completed</span><span className="stat-icon violet"><Check size={17} /></span></div><div className="stat-value">{doneCount}<small> / {tasks.length + 15}</small></div><div className="stat-foot"><span className="trend-positive"><TrendingUp size={13} /> 12%</span><span>vs. last week</span><div className="stat-sparkline spark-violet"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div></motion.article>
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
          <div className="panel-heading"><div><h2>Today's priorities</h2><p>{doneCount} of {tasks.length} done <span className="task-progress-inline"><i style={{ width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%` }} /></span></p></div><button className="icon-button small-icon" aria-label="Add task" onClick={() => setShowAddTask(true)}><Plus size={17} /></button></div>
          <div className="task-list">{tasks.map((task) => <label key={task.id} className={`task-row ${task.done ? 'task-done' : ''}`}><input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} /><span className={`custom-check ${task.done ? 'checked' : ''}`}>{task.done && <Check size={12} />}</span><span className={`task-color ${task.color}`} /><span className="task-copy"><strong>{task.title}</strong><small>{task.course}</small></span><span className={`task-time ${task.time === 'Due today' ? 'due-today' : ''}`}>{task.time}</span></label>)}</div>
          {showAddTask && <form className="add-task-form" onSubmit={addTask}><input autoFocus value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="What needs doing?" aria-label="New task title" /><button type="submit" className="icon-button" aria-label="Save task"><Check size={16} /></button><button type="button" className="icon-button" aria-label="Cancel" onClick={() => setShowAddTask(false)}>×</button></form>}
          <button className="all-tasks-link" onClick={() => setShowAddTask(true)}>Add a priority <ArrowRight size={14} /></button>
        </section>
      </div>

      <section className="coach-nudge"><span className="nudge-icon"><Sparkles size={18} /></span><div><span>YOUR LIFEOS COACH</span><p>Feeling a little behind? You can start with one small thing.</p></div><Link to="/ai-coach" className="coach-nudge-link">Let's make a plan <ArrowRight size={14} /></Link><span className="nudge-decoration">✳</span></section>
      <div className="dashboard-footnote"><span><ArrowDownRight size={13} /> Demo information only</span><span>Profile and preferences are saved; dashboard activity data will connect in a later feature phase.</span></div>
    </div>
  )
}
