import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { supabase } from '../lib/supabase'

const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'GHS', 'KES', 'INR', 'ZAR']

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Settings could not be saved.'
}

export function SettingsPage({ onThemeChange }: { onThemeChange: (theme: 'dark' | 'light') => void }) {
  const { profile, preferences, user, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !user) {
      setErrorMessage('Sign in to save settings.')
      return
    }

    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('full_name') ?? '').trim()
    const studyHours = Number(form.get('preferred_study_hours'))
    const currency = String(form.get('preferred_currency') ?? 'USD')
    const themeValue = String(form.get('theme'))
    const theme = themeValue === 'light' ? 'light' : 'dark'
    const goals = String(form.get('main_goals') ?? '').split(/\r?\n/).map((goal) => goal.trim()).filter(Boolean).slice(0, 10)
    if (!fullName) {
      setErrorMessage('Enter your name.')
      return
    }
    if (!Number.isInteger(studyHours) || studyHours < 1 || studyHours > 16) {
      setErrorMessage('Choose between 1 and 16 study hours.')
      return
    }

    setSaving(true)
    setErrorMessage(null)
    setSavedMessage(null)
    try {
      const { error } = await supabase.rpc('complete_onboarding', {
        p_full_name: fullName,
        p_university: String(form.get('university') ?? '').trim(),
        p_department: String(form.get('department') ?? '').trim(),
        p_course_of_study: String(form.get('course_of_study') ?? '').trim(),
        p_academic_level: String(form.get('academic_level') ?? '').trim(),
        p_semester: String(form.get('semester') ?? '').trim(),
        p_preferred_study_hours: studyHours,
        p_main_goals: goals,
        p_preferred_currency: currency,
        p_theme: theme,
      })
      if (error) throw error
      if (!await refreshProfile()) throw new Error('Settings were saved, but your profile could not be refreshed.')
      onThemeChange(theme)
      setSavedMessage('Your settings are saved.')
    } catch (error: unknown) {
      setErrorMessage(messageFromError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-page page-content">
      <header className="workspace-page-heading"><span className="section-kicker">YOUR WORKSPACE</span><h1>Settings</h1><p>Manage your profile and preferences. Changes are saved to your account.</p></header>
      <section className="panel settings-panel">
        <form className="workspace-form" onSubmit={(event) => void saveSettings(event)}>
          <label className="workspace-field"><span>Account email</span><input type="email" value={user?.email ?? ''} readOnly /></label>
          <label className="workspace-field"><span>Full name</span><input name="full_name" required maxLength={120} defaultValue={profile?.full_name ?? ''} /></label>
          <label className="workspace-field"><span>University</span><input name="university" maxLength={160} defaultValue={profile?.university ?? ''} /></label>
          <label className="workspace-field"><span>Department</span><input name="department" maxLength={160} defaultValue={profile?.department ?? ''} /></label>
          <label className="workspace-field"><span>Course of study</span><input name="course_of_study" maxLength={160} defaultValue={profile?.course_of_study ?? ''} /></label>
          <label className="workspace-field"><span>Academic level</span><input name="academic_level" maxLength={80} defaultValue={profile?.academic_level ?? ''} /></label>
          <label className="workspace-field"><span>Semester</span><input name="semester" maxLength={80} defaultValue={profile?.semester ?? ''} /></label>
          <label className="workspace-field"><span>Study hours per day</span><input name="preferred_study_hours" type="number" min={1} max={16} required defaultValue={preferences?.preferred_study_hours ?? 2} /></label>
          <label className="workspace-field"><span>Currency</span><select name="preferred_currency" defaultValue={preferences?.preferred_currency ?? 'USD'}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <label className="workspace-field"><span>Theme</span><select name="theme" defaultValue={preferences?.theme ?? 'dark'}><option value="dark">Dark</option><option value="light">Light</option></select></label>
          <label className="workspace-field settings-goals-field"><span>Main goals (one per line)</span><textarea name="main_goals" rows={4} defaultValue={preferences?.main_goals.join('\n') ?? ''} /></label>
          {errorMessage && <p className="workspace-error" role="alert">{errorMessage}</p>}
          {savedMessage && <p className="workspace-success" role="status">{savedMessage}</p>}
          <div className="settings-actions">
            <button type="submit" className="button button-primary workspace-submit" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
            <Link to="/forgot-password" className="text-button">Reset password</Link>
          </div>
        </form>
      </section>
    </div>
  )
}
