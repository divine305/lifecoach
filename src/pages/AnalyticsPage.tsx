import { useCallback, useState } from 'react'
import { useOwnedRows } from '../lib/ownedRows'
import { localDateString } from '../lib/formValues'
import { supabase } from '../lib/supabase'

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(0, 0, 0, 0)
  return date
}

export function AnalyticsPage() {
  const loadTasks = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId).neq('status', 'cancelled')
    if (error) throw error
    return data ?? []
  }, [])
  const loadSessions = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('focus_sessions').select('*').eq('user_id', userId)
    if (error) throw error
    return data ?? []
  }, [])
  const loadCompletions = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('habit_completions').select('*').eq('user_id', userId)
    if (error) throw error
    return data ?? []
  }, [])
  const loadGrades = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('grade_records').select('*').eq('user_id', userId)
    if (error) throw error
    return data ?? []
  }, [])
  const tasks = useOwnedRows(loadTasks)
  const sessions = useOwnedRows(loadSessions)
  const completions = useOwnedRows(loadCompletions)
  const grades = useOwnedRows(loadGrades)
  const loading = tasks.loading || sessions.loading || completions.loading || grades.loading
  const error = tasks.error ?? sessions.error ?? completions.error ?? grades.error
  const [from] = useState(() => daysAgo(6))
  const recentSessions = sessions.rows.filter((session) => session.ended_at && new Date(session.ended_at) >= from)
  const focusSessions = recentSessions.filter((session) => session.session_type === 'focus')
  const focusSeconds = focusSessions.reduce((total, session) => total + (session.duration_seconds ?? 0), 0)
  const recentCompletions = completions.rows.filter((completion) => completion.completion_date >= localDateString(from))
  const completedTasks = tasks.rows.filter((task) => task.status === 'completed')
  const averageGrade = grades.rows.length
    ? grades.rows.reduce((total, grade) => total + grade.score / grade.maximum_score * 100, 0) / grades.rows.length
    : null
  const dayRows = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(from)
    day.setDate(day.getDate() + index)
    const date = localDateString(day)
    const taskCount = completedTasks.filter((task) => task.completed_at && localDateString(new Date(task.completed_at)) === date).length
    const focusMinutes = Math.round(focusSessions
      .filter((session) => session.ended_at && localDateString(new Date(session.ended_at)) === date)
      .reduce((total, session) => total + (session.duration_seconds ?? 0), 0) / 60)
    return { date, label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(day), taskCount, focusMinutes }
  })

  return (
    <div className="module-page page-content">
      <header className="workspace-page-heading"><span className="section-kicker">YOUR WORKSPACE</span><h1>Analytics</h1><p>Summaries are calculated from the tasks, focus sessions, habits, and grades in your account.</p></header>
      {error && <div className="workspace-error" role="alert">{error}<button type="button" onClick={() => { tasks.retry(); sessions.retry(); completions.retry(); grades.retry() }}>Retry</button></div>}
      <div className="workspace-metrics">
        <article><span>Tasks completed</span><strong>{loading ? '—' : completedTasks.length}</strong></article>
        <article><span>Focus this week</span><strong>{loading ? '—' : `${(focusSeconds / 3600).toFixed(1)} hrs`}</strong></article>
        <article><span>Habit check-ins this week</span><strong>{loading ? '—' : recentCompletions.length}</strong></article>
        <article><span>Average recorded score</span><strong>{loading ? '—' : averageGrade === null ? 'No grades yet' : `${averageGrade.toFixed(1)}%`}</strong></article>
      </div>
      <section className="panel analytics-activity">
        <div className="panel-heading"><div><h2>Recent activity</h2><p>Daily totals from your saved records.</p></div></div>
        {loading && <p className="workspace-state" role="status">Loading your activity…</p>}
        {!loading && !error && dayRows.every((day) => day.taskCount === 0 && day.focusMinutes === 0) && <p className="workspace-state">No completed tasks or focus sessions in the last seven days.</p>}
        {!loading && !error && <div className="analytics-day-list">{dayRows.map((day) => <article key={day.date}><span>{day.label}<small>{day.date.slice(5)}</small></span><strong>{day.taskCount} tasks</strong><strong>{day.focusMinutes} focus min</strong></article>)}</div>}
      </section>
    </div>
  )
}
