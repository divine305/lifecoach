import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare,
  CircleDollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ClipboardCheck,
  Settings,
  Sparkles,
  Target,
  Timer,
} from 'lucide-react'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
  badge?: string
}

export const navigationGroups: { title: string; items: NavigationItem[] }[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Planner', path: '/planner', icon: CheckSquare },
      { label: 'Calendar', path: '/calendar', icon: CalendarDays },
    ],
  },
  {
    title: 'Your life',
    items: [
      { label: 'AI Life Coach', path: '/ai-coach', icon: Sparkles },
      { label: 'Academics', path: '/academics', icon: GraduationCap },
      { label: 'Focus mode', path: '/focus', icon: Timer },
      { label: 'Habits', path: '/habits', icon: Activity },
      { label: 'Goals', path: '/goals', icon: Target },
      { label: 'Finances', path: '/finance', icon: CircleDollarSign },
      { label: 'Notes', path: '/notes', icon: FileText },
    ],
  },
]

export const utilityNavigation: NavigationItem[] = [
  { label: 'Weekly review', path: '/review', icon: ClipboardCheck },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Reminders', path: '/notifications', icon: Bell },
  { label: 'Settings', path: '/settings', icon: Settings },
]
