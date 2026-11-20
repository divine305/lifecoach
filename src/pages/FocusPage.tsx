import { useCallback, useEffect, useState } from 'react'
import { Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { useOwnedRows } from '../lib/ownedRows'
import { formatDateTime } from '../lib/formValues'
import { supabase } from '../lib/supabase'
import type { FocusSessionRow } from '../types/database'

const sessionDurations: Record<FocusSessionRow['session_type'], number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
}

function messageFromError(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return fallback
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  if (hours > 0) {
    return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':')
  }
  return [minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':')
}

function elapsedSeconds(session: FocusSessionRow, now: number) {
  const stored = session.duration_seconds ?? 0
  if (session.paused_at) return stored
  const segmentStart = new Date(session.resumed_at ?? session.started_at).getTime()
  return stored + Math.max(0, Math.floor((now - segmentStart) / 1000))
}

function remainingSeconds(session: FocusSessionRow, now: number) {
  if (session.planned_duration_seconds === null) return null
  const remaining = session.remaining_seconds ?? session.planned_duration_seconds
  if (session.paused_at) return remaining
  const segmentStart = new Date(session.resumed_at ?? session.started_at).getTime()
  const elapsed = Math.max(0, Math.floor((now - segmentStart) / 1000))
  return Math.max(0, remaining - elapsed)
}

