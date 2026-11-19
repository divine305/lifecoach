import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckSquare,
  CircleDollarSign,
  Compass,
  FileText,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Target,
  Timer,
  UserRound,
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
      { label: 'Planner', path: '/planner', icon: CheckSquare, badge: '3' },
      { label: 'Calendar', path: '/calendar', icon: CalendarDays },
    ],
  },
  {
    title: 'Your life',
    items: [
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
  { label: 'AI Life Coach', path: '/ai-coach', icon: BrainCircuit },
  { label: 'Analytics', path: '/analytics', icon: Compass },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export const weekActivity = [
  { day: 'Mon', focus: 2.4, tasks: 5 },
  { day: 'Tue', focus: 3.2, tasks: 7 },
  { day: 'Wed', focus: 2.8, tasks: 4 },
  { day: 'Thu', focus: 4.1, tasks: 8 },
  { day: 'Fri', focus: 3.4, tasks: 6 },
  { day: 'Sat', focus: 1.8, tasks: 3 },
  { day: 'Sun', focus: 2.7, tasks: 5 },
]

export const initialTasks = [
  { id: 1, title: 'Review lecture notes', course: 'Human-computer interaction', time: '10:30 AM', done: false, color: 'violet' },
  { id: 2, title: 'Submit research proposal', course: 'Research methods', time: 'Due today', done: false, color: 'orange' },
  { id: 3, title: 'Read chapter 06', course: 'Data structures', time: '2:00 PM', done: true, color: 'blue' },
]

export const upcomingEvents = [
  { time: '09:00', period: 'AM', title: 'User experience design', type: 'Lecture', location: 'Lecture hall B', color: 'violet' },
  { time: '11:30', period: 'AM', title: 'Study group · Algorithms', type: 'Study session', location: 'Library, floor 2', color: 'blue' },
  { time: '02:00', period: 'PM', title: 'Research proposal due', type: 'Deadline', location: 'Research methods', color: 'orange' },
]

export const pageDescriptions: Record<string, { title: string; description: string; icon: LucideIcon }> = {
  '/planner': { title: 'Smart planner', description: 'Bring tasks, study sessions, and deadlines together in one clear plan.', icon: CheckSquare },
  '/calendar': { title: 'Calendar', description: 'A single view of your lectures, commitments, and important dates.', icon: CalendarDays },
  '/academics': { title: 'Academics', description: 'Keep courses, assignments, exams, and grades organized throughout the semester.', icon: BookOpen },
  '/academics/courses': { title: 'Courses', description: 'Your course workspace will live here.', icon: GraduationCap },
  '/academics/assignments': { title: 'Assignments', description: 'Track coursework and upcoming submission dates.', icon: CheckSquare },
  '/academics/exams': { title: 'Examinations', description: 'Plan your revision around upcoming exams.', icon: CalendarDays },
  '/academics/grades': { title: 'Grades & GPA', description: 'Review your academic progress across the semester.', icon: GraduationCap },
  '/focus': { title: 'Focus mode', description: 'Make room for deep work with calm, distraction-free focus sessions.', icon: Timer },
  '/habits': { title: 'Habits', description: 'Build small, consistent routines that support the life you want.', icon: Activity },
  '/goals': { title: 'Goals', description: 'Turn meaningful ambitions into clear, achievable milestones.', icon: Flag },
  '/finance': { title: 'Finances', description: 'Understand your spending and make your student budget work harder.', icon: CircleDollarSign },
  '/notes': { title: 'Notes', description: 'Capture ideas, class notes, and the things you want to remember.', icon: FileText },
  '/ai-coach': { title: 'AI Life Coach', description: 'A thoughtful planning companion, grounded in your own goals and schedule.', icon: BrainCircuit },
  '/analytics': { title: 'Analytics', description: 'Get a clearer picture of your focus, consistency, and progress.', icon: Compass },
  '/settings': { title: 'Settings', description: 'Personalize your LifeOS workspace and preferences.', icon: Settings },
  '/notifications': { title: 'Notifications', description: 'Stay up to date with the things that need your attention.', icon: Activity },
  '/login': { title: 'Sign in', description: 'Account access will be available after the authentication setup phase.', icon: UserRound },
}
