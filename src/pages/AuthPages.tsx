import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { UseFormRegisterReturn } from 'react-hook-form'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../contexts/useAuth'
import { supabase, supabaseSetupMessage } from '../lib/supabase'

const emailSchema = z.string().trim().email('Enter a valid email address.')

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
})

const registrationSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name.').max(120, 'Use 120 characters or fewer.'),
  email: emailSchema,
  password: z.string()
    .min(10, 'Use at least 10 characters.')
    .regex(/[A-Za-z]/, 'Include at least one letter.')
    .regex(/[0-9]/, 'Include at least one number.'),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
})

const recoverySchema = z.object({ email: emailSchema })
const resetSchema = z.object({
  password: registrationSchema.shape.password,
  confirmPassword: z.string().min(1, 'Confirm your password.'),
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
})

type LoginValues = z.infer<typeof loginSchema>
type RegistrationValues = z.infer<typeof registrationSchema>
type RecoveryValues = z.infer<typeof recoverySchema>
type ResetValues = z.infer<typeof resetSchema>

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'The request could not be completed. Please try again.'
}

function useRedirectAuthenticated() {
  const { isLoading, profile, user } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!isLoading && user) {
      navigate(profile?.onboarding_completed_at ? '/dashboard' : '/onboarding', { replace: true })
    }
  }, [isLoading, navigate, profile, user])
}

function AuthFrame({ title, description, children }: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link to="/" className="brand-lockup" aria-label="LifeOS home">
          <span className="brand-mark"><KeyRound size={16} /></span>
          <span>life<span className="brand-light">os</span></span>
        </Link>
        <Link to="/" className="auth-home-link">Back to home</Link>
      </header>
      <section className="auth-card">
        <div className="auth-heading">
          <span className="section-kicker">YOUR STUDENT WORKSPACE</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </section>
      <footer className="auth-footer">Your university life. Organized, optimized, and under control.</footer>
    </main>
  )
}

function SetupNotice() {
  return (
    <div className="auth-notice" role="status">
      <strong>Supabase setup required</strong>
      <p>{supabaseSetupMessage} Add the project URL and anon/publishable key to <code>.env.local</code>, then restart the dev server. See the README for migration and redirect URL setup.</p>
    </div>
  )
}

function FormError({ children }: { children: string }) {
  return <p className="form-message form-error" role="alert">{children}</p>
}

function FormSuccess({ children }: { children: string }) {
  return <p className="form-message form-success" role="status">{children}</p>
}

function TextField({ id, label, type = 'text', autoComplete, registration, error }: {
  id: string
  label: string
  type?: string
  autoComplete?: string
  registration: UseFormRegisterReturn
  error?: string
}) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...registration} />
      {error && <span id={`${id}-error`} className="field-error">{error}</span>}
    </div>
  )
}

function PasswordField({ id, label, autoComplete, registration, error }: {
  id: string
  label: string
  autoComplete: string
  registration: UseFormRegisterReturn
  error?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...registration} />
        <button type="button" className="password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((current) => !current)}>
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span id={`${id}-error`} className="field-error">{error}</span>}
    </div>
  )
}

export function LoginPage() {
  useRedirectAuthenticated()
  const navigate = useNavigate()
  const location = useLocation()
  const { isConfigured } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginValues) => {
    setServerError(null)
    if (!supabase) {
      setServerError(supabaseSetupMessage ?? 'Supabase is unavailable.')
      return
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password })
      if (error) {
        setServerError(error.message)
        return
      }
      const returnTo = (location.state as { from?: string } | null)?.from
      navigate(returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard', { replace: true })
    } catch (error: unknown) {
      setServerError(messageFromError(error))
    }
  }

  return (
    <AuthFrame title="Welcome back" description="Sign in to pick up where you left off.">
      {!isConfigured && <SetupNotice />}
      {serverError && <FormError>{serverError}</FormError>}
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField id="login-email" label="Email address" type="email" autoComplete="email" registration={register('email')} error={errors.email?.message} />
        <PasswordField id="login-password" label="Password" autoComplete="current-password" registration={register('password')} error={errors.password?.message} />
        <div className="auth-form-meta"><Link to="/forgot-password">Forgot password?</Link></div>
        <button className="button button-primary auth-submit" type="submit" disabled={!isConfigured || isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="auth-switch">New to LifeOS? <Link to="/register">Create an account</Link></p>
    </AuthFrame>
  )
}

