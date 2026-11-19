import { useCallback, useEffect, useState } from 'react'
import { Pause, Play, Timer } from 'lucide-react'
import { useOwnedRows } from '../lib/ownedRows'
import { formatDateTime } from '../lib/formValues'
import { supabase } from '../lib/supabase'
import type { FocusSessionRow } from '../types/database'

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
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':')
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
  const activeSession = rows.find((session) => session.ended_at === null)
  const elapsed = activeSession
    ? Math.max(0, Math.floor((now - new Date(activeSession.started_at).getTime()) / 1000))
    : 0

  useEffect(() => {
    if (!activeSession) return
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [activeSession])

  const startSession = async () => {
    if (!supabase || !userId) {
      setActionError('Sign in to start a focus session.')
      return
    }
    setActionError(null)
    setSaving(true)
    try {
      const { data, error: insertError } = await supabase.from('focus_sessions').insert({
        user_id: userId,
        started_at: new Date().toISOString(),
        session_type: sessionType,
        completed: false,
      }).select('*').single()
      if (insertError) throw insertError
      updateRows((current) => [data, ...current])
    } catch (error: unknown) {
      setActionError(messageFromError(error, 'The focus session could not be started.'))
    } finally {
      setSaving(false)
    }
  }

  const finishSession = async () => {
    if (!supabase || !userId || !activeSession) return
    setActionError(null)
    setSaving(true)
    try {
      const endedAt = new Date()
      const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - new Date(activeSession.started_at).getTime()) / 1000))
      const { data, error: updateError } = await supabase.from('focus_sessions').update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        completed: true,
      }).eq('id', activeSession.id).eq('user_id', userId).select('*').single()
      if (updateError) throw updateError
      updateRows((current) => current.map((session) => session.id === data.id ? data : session))
    } catch (error: unknown) {
      setActionError(messageFromError(error, 'The focus session could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-page page-content">
      <header className="workspace-page-heading"><span className="section-kicker">YOUR WORKSPACE</span><h1>Focus mode</h1><p>Start a focus or break session. Active sessions are saved, so you can resume after reloading.</p></header>
      <div className="workspace-grid">
        <section className="panel focus-timer-panel">
          <div className="focus-timer-icon"><Timer size={20} /></div>
          <p>{activeSession ? `${activeSession.session_type.replace('_', ' ')} session` : 'Choose a session'}</p>
          <strong className="focus-timer">{formatDuration(elapsed)}</strong>
          {!activeSession && <label className="workspace-field focus-type-field"><span>Session type</span><select value={sessionType} onChange={(event) => setSessionType(event.target.value as FocusSessionRow['session_type'])}><option value="focus">Focus</option><option value="short_break">Short break</option><option value="long_break">Long break</option></select></label>}
          {actionError && <p className="workspace-error" role="alert">{actionError}</p>}
          <button type="button" className="button button-primary focus-control-button" disabled={loading || saving || Boolean(error)} onClick={() => void (activeSession ? finishSession() : startSession())}>
            {saving ? 'Saving…' : activeSession ? <><Pause size={15} /> Finish session</> : <><Play size={15} /> Start session</>}
          </button>
          {error && <div className="workspace-state workspace-error" role="alert"><span>{error}</span><button type="button" onClick={retry}>Retry</button></div>}
        </section>
        <section className="panel focus-history-panel">
          <div className="panel-heading"><div><h2>Session history</h2><p>{loading ? 'Loading sessions…' : `${rows.filter((session) => session.ended_at).length} completed sessions`}</p></div></div>
          {loading && <p className="workspace-state" role="status">Loading your sessions…</p>}
          {!loading && !error && rows.filter((session) => session.ended_at).length === 0 && <p className="workspace-state">Completed focus sessions will appear here.</p>}
          {!loading && !error && rows.filter((session) => session.ended_at).map((session) => (
            <article className="workspace-record" key={session.id}>
              <div className="workspace-record-copy"><strong>{session.session_type.replace('_', ' ')}</strong><small>{formatDateTime(session.started_at)}</small></div>
              <span className="workspace-record-status">{formatDuration(session.duration_seconds ?? 0)}</span>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
