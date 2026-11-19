import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

function isPublicSupabaseKey(value: string) {
  if (value.startsWith('sb_publishable_')) return true
  const payload = value.split('.')[1]
  if (!payload) return false

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))) as { role?: unknown }
    return decoded.role === 'anon'
  } catch (error) {
    if (error instanceof Error) return false
    throw error
  }
}

function isAllowedSupabaseUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
  } catch (error) {
    if (error instanceof TypeError) return false
    throw error
  }
}

export const supabaseSetupMessage = !supabaseUrl
  ? 'VITE_SUPABASE_URL is missing.'
  : !supabaseKey
    ? 'VITE_SUPABASE_ANON_KEY is missing.'
    : !isAllowedSupabaseUrl(supabaseUrl)
      ? 'VITE_SUPABASE_URL must be an HTTPS URL (or a localhost URL for local development).'
      : !isPublicSupabaseKey(supabaseKey)
        ? 'VITE_SUPABASE_ANON_KEY must be an anon or publishable key. Never use a service-role or secret key in the frontend.'
      : null

export const isSupabaseConfigured = supabaseSetupMessage === null

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null
