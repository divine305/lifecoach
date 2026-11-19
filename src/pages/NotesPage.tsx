import { useCallback, useState } from 'react'
import { RecordWorkspace } from '../components/RecordWorkspace'
import type { RecordField } from '../components/RecordWorkspace'
import { useOwnedRows } from '../lib/ownedRows'
import { supabase } from '../lib/supabase'

type NotesSection = 'notes' | 'folders'

export function NotesPage() {
  const [section, setSection] = useState<NotesSection>('notes')
  const loadFolders = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('note_folders').select('*').eq('user_id', userId).order('name')
    if (error) throw error
    return data ?? []
  }, [])
  const loadNotes = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('notes').select('*').eq('user_id', userId)
      .order('pinned', { ascending: false }).order('updated_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])
  const folders = useOwnedRows(loadFolders)
  const notes = useOwnedRows(loadNotes)
  const userId = folders.userId
  const folderField: RecordField = {
    name: 'folder_id',
    label: 'Folder (optional)',
    type: 'select',
    placeholder: 'Unfiled',
    options: folders.rows.map((folder) => ({ value: folder.id, label: folder.name })),
  }

  const saveFolder = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save folders.')
    const folder = { name: values.name.trim(), color: values.color || 'violet' }
    if (id) {
      const { data, error } = await supabase.from('note_folders').update(folder).eq('id', id).eq('user_id', userId).select('*').single()
      if (error) throw error
      folders.updateRows((current) => current.map((row) => row.id === id ? data : row))
    } else {
      const { data, error } = await supabase.from('note_folders').insert({ ...folder, user_id: userId }).select('*').single()
      if (error) throw error
      folders.updateRows((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  const deleteFolder = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete folders.')
    const { error } = await supabase.from('note_folders').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    folders.updateRows((current) => current.filter((folder) => folder.id !== id))
    notes.updateRows((current) => current.filter((note) => note.folder_id !== id))
  }

  const saveNote = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save notes.')
    const note = {
      title: values.title.trim() || 'Untitled note',
      folder_id: values.folder_id || null,
      content: values.content,
      pinned: values.pinned === 'true',
    }
    if (id) {
      const { data, error } = await supabase.from('notes').update(note).eq('id', id).eq('user_id', userId).select('*').single()
      if (error) throw error
      notes.updateRows((current) => current.map((row) => row.id === id ? data : row)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at)))
    } else {
      const { data, error } = await supabase.from('notes').insert({ ...note, user_id: userId }).select('*').single()
      if (error) throw error
      notes.updateRows((current) => [data, ...current])
    }
  }

  const deleteNote = async (id: string) => {
    if (!supabase || !userId) throw new Error('Sign in to delete notes.')
    const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    notes.updateRows((current) => current.filter((note) => note.id !== id))
  }

  const noteFields: RecordField[] = [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Note title' },
    folderField,
    { name: 'pinned', label: 'Pinned', type: 'select', required: true, options: [
      { value: 'false', label: 'No' }, { value: 'true', label: 'Yes' },
    ] },
    { name: 'content', label: 'Note', type: 'textarea', placeholder: 'Write your note…' },
  ]

  const isNotesSection = section === 'notes'
  const records = isNotesSection
    ? notes.rows.map((note) => ({
            id: note.id,
            title: note.title,
            fields: {
              title: note.title,
              folder_id: note.folder_id ?? '',
              pinned: String(note.pinned),
              content: note.content,
            },
            subtitle: `${folders.rows.find((folder) => folder.id === note.folder_id)?.name ?? 'Unfiled'} · ${new Date(note.updated_at).toLocaleString()}`,
            detail: note.content.slice(0, 220) || undefined,
            status: note.pinned ? 'Pinned' : undefined,
          }))
    : folders.rows.map((folder) => ({
        id: folder.id,
        title: folder.name,
        fields: { name: folder.name, color: folder.color },
        subtitle: `${notes.rows.filter((note) => note.folder_id === folder.id).length} notes`,
      }))
  const fields: RecordField[] = isNotesSection ? noteFields : [
            { name: 'name', label: 'Folder name', type: 'text', required: true },
            { name: 'color', label: 'Color', type: 'select', required: true, options: [
              { value: 'violet', label: 'Violet' }, { value: 'blue', label: 'Blue' },
              { value: 'orange', label: 'Orange' }, { value: 'green', label: 'Green' },
            ] },
          ]

  return (
    <RecordWorkspace
      key={section}
      title={isNotesSection ? 'Notes' : 'Folders'}
      description={isNotesSection ? 'Keep your own notes and organize them into folders. Notes are private to your account.' : 'Create folders for your notes.'}
      fields={fields}
      records={records}
      loading={notes.loading || folders.loading}
      error={isNotesSection ? notes.error ?? folders.error : folders.error ?? notes.error}
      emptyMessage={isNotesSection ? 'No notes yet. Add one to capture something important.' : 'No folders yet. Notes can be stored without a folder.'}
      submitLabel={isNotesSection ? 'Add note' : 'Add folder'}
      deleteWarning={isNotesSection ? undefined : 'Deleting this folder permanently deletes all notes inside it. Continue?'}
      onCreate={(values) => isNotesSection ? saveNote(null, values) : saveFolder(null, values)}
      onUpdate={(id, values) => isNotesSection ? saveNote(id, values) : saveFolder(id, values)}
      onDelete={isNotesSection ? deleteNote : deleteFolder}
      onRetry={() => { notes.retry(); folders.retry() }}
    >
      <nav className="workspace-tabs" aria-label="Notes sections">
        <button type="button" className={isNotesSection ? 'active' : ''} onClick={() => setSection('notes')}>Notes</button>
        <button type="button" className={!isNotesSection ? 'active' : ''} onClick={() => setSection('folders')}>Folders</button>
      </nav>
    </RecordWorkspace>
  )
}
