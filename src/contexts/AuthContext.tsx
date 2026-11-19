import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'
import type { ProfileRow, UserPreferencesRow } from '../types/database'

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'An unexpected authentication error occurred.'
}

async function fetchStudentData(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const [profileResult, preferencesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
  ])
  if (profileResult.error) throw profileResult.error
  if (preferencesResult.error) throw preferencesResult.error
  if (!profileResult.data || !preferencesResult.data) {
    throw new Error('Your profile is missing. Apply the LifeOS database migration, then sign in again.')
  }
  return { profile: profileResult.data, preferences: preferencesResult.data }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [preferences, setPreferences] = useState<UserPreferencesRow | null>(null)
  const [profileLoadedForUser, setProfileLoadedForUser] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const user = session?.user ?? null
  const profileLoading = Boolean(user && profileLoadedForUser !== user.id)

  useEffect(() => {
    if (!supabase) {
      return
    }

    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setProfile(null)
      setPreferences(null)
      setProfileError(null)
      setProfileLoadedForUser(null)
      setAuthError(null)
      setAuthLoading(false)
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAuthError(error.message)
      setSession(data.session)
      setProfile(null)
      setPreferences(null)
      setProfileError(null)
      setProfileLoadedForUser(null)
      setAuthLoading(false)
    }).catch((error: unknown) => {
      if (!active) return
      setAuthError(errorMessage(error))
      setProfileLoadedForUser(null)
      setAuthLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!supabase || !user) {
      return false
    }

    try {
      const studentData = await fetchStudentData(user.id)
      setProfile(studentData.profile)
      setPreferences(studentData.preferences)
      setProfileError(null)
      setProfileLoadedForUser(user.id)
      return true
    } catch (error: unknown) {
      setProfile(null)
      setPreferences(null)
      setProfileError(errorMessage(error))
      setProfileLoadedForUser(user.id)
      return false
    }
  }, [user])

  useEffect(() => {
    const userId = user?.id
    if (!supabase || !userId) return
    let active = true
    void fetchStudentData(userId).then((studentData) => {
      if (!active) return
      setProfile(studentData.profile)
      setPreferences(studentData.preferences)
      setProfileError(null)
      setProfileLoadedForUser(userId)
    }).catch((error: unknown) => {
      if (!active) return
      setProfile(null)
      setPreferences(null)
      setProfileError(errorMessage(error))
      setProfileLoadedForUser(userId)
    })
    return () => {
      active = false
    }
  }, [user?.id])

  const signOut = useCallback(async () => {
    if (!supabase) return 'Supabase is not configured.'
    try {
      const { error } = await supabase.auth.signOut()
      return error?.message ?? null
    } catch (error: unknown) {
      return errorMessage(error)
    }
  }, [])

  const updateThemePreference = useCallback(async (theme: 'dark' | 'light') => {
    if (!supabase || !user) return 'You must be signed in to save theme preferences.'
    try {
      const { error } = await supabase.from('user_preferences').update({ theme }).eq('user_id', user.id)
      if (error) return error.message
      setPreferences((current) => current ? { ...current, theme } : current)
      return null
    } catch (error: unknown) {
      return errorMessage(error)
    }
  }, [user])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    preferences,
    isConfigured: isSupabaseConfigured,
    isLoading: authLoading || profileLoading,
    authError,
    profileError,
    refreshProfile,
    signOut,
    updateThemePreference,
  }), [user, session, profile, preferences, authLoading, profileLoading, authError, profileError, refreshProfile, signOut, updateThemePreference])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
