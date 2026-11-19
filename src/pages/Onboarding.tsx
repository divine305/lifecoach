import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Command, GraduationCap, Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../contexts/useAuth'
import { supabase, supabaseSetupMessage } from '../lib/supabase'

const onboardingSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name.').max(120, 'Use 120 characters or fewer.'),
  university: z.string().trim().max(160, 'Use 160 characters or fewer.'),
  department: z.string().trim().max(160, 'Use 160 characters or fewer.'),
  courseOfStudy: z.string().trim().max(160, 'Use 160 characters or fewer.'),
  academicLevel: z.string().max(80),
  semester: z.string().max(80),
  preferredStudyHours: z.number().int().min(1).max(16),
  mainGoals: z.string().max(1200, 'Use 1,200 characters or fewer.'),
  preferredCurrency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'GHS', 'KES', 'INR', 'ZAR']),
  theme: z.enum(['dark', 'light']),
})

type OnboardingValues = z.infer<typeof onboardingSchema>

const currencyOptions = [
  ['USD', 'US Dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'British Pound'],
  ['CAD', 'Canadian Dollar'],
  ['AUD', 'Australian Dollar'],
  ['NGN', 'Nigerian Naira'],
  ['GHS', 'Ghanaian Cedi'],
  ['KES', 'Kenyan Shilling'],
  ['INR', 'Indian Rupee'],
  ['ZAR', 'South African Rand'],
] as const

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Your profile could not be saved. Please try again.'
}

