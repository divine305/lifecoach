import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, LoaderCircle, MessageCircle, Plus, Send, Sparkles } from 'lucide-react'
import { useOwnedRows } from '../lib/ownedRows'
import { formatDateTime } from '../lib/formValues'
import { supabase } from '../lib/supabase'
import type { AiConversationRow, AiMessageRow, Json } from '../types/database'

type ProposedAction = {
  id: string
  kind: 'create_task' | 'create_calendar_event'
  title: string
  description: string | null
  due_at: string | null
  starts_at: string | null
  ends_at: string | null
  event_type: 'lecture' | 'study' | 'personal' | 'appointment' | 'deadline' | null
  status?: 'created'
}

type CoachExchange = {
  conversation: AiConversationRow
  userMessage: AiMessageRow
  assistantMessage: AiMessageRow
  actions: ProposedAction[]
}

function messageFromError(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isConversation(value: unknown): value is AiConversationRow {
  return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string' &&
    typeof value.user_id === 'string' && typeof value.created_at === 'string' && typeof value.updated_at === 'string'
}

function isMessage(value: unknown): value is AiMessageRow {
  return isRecord(value) && typeof value.id === 'string' && typeof value.user_id === 'string' &&
    typeof value.conversation_id === 'string' && (value.role === 'user' || value.role === 'assistant') &&
    typeof value.content === 'string' && typeof value.created_at === 'string' && isRecord(value.metadata)
}

function isProposal(value: unknown): value is ProposedAction {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string') return false
  if (value.kind !== 'create_task' && value.kind !== 'create_calendar_event') return false
  return (value.description === null || typeof value.description === 'string') &&
    (value.due_at === null || typeof value.due_at === 'string') &&
    (value.starts_at === null || typeof value.starts_at === 'string') &&
    (value.ends_at === null || typeof value.ends_at === 'string') &&
    (value.event_type === null || ['lecture', 'study', 'personal', 'appointment', 'deadline'].includes(String(value.event_type))) &&
    (value.status === undefined || value.status === 'created')
}

function parseExchange(value: unknown): CoachExchange {
  if (!isRecord(value) || !isConversation(value.conversation) || !isMessage(value.userMessage) ||
    !isMessage(value.assistantMessage) || !Array.isArray(value.actions) || !value.actions.every(isProposal)) {
    throw new Error('The AI coach returned an unexpected response. Try again.')
  }
  return value as unknown as CoachExchange
}

function proposalsFor(message: AiMessageRow) {
  if (message.role !== 'assistant' || !isRecord(message.metadata)) return []
  const actions = message.metadata.actions
  return Array.isArray(actions) ? actions.filter(isProposal) : []
}

function metadataWithProposalStatus(metadata: Json, proposalId: string): Json {
  if (!isRecord(metadata) || !Array.isArray(metadata.actions)) return metadata
  return {
    ...metadata,
    actions: metadata.actions.map((action) => isProposal(action) && action.id === proposalId
      ? { ...action, status: 'created' }
      : action),
  } as Json
}

function sendErrorMessage(error: unknown) {
  const message = messageFromError(error, 'The AI coach could not respond.')
  if (/failed to fetch|network|load failed/i.test(message)) {
    return 'Could not reach the AI coach. Check your connection and confirm the Supabase AI coach function is deployed.'
  }
  return message
}

export function AiCoachPage() {
  const loadConversations = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('ai_conversations').select('*')
      .eq('user_id', userId).order('updated_at', { ascending: false }).limit(50)
    if (error) throw error
    return data ?? []
  }, [])
  const conversations = useOwnedRows(loadConversations)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)

  useEffect(() => {
    if (selectedConversationId || creatingNew || conversations.rows.length === 0) return
    setSelectedConversationId(conversations.rows[0].id)
  }, [conversations.rows, creatingNew, selectedConversationId])

  const startNewConversation = () => {
    setSelectedConversationId(null)
    setCreatingNew(true)
  }

  const updateConversation = (conversation: AiConversationRow) => {
    conversations.updateRows((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at)))
    setSelectedConversationId(conversation.id)
    setCreatingNew(false)
  }

  const activeConversation = conversations.rows.find((item) => item.id === selectedConversationId) ?? null
  const threadConversationId = creatingNew ? null : activeConversation?.id ?? null

  return (
    <div className="module-page page-content">
      <header className="workspace-page-heading">
        <span className="section-kicker">YOUR WORKSPACE</span>
        <h1>AI Life Coach</h1>
        <p>Get help planning study time, organizing deadlines, and reviewing your saved progress.</p>
      </header>
      <div className="ai-coach-layout">
        <aside className="panel ai-conversations-panel">
          <div className="ai-conversation-heading">
            <div><h2>Conversations</h2><p>Private to your account</p></div>
            <button type="button" className="icon-button small-icon" onClick={startNewConversation} aria-label="Start a new conversation"><Plus size={16} /></button>
          </div>
          {conversations.error && <div className="workspace-error" role="alert">{conversations.error}<button type="button" onClick={conversations.retry}>Retry</button></div>}
          {conversations.loading && <p className="workspace-state" role="status">Loading your conversations…</p>}
          {!conversations.loading && !conversations.error && conversations.rows.length === 0 && <p className="workspace-state">Your saved conversations will appear here.</p>}
          <nav className="ai-conversation-list" aria-label="AI coach conversations">
            {conversations.rows.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                className={`ai-conversation-item ${conversation.id === threadConversationId && !creatingNew ? 'active' : ''}`}
                onClick={() => { setSelectedConversationId(conversation.id); setCreatingNew(false) }}
              >
                <MessageCircle size={15} />
                <span><strong>{conversation.title || 'New conversation'}</strong><small>{formatDateTime(conversation.updated_at)}</small></span>
              </button>
            ))}
          </nav>
        </aside>
        <CoachThread
          key={threadConversationId ?? 'new'}
          conversationId={threadConversationId}
          onConversationUpdated={updateConversation}
        />
      </div>
      <p className="ai-privacy-note"><Sparkles size={14} /> Your message and relevant task, calendar, coursework, goals, habits, and recent focus summaries are sent to the configured AI provider. Notes, financial records, and profile details are not included. Review each suggested action before adding it.</p>
    </div>
  )
}

