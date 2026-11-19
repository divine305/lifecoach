import { useCallback } from 'react'
import { RecordWorkspace } from '../components/RecordWorkspace'
import { useOwnedRows } from '../lib/ownedRows'
import { dateTimeToIso, formatDateTime, isoToDateTimeInput, requiredNumber } from '../lib/formValues'
import { supabase } from '../lib/supabase'
import type { TaskRow } from '../types/database'

function taskStatus(value: string): TaskRow['status'] {
  if (value === 'in_progress' || value === 'completed' || value === 'cancelled') return value
  return 'todo'
}

function compareTaskDueDate(left: TaskRow, right: TaskRow) {
  if (!left.due_at) return right.due_at ? 1 : 0
  if (!right.due_at) return -1
  return left.due_at.localeCompare(right.due_at)
}

export function PlannerPage() {
  const loadTasks = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('due_at', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadTasks)

  const addTask = async (values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to add tasks.')
    const status = taskStatus(values.status)
    const dueAt = dateTimeToIso(values.due_at, 'due date')
    const { data, error: insertError } = await supabase.from('tasks').insert({
      user_id: userId,
      title: values.title.trim(),
      description: values.description.trim() || null,
      priority: requiredNumber(values.priority, 'priority'),
      due_at: dueAt,
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    }).select('*').single()
    if (insertError) throw insertError
    updateRows((current) => [...current, data].sort(compareTaskDueDate))
  }

  const editTask = async (id: string, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to update tasks.')
    const status = taskStatus(values.status)
    const { data, error: updateError } = await supabase.from('tasks').update({
      title: values.title.trim(),
      description: values.description.trim() || null,
      priority: requiredNumber(values.priority, 'priority'),
      due_at: dateTimeToIso(values.due_at, 'due date'),
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    }).eq('id', id).eq('user_id', userId).select('*').single()
    if (updateError) throw updateError
    updateRows((current) => current.map((task) => task.id === id ? data : task).sort(compareTaskDueDate))
  }

  const setTaskCompletion = async (id: string, completed: boolean) => {
    if (!supabase || !userId) throw new Error('Sign in to update tasks.')
    const { data, error: updateError } = await supabase.from('tasks').update({
      status: completed ? 'completed' : 'todo',
      completed_at: completed ? new Date().toISOString() : null,
    }).eq('id', id).eq('user_id', userId).select('*').single()
    if (updateError) throw updateError
    updateRows((current) => current.map((task) => task.id === id ? data : task))
  }

  const deleteTask = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete tasks.')
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId)
    if (deleteError) throw deleteError
    updateRows((current) => current.filter((task) => task.id !== id))
  }

  return (
    <RecordWorkspace
      title="Planner"
      description="Create, prioritize, and track your own tasks. Changes save to your LifeOS account."
      fields={[
        { name: 'title', label: 'Task', type: 'text', required: true, placeholder: 'What needs doing?' },
        { name: 'due_at', label: 'Due date and time', type: 'datetime-local' },
        { name: 'priority', label: 'Priority (1 highest – 4 lowest)', type: 'number', required: true, min: 1, max: 4, step: 1 },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [
          { value: 'todo', label: 'To do' },
          { value: 'in_progress', label: 'In progress' },
          { value: 'completed', label: 'Completed' },
        ] },
        { name: 'description', label: 'Details', type: 'textarea', placeholder: 'Optional notes for this task' },
      ]}
      records={rows.map((task) => ({
        id: task.id,
        title: task.title,
        fields: {
          title: task.title,
          due_at: isoToDateTimeInput(task.due_at),
          priority: String(task.priority),
          status: task.status,
          description: task.description ?? '',
        },
        subtitle: `Priority ${task.priority} · ${formatDateTime(task.due_at)}`,
        detail: task.description ?? undefined,
        status: task.status.replace('_', ' '),
        completed: task.status === 'completed',
      }))}
      loading={loading}
      error={error}
      emptyMessage="No tasks yet. Add your first task to build your plan."
      submitLabel="Add task"
      deleteWarning="Deleting this task also deletes any focus sessions linked to it. Continue?"
      onCreate={addTask}
      onUpdate={editTask}
      onDelete={deleteTask}
      onToggle={setTaskCompletion}
      onRetry={retry}
    />
  )
}
