import { useCallback } from 'react'
import { RecordWorkspace } from '../components/RecordWorkspace'
import { useOwnedRows } from '../lib/ownedRows'
import { supabase } from '../lib/supabase'

function reviewTitle(value: string) {
  const detail = value.trim().replace(/^weekly review(?:\s*[·-]\s*)?/i, '').trim()
  return detail ? `Weekly review · ${detail}` : 'Weekly review'
}

export function ReviewPage() {
  const loadReviews = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('notes').select('*').eq('user_id', userId)
      .like('title', 'Weekly review%').order('updated_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadReviews)

  const saveReview = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save your review.')
    const note = {
      title: reviewTitle(values.title),
      content: values.content.trim(),
      pinned: false,
      folder_id: null,
    }
    if (id) {
      const { data, error } = await supabase.from('notes').update(note).eq('id', id).eq('user_id', userId).select('*').single()
      if (error) throw error
      updateRows((current) => current.map((row) => row.id === id ? data : row))
    } else {
      const { data, error } = await supabase.from('notes').insert({ ...note, user_id: userId }).select('*').single()
      if (error) throw error
      updateRows((current) => [data, ...current])
    }
  }

  const deleteReview = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete reviews.')
    const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    updateRows((current) => current.filter((row) => row.id !== id))
  }

  return (
    <RecordWorkspace
      title="Weekly review"
      description="Reflect on your week in your own words. This is a private journal, not an AI chat."
      fields={[
        { name: 'title', label: 'Review title', type: 'text', required: true, placeholder: 'Add a title for this week' },
        { name: 'content', label: 'Reflection', type: 'textarea', required: true, placeholder: 'What went well? What would you like to change next week?' },
      ]}
      records={rows.map((row) => ({
        id: row.id,
        title: row.title,
        fields: { title: row.title, content: row.content },
        subtitle: new Date(row.updated_at).toLocaleString(),
        detail: row.content.slice(0, 240) || undefined,
      }))}
      loading={loading}
      error={error}
      emptyMessage="No reviews yet. Write a reflection when you are ready."
      submitLabel="Save review"
      onCreate={(values) => saveReview(null, values)}
      onUpdate={(id, values) => saveReview(id, values)}
      onDelete={deleteReview}
      onRetry={retry}
    />
  )
}
