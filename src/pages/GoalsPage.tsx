import { useCallback } from 'react'
import { RecordWorkspace } from '../components/RecordWorkspace'
import { useOwnedRows } from '../lib/ownedRows'
import { supabase } from '../lib/supabase'
import { requiredNumber } from '../lib/formValues'
import type { GoalMilestoneRow, GoalRow } from '../types/database'

function goalCategory(value: string): GoalRow['category'] {
  if (value === 'academic' || value === 'financial' || value === 'health' || value === 'career') return value
  return 'personal'
}

function goalStatus(value: string): GoalRow['status'] {
  if (value === 'completed' || value === 'paused' || value === 'cancelled') return value
  return 'active'
}

export function GoalsPage() {
  const loadGoals = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId).order('target_date')
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadGoals)
  const loadMilestones = useCallback(async (ownerId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('goal_milestones').select('*').eq('user_id', ownerId).order('due_date')
    if (error) throw error
    return data ?? []
  }, [])
  const milestones = useOwnedRows(loadMilestones)

  const saveGoal = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save goals.')
    const goal = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      category: goalCategory(values.category),
      target_date: values.target_date || null,
      progress_percentage: requiredNumber(values.progress_percentage, 'progress'),
      status: goalStatus(values.status),
    }
    if (id) {
      const { data, error } = await supabase.from('goals').update(goal).eq('id', id).eq('user_id', userId).select('*').single()
      if (error) throw error
      updateRows((current) => current.map((row) => row.id === id ? data : row))
    } else {
      const { data, error } = await supabase.from('goals').insert({ ...goal, user_id: userId }).select('*').single()
      if (error) throw error
      updateRows((current) => [...current, data])
    }
  }

  const deleteGoal = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete goals.')
    const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    updateRows((current) => current.filter((goal) => goal.id !== id))
    milestones.updateRows((current) => current.filter((milestone) => milestone.goal_id !== id))
  }

  return (
    <>
      <RecordWorkspace
        title="Goals"
        description="Set goals, choose target dates, and update your progress as you move forward."
        fields={[
          { name: 'title', label: 'Goal', type: 'text', required: true },
          { name: 'category', label: 'Category', type: 'select', required: true, options: [
            { value: 'academic', label: 'Academic' }, { value: 'financial', label: 'Financial' },
            { value: 'personal', label: 'Personal' }, { value: 'health', label: 'Health' }, { value: 'career', label: 'Career' },
          ] },
          { name: 'target_date', label: 'Target date', type: 'date' },
          { name: 'progress_percentage', label: 'Progress %', type: 'number', required: true, min: 0, max: 100, step: 1 },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' },
            { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
          ] },
          { name: 'description', label: 'Details', type: 'textarea' },
        ]}
        records={rows.map((goal) => ({
          id: goal.id,
          title: goal.title,
          fields: {
            title: goal.title,
            category: goal.category,
            target_date: goal.target_date ?? '',
            progress_percentage: String(goal.progress_percentage),
            status: goal.status,
            description: goal.description ?? '',
          },
          subtitle: `${goal.category} · ${goal.progress_percentage}%${goal.target_date ? ` · due ${goal.target_date}` : ''}`,
          detail: goal.description ?? undefined,
          status: goal.status,
        }))}
        loading={loading}
        error={error}
        emptyMessage="No goals yet. Add one that matters to you."
        submitLabel="Add goal"
        deleteWarning="Deleting this goal permanently deletes all of its milestones. Continue?"
        onCreate={(values) => saveGoal(null, values)}
        onUpdate={(id, values) => saveGoal(id, values)}
        onDelete={deleteGoal}
        onRetry={retry}
      />
      <MilestonesWorkspace
        goals={rows}
        goalsLoading={loading}
        goalsError={error}
        retryGoals={retry}
        milestones={milestones.rows}
        milestonesLoading={milestones.loading}
        milestonesError={milestones.error}
        retryMilestones={milestones.retry}
        userId={userId}
        updateMilestones={milestones.updateRows}
      />
    </>
  )
}

type MilestonesWorkspaceProps = {
  goals: GoalRow[]
  goalsLoading: boolean
  goalsError: string | null
  retryGoals: () => void
  milestones: GoalMilestoneRow[]
  milestonesLoading: boolean
  milestonesError: string | null
  retryMilestones: () => void
  userId: string | undefined
  updateMilestones: (update: (current: GoalMilestoneRow[]) => GoalMilestoneRow[]) => void
}

function MilestonesWorkspace({
  goals,
  goalsLoading,
  goalsError,
  retryGoals,
  milestones: milestoneRows,
  milestonesLoading,
  milestonesError,
  retryMilestones,
  userId,
  updateMilestones,
}: MilestonesWorkspaceProps) {

  const saveMilestone = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save milestones.')
    const milestone = {
      goal_id: values.goal_id,
      title: values.title.trim(),
      description: values.description.trim() || null,
      due_date: values.due_date || null,
    }
    if (id) {
      const { data, error } = await supabase.from('goal_milestones').update(milestone).eq('id', id).eq('user_id', userId).select('*').single()
      if (error) throw error
      updateMilestones((current) => current.map((row) => row.id === id ? data : row))
    } else {
      const { data, error } = await supabase.from('goal_milestones').insert({ ...milestone, user_id: userId }).select('*').single()
      if (error) throw error
      updateMilestones((current) => [...current, data])
    }
  }

  const setMilestoneCompletion = async (id: string, completed: boolean) => {
    if (!supabase || !userId) throw new Error('Sign in to update milestones.')
    const { data, error } = await supabase.from('goal_milestones').update({
      completed_at: completed ? new Date().toISOString() : null,
    }).eq('id', id).eq('user_id', userId).select('*').single()
    if (error) throw error
    updateMilestones((current) => current.map((row) => row.id === id ? data : row))
  }

  const deleteMilestone = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete milestones.')
    const { error } = await supabase.from('goal_milestones').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    updateMilestones((current) => current.filter((row) => row.id !== id))
  }

  const goalName = (goalId: string) => goals.find((goal) => goal.id === goalId)?.title ?? 'Goal removed'
  const activeGoals = goals.filter((goal) => goal.status !== 'cancelled')

  return (
    <RecordWorkspace
      title="Milestones"
      description="Break goals into smaller steps and record when each step is complete."
      fields={[
        { name: 'goal_id', label: 'Goal', type: 'select', required: true, options: activeGoals.map((goal) => ({ value: goal.id, label: goal.title })) },
        { name: 'title', label: 'Milestone', type: 'text', required: true },
        { name: 'due_date', label: 'Due date', type: 'date' },
        { name: 'description', label: 'Details', type: 'textarea' },
      ]}
      records={milestoneRows.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        fields: {
          goal_id: milestone.goal_id,
          title: milestone.title,
          due_date: milestone.due_date ?? '',
          description: milestone.description ?? '',
        },
        subtitle: `${goalName(milestone.goal_id)}${milestone.due_date ? ` · due ${milestone.due_date}` : ''}`,
        detail: milestone.description ?? undefined,
        status: milestone.completed_at ? 'Completed' : 'Open',
        completed: Boolean(milestone.completed_at),
      }))}
      loading={goalsLoading || milestonesLoading}
      error={goalsError ?? milestonesError}
      emptyMessage="No milestones yet."
      submitLabel="Add milestone"
      onCreate={(values) => saveMilestone(null, values)}
      onUpdate={(id, values) => saveMilestone(id, values)}
      onDelete={deleteMilestone}
      onToggle={setMilestoneCompletion}
      onRetry={() => { retryGoals(); retryMilestones() }}
    />
  )
}