function CoachThread({
  conversationId,
  onConversationUpdated,
}: {
  conversationId: string | null
  onConversationUpdated: (conversation: AiConversationRow) => void
}) {
  const loadMessages = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    if (!conversationId) return []
    const { data, error } = await supabase.from('ai_messages').select('*')
      .eq('user_id', userId).eq('conversation_id', conversationId).order('created_at')
    if (error) throw error
    return data ?? []
  }, [conversationId])
  const messages = useOwnedRows(loadMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingProposalId, setPendingProposalId] = useState<string | null>(null)
  const [threadError, setThreadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const scrollContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollContainer.current) return
    scrollContainer.current.scrollTop = scrollContainer.current.scrollHeight
  }, [messages.rows, sending])

  const sendMessage = async (event?: FormEvent<HTMLFormElement>, suggestedMessage?: string) => {
    event?.preventDefault()
    const message = (suggestedMessage ?? draft).trim()
    if (!message || sending || messages.error) return
    if (!supabase) {
      setThreadError('Supabase is not configured.')
      return
    }

    setSending(true)
    setThreadError(null)
    setNotice(null)
    try {
      const { data, error } = await supabase.functions.invoke('lifeos-ai-coach', {
        body: { message, conversationId },
      })
      if (error) throw error
      const exchange = parseExchange(data)
      messages.updateRows((current) => [...current, exchange.userMessage, exchange.assistantMessage])
      onConversationUpdated(exchange.conversation)
      setDraft('')
    } catch (error: unknown) {
      setThreadError(sendErrorMessage(error))
    } finally {
      setSending(false)
    }
  }

  const addProposal = async (message: AiMessageRow, proposal: ProposedAction) => {
    if (!supabase || !messages.userId) {
      setThreadError('Sign in to add the proposed item.')
      return
    }
    if (proposal.status === 'created') return

    setPendingProposalId(proposal.id)
    setThreadError(null)
    setNotice(null)
    try {
      if (proposal.kind === 'create_task') {
        const { data: existing, error: existingError } = await supabase.from('tasks').select('id')
          .eq('user_id', messages.userId).eq('ai_proposal_id', proposal.id).maybeSingle()
        if (existingError) throw existingError
        if (!existing) {
          const { error } = await supabase.from('tasks').insert({
            user_id: messages.userId,
            ai_proposal_id: proposal.id,
            title: proposal.title,
            description: proposal.description,
            due_at: proposal.due_at,
          })
          if (error && error.code !== '23505') throw error
        }
      } else {
        if (!proposal.starts_at || !proposal.ends_at || !proposal.event_type) {
          throw new Error('This event proposal is incomplete. Ask the coach to create it again with a date and time.')
        }
        const { data: existing, error: existingError } = await supabase.from('calendar_events').select('id')
          .eq('user_id', messages.userId).eq('ai_proposal_id', proposal.id).maybeSingle()
        if (existingError) throw existingError
        if (!existing) {
          const { error } = await supabase.from('calendar_events').insert({
            user_id: messages.userId,
            ai_proposal_id: proposal.id,
            title: proposal.title,
            description: proposal.description,
            event_type: proposal.event_type,
            starts_at: proposal.starts_at,
            ends_at: proposal.ends_at,
          })
          if (error && error.code !== '23505') throw error
        }
      }

      const metadata = metadataWithProposalStatus(message.metadata, proposal.id)
      const { data: updatedMessage, error: metadataError } = await supabase.from('ai_messages')
        .update({ metadata }).eq('id', message.id).eq('user_id', messages.userId).select('*').single()
      if (metadataError) throw new Error(`The item was saved, but its proposal status could not be updated: ${metadataError.message}`)
      messages.updateRows((current) => current.map((item) => item.id === updatedMessage.id ? updatedMessage : item))
      setNotice(existingNotice => existingNotice ?? 'Added to your saved records.')
    } catch (error: unknown) {
      setThreadError(messageFromError(error, 'The proposed item could not be added.'))
    } finally {
      setPendingProposalId(null)
    }
  }

  const suggestions = [
    'Help me plan my study time for the next seven days.',
    'What deadlines and exams are coming up?',
    'Suggest a realistic plan for my active goals.',
  ]

  return (
    <section className="panel ai-thread-panel" aria-label="AI Life Coach chat">
      <div className="ai-thread-heading">
        <span className="ai-thread-avatar"><Sparkles size={17} /></span>
        <div><h2>LifeOS Coach</h2><p>Grounded in your saved records</p></div>
        {sending && <span className="ai-working"><LoaderCircle size={15} className="ai-spinner" /> Thinking…</span>}
      </div>
      <div className="ai-message-list" ref={scrollContainer} aria-live="polite">
        {messages.loading && <p className="workspace-state" role="status">Loading this conversation…</p>}
        {messages.error && <div className="workspace-error" role="alert">{messages.error}<button type="button" onClick={messages.retry}>Retry</button></div>}
        {!messages.loading && !messages.error && messages.rows.length === 0 && (
          <div className="ai-empty-state">
            <span className="ai-empty-icon"><Sparkles size={20} /></span>
            <h3>What would you like to work on?</h3>
            <p>Ask for a study plan, help with deadlines, or a review of your saved progress.</p>
            <div className="ai-suggestions">{suggestions.map((suggestion) => <button key={suggestion} type="button" disabled={sending} onClick={() => void sendMessage(undefined, suggestion)}>{suggestion}</button>)}</div>
          </div>
        )}
        {messages.rows.map((message) => (
          <article className={`ai-message ai-message-${message.role}`} key={message.id}>
            <span className="ai-message-label">{message.role === 'assistant' ? 'LIFEOS COACH' : 'YOU'}</span>
            <p>{message.content}</p>
            {proposalsFor(message).map((proposal) => (
              <div className="ai-proposal-card" key={proposal.id}>
                <div className="ai-proposal-details">
                  <strong>{proposal.title}</strong>
                  {proposal.description && <span>{proposal.description}</span>}
                  <small>{proposal.kind === 'create_task'
                    ? proposal.due_at ? `Task · due ${formatDateTime(proposal.due_at)}` : 'Task · no due date'
                    : `${proposal.event_type} · ${proposal.starts_at ? formatDateTime(proposal.starts_at) : 'Start time needed'}${proposal.ends_at ? ` – ${formatDateTime(proposal.ends_at)}` : ''}`}</small>
                </div>
                <button type="button" className="button button-quiet ai-proposal-button" disabled={sending || pendingProposalId !== null || proposal.status === 'created' || Boolean(messages.error)} onClick={() => void addProposal(message, proposal)}>
                  {pendingProposalId === proposal.id ? <><LoaderCircle size={13} className="ai-spinner" /> Saving…</> : proposal.status === 'created' ? <><Check size={13} /> Added</> : <><Plus size={13} /> Add {proposal.kind === 'create_task' ? 'task' : 'event'}</>}
                </button>
              </div>
            ))}
          </article>
        ))}
        {sending && <div className="ai-typing" role="status"><span /><span /><span /> Coach is thinking</div>}
      </div>
      {threadError && <p className="workspace-error ai-thread-feedback" role="alert">{threadError}</p>}
      {notice && <p className="workspace-success ai-thread-feedback" role="status">{notice}</p>}
      <form className="ai-composer" onSubmit={(event) => void sendMessage(event)}>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={3000} placeholder="Ask your LifeOS Coach…" aria-label="Message the AI Life Coach" disabled={sending} />
        <button type="submit" className="button button-primary ai-send-button" disabled={sending || !draft.trim() || Boolean(messages.error)} aria-label="Send message">
          {sending ? <LoaderCircle size={16} className="ai-spinner" /> : <Send size={16} />}
          <span>Send</span>
        </button>
      </form>
      <p className="ai-thread-disclaimer">AI suggestions can be inaccurate. Review the details before adding anything to your account.</p>
    </section>
  )
}
