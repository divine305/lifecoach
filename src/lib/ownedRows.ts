import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/useAuth'

type LoadState = {
  userId: string
  loading: boolean
  error: string | null
}

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'An unexpected data error occurred.'
}

export function useOwnedRows<Row extends { id: string }>(loadRows: (userId: string) => Promise<Row[]>) {
  const { user } = useAuth()
  const userId = user?.id
  const [records, setRecords] = useState<{ userId: string; rows: Row[] } | null>(null)
  const [loadState, setLoadState] = useState<LoadState>({ userId: '', loading: true, error: null })
  const [refreshVersion, setRefreshVersion] = useState(0)
  const rows = records && records.userId === userId ? records.rows : []
  const loading = Boolean(userId) && (loadState.userId !== userId || loadState.loading)
  const error = !userId
    ? 'Sign in to load your data.'
    : loadState.userId === userId
      ? loadState.error
      : null

  useEffect(() => {
    let active = true
    if (!userId) return () => { active = false }

    void loadRows(userId).then((data) => {
      if (!active) return
      setRecords({ userId, rows: data })
      setLoadState({ userId, loading: false, error: null })
    }).catch((loadError: unknown) => {
      if (!active) return
      setLoadState({ userId, loading: false, error: messageFromError(loadError) })
    })

    return () => { active = false }
  }, [loadRows, userId, refreshVersion])

  const updateRows = useCallback((update: (current: Row[]) => Row[]) => {
    if (!userId) return
    setRecords((current) => {
      const currentRows = current?.userId === userId ? current.rows : []
      return { userId, rows: update(currentRows) }
    })
  }, [userId])

  const retry = useCallback(() => {
    if (!userId) return
    setLoadState({ userId, loading: true, error: null })
    setRefreshVersion((version) => version + 1)
  }, [userId])

  return { rows, userId, loading, error, updateRows, retry }
}