export function FocusPage() {
  const loadSessions = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('focus_sessions').select('*')
      .eq('user_id', userId).order('started_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadSessions)
  const [now, setNow] = useState(() => Date.now())
  const [sessionType, setSessionType] = useState<FocusSessionRow['session_type']>('focus')
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [autoFinishAttempted, setAutoFinishAttempted] = useState<string | null>(null)
  const activeSession = rows.find((session) => session.ended_at === null)
  const elapsed = activeSession ? elapsedSeconds(activeSession, now) : 0
  const remaining = activeSession ? remainingSeconds(activeSession, now) : null
  const displaySeconds = activeSession
    ? remaining ?? elapsed
    : sessionDurations[sessionType]

  useEffect(() => {
    if (!activeSession || activeSession.paused_at) return
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [activeSession])

  const finishSession = useCallback(async (completed: boolean) => {
    if (!supabase || !userId || !activeSession) return
    setActionError(null)
    setSaving(true)
    try {
      const endedAt = new Date()
      const durationSeconds = elapsedSeconds(activeSession, endedAt.getTime())
      const { data, error: updateError } = await supabase.from('focus_sessions').update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        remaining_seconds: completed ? 0 : remainingSeconds(activeSession, endedAt.getTime()),
        paused_at: null,
        resumed_at: null,
        completed,
      }).eq('id', activeSession.id).eq('user_id', userId).select('*').single()
      if (updateError) throw updateError
      updateRows((current) => current.map((session) => session.id === data.id ? data : session))
    } catch (error: unknown) {
      setActionError(messageFromError(error, 'The focus session could not be saved.'))
    } finally {
      setSaving(false)
    }
  }, [activeSession, updateRows, userId])

  useEffect(() => {
    if (!activeSession || activeSession.planned_duration_seconds === null || activeSession.paused_at ||
      remaining !== 0 || autoFinishAttempted === activeSession.id) return
    setAutoFinishAttempted(activeSession.id)
    void finishSession(true)
  }, [activeSession, autoFinishAttempted, finishSession, remaining])

  const startSession = async () => {
    if (!supabase || !userId) {
      setActionError('Sign in to start a focus session.')
      return
    }
    setActionError(null)
    setSaving(true)
    try {
      const startedAt = new Date().toISOString()
      const duration = sessionDurations[sessionType]
      const { data, error: insertError } = await supabase.from('focus_sessions').insert({
        user_id: userId,
        started_at: startedAt,
        resumed_at: startedAt,
        session_type: sessionType,
        planned_duration_seconds: duration,
        remaining_seconds: duration,
        duration_seconds: 0,
        completed: false,
      }).select('*').single()
      if (insertError) throw insertError
      setNow(Date.now())
      setAutoFinishAttempted(null)
      updateRows((current) => [data, ...current])
    } catch (error: unknown) {
      setActionError(messageFromError(error, 'The focus session could not be started.'))
    } finally {
      setSaving(false)
    }
  }

  const togglePause = async () => {
    if (!supabase || !userId || !activeSession) return
    setActionError(null)
    setSaving(true)
    try {
      const changedAt = new Date()
      const patch = activeSession.paused_at
        ? { paused_at: null, resumed_at: changedAt.toISOString() }
        : {
            paused_at: changedAt.toISOString(),
            resumed_at: null,
            duration_seconds: elapsedSeconds(activeSession, changedAt.getTime()),
            remaining_seconds: remainingSeconds(activeSession, changedAt.getTime()),
          }
      const { data, error: updateError } = await supabase.from('focus_sessions').update(patch)
        .eq('id', activeSession.id).eq('user_id', userId).select('*').single()
      if (updateError) throw updateError
      setNow(changedAt.getTime())
      updateRows((current) => current.map((session) => session.id === data.id ? data : session))
    } catch (error: unknown) {
      setActionError(messageFromError(error, 'The focus session could not be updated.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-page page-content">
      <header className="workspace-page-heading">
        <span className="section-kicker">YOUR WORKSPACE</span>
        <h1>Focus mode</h1>
        <p>Use a 25-minute study session, a 5-minute short break, or a 15-minute long break. Paused sessions resume after reload.</p>
      </header>
      <div className="workspace-grid">
        <section className="panel focus-timer-panel">
          <div className="focus-timer-icon"><Timer size={20} /></div>
          <p>{activeSession ? `${activeSession.session_type.replace('_', ' ')} session` : 'Choose a session'}</p>
          <strong className="focus-timer" aria-live="polite">{formatDuration(displaySeconds)}</strong>
          {activeSession && <p className="focus-session-state">{activeSession.paused_at ? 'Paused' : remaining === 0 ? 'Session complete' : 'In progress'}</p>}
          {!activeSession && (
            <label className="workspace-field focus-type-field">
              <span>Session type</span>
              <select value={sessionType} onChange={(event) => setSessionType(event.target.value as FocusSessionRow['session_type'])}>
                <option value="focus">Study · 25 minutes</option>
                <option value="short_break">Short break · 5 minutes</option>
                <option value="long_break">Long break · 15 minutes</option>
              </select>
            </label>
          )}
          {actionError && <p className="workspace-error" role="alert">{actionError}</p>}
          {activeSession ? (
            <div className="focus-controls">
              {remaining === 0 && activeSession.planned_duration_seconds !== null
                ? <button type="button" className="button button-primary focus-control-button" disabled={saving || loading || Boolean(error)} onClick={() => void finishSession(true)}><RotateCcw size={15} /> Save completed session</button>
                : <button type="button" className="button button-primary focus-control-button" disabled={saving || loading || Boolean(error)} onClick={() => void togglePause()}>{saving ? 'Saving…' : activeSession.paused_at ? <><Play size={15} /> Resume</> : <><Pause size={15} /> Pause</>}</button>}
              <button type="button" className="button button-quiet focus-control-button" disabled={saving || loading || Boolean(error)} onClick={() => void finishSession(Boolean(activeSession.planned_duration_seconds !== null && remaining === 0))}>End session</button>
            </div>
          ) : (
            <button type="button" className="button button-primary focus-control-button" disabled={loading || saving || Boolean(error)} onClick={() => void startSession()}>
              {saving ? 'Saving…' : <><Play size={15} /> Start studying</>}
            </button>
          )}
          {error && <div className="workspace-state workspace-error" role="alert"><span>{error}</span><button type="button" onClick={retry}>Retry</button></div>}
        </section>
        <section className="panel focus-history-panel">
          <div className="panel-heading"><div><h2>Study history</h2><p>{loading ? 'Loading sessions…' : `${rows.filter((session) => session.ended_at && session.session_type === 'focus').length} completed study sessions`}</p></div></div>
          {loading && <p className="workspace-state" role="status">Loading your sessions…</p>}
          {!loading && !error && rows.filter((session) => session.ended_at && session.session_type === 'focus').length === 0 && <p className="workspace-state">Completed study sessions will appear here.</p>}
          {!loading && !error && rows.filter((session) => session.ended_at && session.session_type === 'focus').map((session) => (
            <article className="workspace-record" key={session.id}>
              <div className="workspace-record-copy"><strong>{formatDuration(session.duration_seconds ?? 0)} study session</strong><small>{formatDateTime(session.started_at)}</small></div>
              <span className="workspace-record-status">{session.completed ? 'Completed' : 'Ended early'}</span>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
