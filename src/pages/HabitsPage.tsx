import { useCallback, useState } from 'react'
import { RecordWorkspace } from '../components/RecordWorkspace'
import { localDateString, requiredNumber } from '../lib/formValues'
import { useOwnedRows } from '../lib/ownedRows'
import { supabase } from '../lib/supabase'
import type { HabitRow } from '../types/database'

export function HabitsPage() {
  const [today] = useState(localDateString)
  const loadHabits = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId)
      .eq('is_active', true).order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])
  const loadTodayCompletions = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('habit_completions').select('*')
      .eq('user_id', userId).eq('completion_date', today)
    if (error) throw error
    return data ?? []
  }, [today])
  const habits = useOwnedRows(loadHabits)
  const completions = useOwnedRows(loadTodayCompletions)
  const userId = habits.userId
  const completedHabitIds = new Set(completions.rows.map((completion) => completion.habit_id))

  const saveHabit = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save habits.')
    const habit = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      category: values.category.trim() || 'personal',
      frequency: habitFrequency(values.frequency),
      target_value: requiredNumber(values.target_value, 'target'),
      target_unit: values.target_unit.trim() || null,
    }
    if (id) {
      const { data, error } = await supabase.from('habits').update(habit).eq('id', id).eq('user_id', userId).select('*').single()
      if (error) throw error
      habits.updateRows((current) => current.map((row) => row.id === id ? data : row))
    } else {
      const { data, error } = await supabase.from('habits').insert({ ...habit, user_id: userId }).select('*').single()
      if (error) throw error
      habits.updateRows((current) => [data, ...current])
    }
  }

  const setCompletion = async (habitId: string, completed: boolean) => {
    if (!supabase || !userId) throw new Error('Sign in to update habits.')
    const current = completions.rows.find((row) => row.habit_id === habitId)
    if (completed && !current) {
      const { data, error } = await supabase.from('habit_completions').insert({
        user_id: userId,
        habit_id: habitId,
        completion_date: today,
      }).select('*').single()
      if (error) throw error
      completions.updateRows((rows) => [data, ...rows])
    } else if (!completed && current) {
      const { error } = await supabase.from('habit_completions').delete().eq('id', current.id).eq('user_id', userId)
      if (error) throw error
      completions.updateRows((rows) => rows.filter((row) => row.id !== current.id))
    }
  }

  const deleteHabit = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete habits.')
    const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    habits.updateRows((rows) => rows.filter((habit) => habit.id !== id))
    completions.updateRows((rows) => rows.filter((completion) => completion.habit_id !== id))
  }

  const updateHabit = (id: string, values: Record<string, string>) => saveHabit(id, values)

  return (
    <RecordWorkspace
      title="Habits"
      description={`Track your routine and mark habits complete for ${today}. Your entries are private to your account.`}
      fields={[
        { name: 'name', label: 'Habit', type: 'text', required: true, placeholder: 'For example: take a walk' },
        { name: 'frequency', label: 'Frequency', type: 'select', required: true, options: [
          { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'custom', label: 'Custom' },
        ] },
        { name: 'target_value', label: 'Target', type: 'number', required: true, min: 0.01, step: 0.01 },
        { name: 'target_unit', label: 'Unit', type: 'text', placeholder: 'Minutes, pages, glasses…' },
        { name: 'category', label: 'Category', type: 'text', placeholder: 'Personal, health, study…' },
        { name: 'description', label: 'Details', type: 'textarea' },
      ]}
      records={habits.rows.map((habit) => ({
        id: habit.id,
        title: habit.name,
        fields: {
          name: habit.name,
          frequency: habit.frequency,
          target_value: String(habit.target_value),
          target_unit: habit.target_unit ?? '',
          category: habit.category,
          description: habit.description ?? '',
        },
        subtitle: `${habit.frequency} · target ${habit.target_value}${habit.target_unit ? ` ${habit.target_unit}` : ''}`,
        detail: habit.description ?? undefined,
        status: completedHabitIds.has(habit.id) ? 'Done today' : 'Not done today',
        completed: completedHabitIds.has(habit.id),
      }))}
      loading={habits.loading || completions.loading}
      error={habits.error ?? completions.error}
      emptyMessage="No active habits yet. Add one to begin tracking."
      submitLabel="Add habit"
      deleteWarning="Deleting this habit also permanently deletes its check-in history. Continue?"
      onCreate={(values) => saveHabit(null, values)}
      onUpdate={updateHabit}
      onDelete={deleteHabit}
      onToggle={setCompletion}
      onRetry={() => { habits.retry(); completions.retry() }}
    />
  )
}

function habitFrequency(value: string): HabitRow['frequency'] {
  if (value === 'weekly' || value === 'custom') return value
  return 'daily'
}
