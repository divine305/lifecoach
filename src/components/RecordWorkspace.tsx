import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowRight, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export type RecordField = {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select'
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: number
  options?: { value: string; label: string }[]
}

export type WorkspaceRecord = {
  id: string
  title: string
  fields?: Record<string, string>
  subtitle?: string
  detail?: string
  status?: string
  href?: string
  completed?: boolean
  checked?: boolean
  toggleLabel?: { completed: string; incomplete: string }
}

type RecordWorkspaceProps = {
  title: string
  description: string
  fields: RecordField[]
  records: WorkspaceRecord[]
  loading: boolean
  error: string | null
  emptyMessage: string
  submitLabel?: string
  deleteWarning?: string
  onCreate: (values: Record<string, string>) => Promise<void>
  onUpdate?: (id: string, values: Record<string, string>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onToggle?: (id: string, completed: boolean) => Promise<void>
  onRetry: () => void
  children?: ReactNode
}

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'The change could not be saved.'
}

export function RecordWorkspace({
  title,
  description,
  fields,
  records,
  loading,
  error,
  emptyMessage,
  submitLabel = 'Add record',
  deleteWarning,
  onCreate,
  onUpdate,
  onDelete,
  onToggle,
  onRetry,
  children,
}: RecordWorkspaceProps) {
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState<WorkspaceRecord | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const values: Record<string, string> = {}
    new FormData(form).forEach((value, key) => {
      if (typeof value === 'string') values[key] = value
    })

    setSaving(true)
    setActionError(null)
    try {
      if (editing && onUpdate) {
        await onUpdate(editing.id, values)
        setEditing(null)
      } else {
        await onCreate(values)
      }
      form.reset()
    } catch (error: unknown) {
      setActionError(messageFromError(error))
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (record: WorkspaceRecord) => {
    setActionError(null)
    setEditing(record)
  }

  const cancelEditing = () => {
    setEditing(null)
    setActionError(null)
  }

  const toggle = async (id: string, completed: boolean) => {
    if (!onToggle) return
    setActionError(null)
    try {
      await onToggle(id, completed)
    } catch (error: unknown) {
      setActionError(messageFromError(error))
    }
  }

  const remove = async (id: string) => {
    if (!onDelete || !window.confirm(deleteWarning ?? 'Delete this record permanently?')) return
    setActionError(null)
    try {
      await onDelete(id)
    } catch (error: unknown) {
      setActionError(messageFromError(error))
    }
  }

  return (
    <div className="module-page page-content">
      <header className="workspace-page-heading">
        <span className="section-kicker">YOUR WORKSPACE</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
      <div className="workspace-grid">
        <section className="panel workspace-form-panel">
          <div className="panel-heading"><div><h2>{editing ? `Edit ${title.toLowerCase()}` : `Add to ${title.toLowerCase()}`}</h2><p>Your entries are private to your account.</p></div><Plus size={18} /></div>
          <form className="workspace-form" onSubmit={(event) => void submit(event)}>
            {fields.map((field) => (
              <label className="workspace-field" key={field.name}>
                <span>{field.label}</span>
                {field.type === 'textarea'
                  ? <textarea key={`${field.name}-${editing?.id ?? 'new'}`} name={field.name} required={field.required} placeholder={field.placeholder} rows={3} defaultValue={editing?.fields?.[field.name] ?? ''} />
                  : field.type === 'select'
                    ? <select key={`${field.name}-${editing?.id ?? 'new'}`} name={field.name} required={field.required} defaultValue={editing?.fields?.[field.name] ?? ''}><option value="" disabled={field.required}>{field.placeholder ?? 'Select…'}</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                    : <input key={`${field.name}-${editing?.id ?? 'new'}`} name={field.name} type={field.type} required={field.required} placeholder={field.placeholder} min={field.min} max={field.max} step={field.step} defaultValue={editing?.fields?.[field.name] ?? ''} />}
              </label>
            ))}
            {actionError && <p className="workspace-error" role="alert">{actionError}</p>}
            <button type="submit" className="button button-primary workspace-submit" disabled={saving || loading || Boolean(error)}>
              {saving ? 'Saving…' : editing ? 'Save changes' : submitLabel} {!saving && <Check size={15} />}
            </button>
            {editing && <button type="button" className="workspace-cancel" onClick={cancelEditing}><X size={14} /> Cancel edit</button>}
          </form>
        </section>

        <section className="panel workspace-records-panel">
          <div className="panel-heading"><div><h2>Your {title.toLowerCase()}</h2><p>{loading ? 'Loading your records…' : `${records.length} saved`}</p></div></div>
          {error && <div className="workspace-state workspace-error" role="alert"><span>{error}</span><button type="button" onClick={onRetry}>Retry</button></div>}
          {loading && <p className="workspace-state" role="status">Loading your records…</p>}
          {!loading && !error && records.length === 0 && <p className="workspace-state">{emptyMessage}</p>}
          {!loading && !error && records.length > 0 && (
            <div className="workspace-record-list">
              {records.map((record) => (
                <article className={`workspace-record ${record.completed ? 'workspace-record-complete' : ''}`} key={record.id}>
                  {onToggle && <input type="checkbox" aria-label={`${record.checked ?? record.completed ? record.toggleLabel?.completed ?? 'Reopen' : record.toggleLabel?.incomplete ?? 'Complete'} ${record.title}`} checked={Boolean(record.checked ?? record.completed)} onChange={(event) => void toggle(record.id, event.target.checked)} />}
                  <div className="workspace-record-copy"><strong>{record.title}</strong>{record.subtitle && <small>{record.subtitle}</small>}{record.detail && <p>{record.detail}</p>}</div>
                  {record.status && <span className="workspace-record-status">{record.status}</span>}
                  {record.href && <Link className="text-button workspace-record-link" to={record.href}>Open <ArrowRight size={13} /></Link>}
                  {onUpdate && <button type="button" className="icon-button workspace-delete" aria-label={`Edit ${record.title}`} onClick={() => startEditing(record)}><Pencil size={14} /></button>}
                  {onDelete && <button type="button" className="icon-button workspace-delete" aria-label={`Delete ${record.title}`} onClick={() => void remove(record.id)}><Trash2 size={15} /></button>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