export function Onboarding({ onThemeChange }: { onThemeChange: (theme: 'dark' | 'light') => void }) {
  const { profile, user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: profile?.full_name || (typeof user?.user_metadata.full_name === 'string' ? user.user_metadata.full_name : ''),
      university: profile?.university ?? '',
      department: profile?.department ?? '',
      courseOfStudy: profile?.course_of_study ?? '',
      academicLevel: profile?.academic_level ?? '',
      semester: profile?.semester ?? '',
      preferredStudyHours: 2,
      mainGoals: '',
      preferredCurrency: 'USD',
      theme: 'dark',
    },
  })

  const saveOnboarding = async (values: OnboardingValues) => {
    setServerError(null)
    if (!supabase) {
      setServerError(supabaseSetupMessage ?? 'Supabase is unavailable.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.rpc('complete_onboarding', {
        p_full_name: values.fullName,
        p_university: values.university,
        p_department: values.department,
        p_course_of_study: values.courseOfStudy,
        p_academic_level: values.academicLevel,
        p_semester: values.semester,
        p_preferred_study_hours: values.preferredStudyHours,
        p_main_goals: values.mainGoals.split(/\r?\n/).map((goal) => goal.trim()).filter(Boolean).slice(0, 10),
        p_preferred_currency: values.preferredCurrency,
        p_theme: values.theme,
      })
      if (error) {
        setServerError(error.message)
        return
      }

      const profileRefreshed = await refreshProfile()
      if (!profileRefreshed) {
        setServerError('Your details were saved, but LifeOS could not reload your profile. Reload the page or sign in again.')
        return
      }
      onThemeChange(values.theme)
      navigate('/dashboard', { replace: true })
    } catch (error: unknown) {
      setServerError(messageFromError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipOptional = handleSubmit((values) => saveOnboarding({
    ...values,
    university: '',
    department: '',
    courseOfStudy: '',
    academicLevel: '',
    semester: '',
    mainGoals: '',
  }))

  return (
    <main className="onboarding-page">
      <header className="auth-topbar">
        <Link to="/" className="brand-lockup" aria-label="LifeOS home"><span className="brand-mark"><Command size={16} /></span><span>life<span className="brand-light">os</span></span></Link>
        <span className="onboarding-progress">A FEW DETAILS · 1 OF 1</span>
      </header>

      <section className="onboarding-card">
        <div className="onboarding-intro">
          <span className="onboarding-icon"><GraduationCap size={21} /></span>
          <span className="section-kicker">MAKE IT YOURS</span>
          <h1>Welcome to LifeOS.</h1>
          <p>A few details help us make your workspace feel more like yours. You can skip the optional fields and change these later.</p>
        </div>

        {serverError && <p className="form-message form-error" role="alert">{serverError}</p>}
        {!supabase && <div className="auth-notice" role="alert"><strong>Supabase setup required</strong><p>{supabaseSetupMessage} Configure your environment and apply the database migration before saving your profile.</p></div>}

        <form className="onboarding-form" onSubmit={handleSubmit(saveOnboarding)} noValidate>
          <div className="onboarding-section-title"><span>ABOUT YOU</span></div>
          <label className="onboarding-field full-width">
            <span>Full name <b>Required</b></span>
            <input autoComplete="name" aria-invalid={Boolean(errors.fullName)} {...register('fullName')} />
            {errors.fullName && <small className="field-error">{errors.fullName.message}</small>}
          </label>

          <div className="onboarding-fields-grid">
            <label className="onboarding-field"><span>University <small>Optional</small></span><input autoComplete="organization" {...register('university')} />{errors.university && <small className="field-error">{errors.university.message}</small>}</label>
            <label className="onboarding-field"><span>Faculty or department <small>Optional</small></span><input {...register('department')} />{errors.department && <small className="field-error">{errors.department.message}</small>}</label>
            <label className="onboarding-field"><span>Course of study <small>Optional</small></span><input {...register('courseOfStudy')} />{errors.courseOfStudy && <small className="field-error">{errors.courseOfStudy.message}</small>}</label>
            <label className="onboarding-field"><span>Academic level <small>Optional</small></span><select {...register('academicLevel')}><option value="">Select your year</option><option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option><option>Year 5+</option><option>Postgraduate</option><option>Other</option></select></label>
            <label className="onboarding-field"><span>Semester <small>Optional</small></span><select {...register('semester')}><option value="">Select a semester</option><option>Semester 1</option><option>Semester 2</option><option>Quarter 1</option><option>Quarter 2</option><option>Quarter 3</option><option>Quarter 4</option><option>Trimester 1</option><option>Trimester 2</option><option>Trimester 3</option><option>Other</option></select></label>
            <label className="onboarding-field"><span>Preferred study hours per day</span><select {...register('preferredStudyHours', { valueAsNumber: true })}><option value={1}>1 hour</option><option value={2}>2 hours</option><option value={3}>3 hours</option><option value={4}>4 hours</option><option value={5}>5 hours</option><option value={6}>6 hours</option><option value={8}>8 hours</option><option value={10}>10 hours</option><option value={12}>12 hours</option><option value={16}>16 hours</option></select></label>
          </div>

          <div className="onboarding-section-title"><span>YOUR PREFERENCES</span></div>
          <div className="onboarding-fields-grid">
            <label className="onboarding-field"><span>Preferred currency</span><select {...register('preferredCurrency')}>{currencyOptions.map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}</select></label>
            <label className="onboarding-field"><span>Theme</span><select {...register('theme')}><option value="dark">Dark</option><option value="light">Light</option></select></label>
            <label className="onboarding-field full-width"><span>Main goals <small>Optional · one per line</small></span><textarea rows={3} placeholder={'Get more consistent with study\nMake time for exercise'} {...register('mainGoals')} />{errors.mainGoals && <small className="field-error">{errors.mainGoals.message}</small>}</label>
          </div>

          <div className="onboarding-actions">
            <button type="button" className="skip-button" disabled={!supabase || isSubmitting} onClick={skipOptional}>Skip optional questions</button>
            <button type="submit" className="button button-primary auth-submit" disabled={!supabase || isSubmitting}>{isSubmitting ? 'Saving your profile…' : 'Finish setup'} <Sparkles size={15} /></button>
          </div>
        </form>
      </section>
      <footer className="auth-footer">Your information is private to your account.</footer>
    </main>
  )
}
