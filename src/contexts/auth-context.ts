import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { ProfileRow, UserPreferencesRow } from '../types/database'

export type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: ProfileRow | null
  preferences: UserPreferencesRow | null
  isConfigured: boolean
  isLoading: boolean
  authError: string | null
  profileError: string | null
  refreshProfile: () => Promise<boolean>
  signOut: () => Promise<string | null>
  updateThemePreference: (theme: 'dark' | 'light') => Promise<string | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
