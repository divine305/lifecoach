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
      tasks: TableShape<TaskRow>
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
