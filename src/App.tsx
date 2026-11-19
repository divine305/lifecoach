import { lazy, Suspense, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './contexts/useAuth'
import './App.css'

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const Landing = lazy(() => import('./pages/Landing').then((module) => ({ default: module.Landing })))
const ModulePage = lazy(() => import('./pages/ModulePage').then((module) => ({ default: module.ModulePage })))
const LoginPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.ResetPasswordPage })))
const OnboardingPage = lazy(() => import('./pages/Onboarding').then((module) => ({ default: module.Onboarding })))

function getInitialTheme(): 'dark' | 'light' {
  return localStorage.getItem('lifeos-theme') === 'light' ? 'light' : 'dark'
}

function LoadingPage() {
  return <div className="page-loading" role="status">Preparing your workspace…</div>
}

function AuthProblem({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="auth-page">
      <section className="auth-card auth-problem">
        <span className="section-kicker">SIGN-IN CHECK</span>
        <h1>We couldn't verify your session.</h1>
        <p role="alert">{message}</p>
        <button className="button button-primary auth-submit" onClick={onRetry}>Try again</button>
      </section>
    </main>
  )
}

function RequireAuth() {
  const { isConfigured, isLoading, user, profile, authError, profileError } = useAuth()
  const location = useLocation()

  if (!isConfigured) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (isLoading) return <LoadingPage />
  if (authError) return <AuthProblem message={authError} onRetry={() => window.location.reload()} />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (profileError) return <AuthProblem message={profileError} onRetry={() => window.location.reload()} />

  const onboardingComplete = Boolean(profile?.onboarding_completed_at)
  if (!onboardingComplete && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  if (onboardingComplete && location.pathname === '/onboarding') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function App() {
  const [initialTheme] = useState(getInitialTheme)
  const [themeOverride, setThemeOverride] = useState<{ userId: string | null; theme: 'dark' | 'light' } | null>(null)
  const { preferences, updateThemePreference, user } = useAuth()
  const theme = themeOverride?.userId === (user?.id ?? null)
    ? themeOverride.theme
    : preferences?.theme ?? initialTheme

  const setAppTheme = (next: 'dark' | 'light') => {
    localStorage.setItem('lifeos-theme', next)
    setThemeOverride({ userId: user?.id ?? null, theme: next })
  }

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setAppTheme(next)
    return user ? updateThemePreference(next) : null
  }

  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route element={<RequireAuth />}>
          <Route path="onboarding" element={<OnboardingPage onThemeChange={setAppTheme} />} />
          <Route element={<AppShell theme={theme} onToggleTheme={toggleTheme} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="*" element={<ModulePage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