export function RegisterPage() {
  useRedirectAuthenticated()
  const navigate = useNavigate()
  const { isConfigured } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: RegistrationValues) => {
    setServerError(null)
    setConfirmationMessage(null)
    if (!supabase) {
      setServerError(supabaseSetupMessage ?? 'Supabase is unavailable.')
      return
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      })
      if (error) {
        setServerError(error.message)
        return
      }
      if (data.session) {
        navigate('/onboarding', { replace: true })
      } else {
        setConfirmationMessage('Account created. Check your email to verify your address, then sign in to continue.')
      }
    } catch (error: unknown) {
      setServerError(messageFromError(error))
    }
  }

  return (
    <AuthFrame title="Create your account" description="A little more clarity starts with a few details.">
      {!isConfigured && <SetupNotice />}
      {serverError && <FormError>{serverError}</FormError>}
      {confirmationMessage && <FormSuccess>{confirmationMessage}</FormSuccess>}
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField id="register-name" label="Full name" autoComplete="name" registration={register('fullName')} error={errors.fullName?.message} />
        <TextField id="register-email" label="Email address" type="email" autoComplete="email" registration={register('email')} error={errors.email?.message} />
        <PasswordField id="register-password" label="Password" autoComplete="new-password" registration={register('password')} error={errors.password?.message} />
        <PasswordField id="register-confirm-password" label="Confirm password" autoComplete="new-password" registration={register('confirmPassword')} error={errors.confirmPassword?.message} />
        <p className="password-hint">Use at least 10 characters, including a letter and a number.</p>
        <button className="button button-primary auth-submit" type="submit" disabled={!isConfigured || isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthFrame>
  )
}

export function ForgotPasswordPage() {
  const { isConfigured } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RecoveryValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async ({ email }: RecoveryValues) => {
    setServerError(null)
    setConfirmationMessage(null)
    if (!supabase) {
      setServerError(supabaseSetupMessage ?? 'Supabase is unavailable.')
      return
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setServerError(error.message)
      else setConfirmationMessage('If an account exists for that address, a password reset email is on its way.')
    } catch (error: unknown) {
      setServerError(messageFromError(error))
    }
  }

  return (
    <AuthFrame title="Reset your password" description="We'll send a secure reset link to your email address.">
      {!isConfigured && <SetupNotice />}
      {serverError && <FormError>{serverError}</FormError>}
      {confirmationMessage && <FormSuccess>{confirmationMessage}</FormSuccess>}
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField id="recovery-email" label="Email address" type="email" autoComplete="email" registration={register('email')} error={errors.email?.message} />
        <button className="button button-primary auth-submit" type="submit" disabled={!isConfigured || isSubmitting}>
          {isSubmitting ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>
      <p className="auth-switch"><Link to="/login"><LockKeyhole size={13} /> Back to sign in</Link></p>
    </AuthFrame>
  )
}

export function ResetPasswordPage() {
  const { isConfigured, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async ({ password }: ResetValues) => {
    setServerError(null)
    if (!supabase) {
      setServerError(supabaseSetupMessage ?? 'Supabase is unavailable.')
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setServerError(error.message)
        return
      }
      navigate('/dashboard', { replace: true })
    } catch (error: unknown) {
      setServerError(messageFromError(error))
    }
  }

  return (
    <AuthFrame title="Choose a new password" description="Use a strong password you haven't used here before.">
      {!isConfigured && <SetupNotice />}
      {!isLoading && !user && isConfigured && (
        <div className="auth-notice" role="alert">
          <strong>This reset link is unavailable.</strong>
          <p>It may have expired or already been used. Request a new reset link to continue.</p>
          <Link to="/forgot-password">Request another link</Link>
        </div>
      )}
      {serverError && <FormError>{serverError}</FormError>}
      {user && <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <PasswordField id="new-password" label="New password" autoComplete="new-password" registration={register('password')} error={errors.password?.message} />
        <PasswordField id="confirm-new-password" label="Confirm new password" autoComplete="new-password" registration={register('confirmPassword')} error={errors.confirmPassword?.message} />
        <button className="button button-primary auth-submit" type="submit" disabled={!isConfigured || isSubmitting}>
          {isSubmitting ? 'Updating password…' : 'Update password'}
        </button>
      </form>}
      <p className="auth-switch"><Link to="/login"><LockKeyhole size={13} /> Back to sign in</Link></p>
    </AuthFrame>
  )
}
