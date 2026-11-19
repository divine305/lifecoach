import { useCallback } from 'react'
import { RecordWorkspace } from '../components/RecordWorkspace'
import { useOwnedRows } from '../lib/ownedRows'
import { supabase } from '../lib/supabase'

export function NotificationsPage() {
  const loadNotifications = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadNotifications)

  const saveReminder = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save reminders.')
    const reminder = {
      title: values.title.trim(),
      body: values.body.trim(),
      notification_type: values.notification_type.trim() || 'general',
      action_url: null,
      read_at: null,
    }
    if (id) {
      const current = rows.find((row) => row.id === id)
      const { data, error } = await supabase.from('notifications').update({
        ...reminder,
        read_at: current?.read_at ?? null,
      }).eq('id', id).eq('user_id', userId).select('*').single()
      if (error) throw error
      updateRows((currentRows) => currentRows.map((row) => row.id === id ? data : row))
    } else {
      const { data, error } = await supabase.from('notifications').insert({ ...reminder, user_id: userId }).select('*').single()
      if (error) throw error
      updateRows((currentRows) => [data, ...currentRows])
    }
  }

  const setRead = async (id: string, isRead: boolean) => {
    if (!supabase || !userId) throw new Error('Sign in to update reminders.')
    const { data, error } = await supabase.from('notifications').update({ read_at: isRead ? new Date().toISOString() : null })
      .eq('id', id).eq('user_id', userId).select('*').single()
    if (error) throw error
    updateRows((currentRows) => currentRows.map((row) => row.id === id ? data : row))
  }

  const deleteReminder = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete reminders.')
    const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    updateRows((currentRows) => currentRows.filter((row) => row.id !== id))
  }

  return (
    <RecordWorkspace
      title="Reminders"
      description="Create private in-app reminders and mark them read when you are done. These are not email or push notifications."
      fields={[
        { name: 'title', label: 'Reminder', type: 'text', required: true },
        { name: 'notification_type', label: 'Category', type: 'text', placeholder: 'General, study, finance…' },
        { name: 'body', label: 'Details', type: 'textarea' },
      ]}
      records={rows.map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        fields: {
          title: reminder.title,
          notification_type: reminder.notification_type,
          body: reminder.body,
        },
        subtitle: `${reminder.notification_type} · ${new Date(reminder.created_at).toLocaleString()}`,
        detail: reminder.body || undefined,
        status: reminder.read_at ? 'Read' : 'Unread',
        checked: Boolean(reminder.read_at),
        toggleLabel: { completed: 'Mark unread', incomplete: 'Mark read' },
      }))}
      loading={loading}
      error={error}
      emptyMessage="No reminders yet. Add one to keep a note in your inbox."
      submitLabel="Add reminder"
      onCreate={(values) => saveReminder(null, values)}
      onUpdate={(id, values) => saveReminder(id, values)}
      onDelete={deleteReminder}
      onToggle={(id, read) => setRead(id, read)}
      onRetry={retry}
    />
  )
}
