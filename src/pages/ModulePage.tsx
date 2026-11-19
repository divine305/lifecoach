import { Navigate, useLocation } from 'react-router-dom'
import { AcademicsPage } from './AcademicsPage'
import { AnalyticsPage } from './AnalyticsPage'
import { CalendarPage } from './CalendarPage'
import { FinancePage } from './FinancePage'
import { FocusPage } from './FocusPage'
import { GoalsPage } from './GoalsPage'
import { HabitsPage } from './HabitsPage'
import { NotesPage } from './NotesPage'
import { NotificationsPage } from './NotificationsPage'
import { PlannerPage } from './PlannerPage'
import { ReviewPage } from './ReviewPage'
import { SettingsPage } from './SettingsPage'

type ModulePageProps = {
  onThemeChange: (theme: 'dark' | 'light') => void
}

export function ModulePage({ onThemeChange }: ModulePageProps) {
  const { pathname } = useLocation()

  if (pathname === '/planner') return <PlannerPage />
  if (pathname === '/calendar') return <CalendarPage />
  if (pathname.startsWith('/academics')) return <AcademicsPage />
  if (pathname === '/focus') return <FocusPage />
  if (pathname === '/habits') return <HabitsPage />
  if (pathname === '/goals') return <GoalsPage />
  if (pathname.startsWith('/finance')) return <FinancePage />
  if (pathname === '/notes') return <NotesPage />
  if (pathname === '/notifications') return <NotificationsPage />
  if (pathname === '/analytics') return <AnalyticsPage />
  if (pathname === '/settings') return <SettingsPage onThemeChange={onThemeChange} />
  if (pathname === '/review') return <ReviewPage />
  if (pathname === '/ai-coach') return <Navigate to="/review" replace />
  return <Navigate to="/dashboard" replace />
}
