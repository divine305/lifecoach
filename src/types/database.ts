export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ProfileRow = {
  id: string
  full_name: string
  university: string | null
  department: string | null
  course_of_study: string | null
  academic_level: string | null
  semester: string | null
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
}

export type UserPreferencesRow = {
  id: string
  user_id: string
  preferred_study_hours: number
  main_goals: string[]
  preferred_currency: string
  theme: 'dark' | 'light'
  timezone: string
  date_format: string
  week_starts_on: number
  notification_preferences: Json
  created_at: string
  updated_at: string
}

export type TaskRow = {
  id: string
  user_id: string
  course_id: string | null
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  priority: number
  due_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type CourseRow = {
  id: string
  user_id: string
  name: string
  course_code: string | null
  department: string | null
  instructor: string | null
  credit_units: number | null
  semester: string | null
  academic_year: string | null
  color: string
  created_at: string
  updated_at: string
}

export type CalendarEventRow = {
  id: string
  user_id: string
  course_id: string | null
  title: string
  description: string | null
  event_type: 'lecture' | 'study' | 'personal' | 'appointment' | 'deadline'
  starts_at: string
  ends_at: string
  location: string | null
  recurrence_rule: string | null
  created_at: string
  updated_at: string
}

export type AssignmentRow = {
  id: string
  user_id: string
  course_id: string
  title: string
  description: string | null
  due_at: string
  status: 'pending' | 'in_progress' | 'submitted' | 'graded'
  points_possible: number | null
  points_earned: number | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export type ExamRow = {
  id: string
  user_id: string
  course_id: string
  title: string
  exam_type: 'exam' | 'quiz' | 'midterm' | 'final' | 'other'
  starts_at: string
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type GradeRecordRow = {
  id: string
  user_id: string
  course_id: string | null
  assignment_id: string | null
  exam_id: string | null
  assessment_name: string
  score: number
  maximum_score: number
  weight: number | null
  assessed_on: string | null
  created_at: string
  updated_at: string
}

export type GradingScaleRow = {
  id: string
  user_id: string
  scale_name: string
  letter_grade: string
  minimum_percent: number
  maximum_percent: number
  grade_point: number
  created_at: string
  updated_at: string
}

export type FocusSessionRow = {
  id: string
  user_id: string
  course_id: string | null
  task_id: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  session_type: 'focus' | 'short_break' | 'long_break'
  completed: boolean
  created_at: string
  updated_at: string
}

export type HabitRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  category: string
  frequency: 'daily' | 'weekly' | 'custom'
  target_value: number
  target_unit: string | null
  start_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type HabitCompletionRow = {
  id: string
  user_id: string
  habit_id: string
  completion_date: string
  value: number
  note: string | null
  created_at: string
  updated_at: string
}

export type GoalRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: 'academic' | 'financial' | 'personal' | 'health' | 'career'
  target_date: string | null
  progress_percentage: number
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  created_at: string
  updated_at: string
}

export type GoalMilestoneRow = {
  id: string
  user_id: string
  goal_id: string
  title: string
  description: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type TransactionRow = {
  id: string
  user_id: string
  title: string
  amount: number
  transaction_type: 'income' | 'expense'
  category: string
  transaction_date: string
  description: string | null
  payment_method: string | null
  created_at: string
  updated_at: string
}

export type BudgetRow = {
  id: string
  user_id: string
  name: string
  category: string | null
  amount: number
  period_start: string
  period_end: string
  created_at: string
  updated_at: string
}

export type SavingsGoalRow = {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  target_date: string | null
  status: 'active' | 'completed' | 'paused'
  created_at: string
  updated_at: string
}

export type NoteFolderRow = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export type NoteRow = {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  content: string
  pinned: boolean
  created_at: string
  updated_at: string
}

export type NotificationRow = {
  id: string
  user_id: string
  title: string
  body: string
  notification_type: string
  read_at: string | null
  action_url: string | null
  created_at: string
  updated_at: string
}

export type AiConversationRow = {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export type AiMessageRow = {
  id: string
  user_id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: Json
  created_at: string
  updated_at: string
}

type TableShape<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow>
      user_preferences: TableShape<UserPreferencesRow>
      courses: TableShape<CourseRow>
      tasks: TableShape<TaskRow>
      calendar_events: TableShape<CalendarEventRow>
      assignments: TableShape<AssignmentRow>
      exams: TableShape<ExamRow>
      grade_records: TableShape<GradeRecordRow>
      grading_scales: TableShape<GradingScaleRow>
      focus_sessions: TableShape<FocusSessionRow>
      habits: TableShape<HabitRow>
      habit_completions: TableShape<HabitCompletionRow>
      goals: TableShape<GoalRow>
      goal_milestones: TableShape<GoalMilestoneRow>
      transactions: TableShape<TransactionRow>
      budgets: TableShape<BudgetRow>
      savings_goals: TableShape<SavingsGoalRow>
      note_folders: TableShape<NoteFolderRow>
      notes: TableShape<NoteRow>
      notifications: TableShape<NotificationRow>
      ai_conversations: TableShape<AiConversationRow>
      ai_messages: TableShape<AiMessageRow>
    }
    Views: Record<string, never>
    Functions: {
      complete_onboarding: {
        Args: {
          p_full_name: string
          p_university: string | null
          p_department: string | null
          p_course_of_study: string | null
          p_academic_level: string | null
          p_semester: string | null
          p_preferred_study_hours: number
          p_main_goals: string[]
          p_preferred_currency: string
          p_theme: string
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
