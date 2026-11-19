import { useCallback } from 'react'
import { RecordWorkspace } from '../components/RecordWorkspace'
import { useOwnedRows } from '../lib/ownedRows'
import { dateTimeToIso, formatDateTime, isoToDateTimeInput } from '../lib/formValues'
import { supabase } from '../lib/supabase'
import type { CalendarEventRow } from '../types/database'

function eventType(value: string): CalendarEventRow['event_type'] {
  if (value === 'lecture' || value === 'study' || value === 'appointment' || value === 'deadline') return value
  return 'personal'
}

export function CalendarPage() {
  const loadEvents = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('calendar_events')
      .select('*').eq('user_id', userId).order('starts_at', { ascending: true })
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadEvents)

  const saveEvent = async (values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save calendar events.')
    const startsAt = dateTimeToIso(values.starts_at, 'start time')
    const endsAt = dateTimeToIso(values.ends_at, 'end time')
    if (!startsAt || !endsAt) throw new Error('Enter both a start and end time.')
    if (new Date(endsAt) < new Date(startsAt)) throw new Error('The end time must be after the start time.')

    const event = {
      title: values.title.trim(),
      event_type: eventType(values.event_type),
      starts_at: startsAt,
      ends_at: endsAt,
      location: values.location.trim() || null,
      description: values.description.trim() || null,
    }

    if (values.id) {
      const { data, error: updateError } = await supabase.from('calendar_events').update(event)
        .eq('id', values.id).eq('user_id', userId).select('*').single()
      if (updateError) throw updateError
      updateRows((current) => current.map((item) => item.id === values.id ? data : item)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    } else {
      const { data, error: insertError } = await supabase.from('calendar_events')
        .insert({ ...event, user_id: userId }).select('*').single()
      if (insertError) throw insertError
      updateRows((current) => [...current, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    }
  }

  const editEvent = async (id: string, values: Record<string, string>) => saveEvent({ ...values, id })

  const deleteEvent = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete calendar events.')
    const { error: deleteError } = await supabase.from('calendar_events').delete().eq('id', id).eq('user_id', userId)
    if (deleteError) throw deleteError
    updateRows((current) => current.filter((event) => event.id !== id))
  }

  return (
    <RecordWorkspace
      title="Calendar"
      description="Add lectures, study sessions, deadlines, and personal events. These are stored in your account."
      fields={[
        { name: 'title', label: 'Event', type: 'text', required: true, placeholder: 'Event title' },
        { name: 'event_type', label: 'Type', type: 'select', required: true, options: [
          { value: 'lecture', label: 'Lecture' },
          { value: 'study', label: 'Study session' },
          { value: 'personal', label: 'Personal' },
          { value: 'appointment', label: 'Appointment' },
          { value: 'deadline', label: 'Deadline' },
        ] },
        { name: 'starts_at', label: 'Starts', type: 'datetime-local', required: true },
        { name: 'ends_at', label: 'Ends', type: 'datetime-local', required: true },
        { name: 'location', label: 'Location', type: 'text', placeholder: 'Optional' },
        { name: 'description', label: 'Details', type: 'textarea', placeholder: 'Optional details' },
      ]}
      records={rows.map((event) => ({
        id: event.id,
        title: event.title,
        fields: {
          title: event.title,
          event_type: event.event_type,
          starts_at: isoToDateTimeInput(event.starts_at),
          ends_at: isoToDateTimeInput(event.ends_at),
          location: event.location ?? '',
          description: event.description ?? '',
        },
        subtitle: `${event.event_type} · ${formatDateTime(event.starts_at)}`,
        detail: [event.location, event.description].filter(Boolean).join(' · ') || undefined,
      }))}
      loading={loading}
      error={error}
      emptyMessage="Your calendar is empty. Add your first event."
      submitLabel="Add event"
      onCreate={saveEvent}
      onUpdate={editEvent}
      onDelete={deleteEvent}
      onRetry={retry}
    />
  )
}
