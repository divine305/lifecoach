import { useCallback } from 'react'
import { Link, Navigate, NavLink, useLocation } from 'react-router-dom'
import { RecordWorkspace } from '../components/RecordWorkspace'
import { dateTimeToIso, formatDateTime, isoToDateTimeInput, optionalNumber, requiredNumber } from '../lib/formValues'
import { useOwnedRows } from '../lib/ownedRows'
import { supabase } from '../lib/supabase'
import type { AssignmentRow, ExamRow } from '../types/database'

function useCourses() {
  const loadCourses = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('courses').select('*').eq('user_id', userId).order('name')
    if (error) throw error
    return data ?? []
  }, [])
  return useOwnedRows(loadCourses)
}

function removeRecord(table: 'courses' | 'assignments' | 'exams' | 'grade_records', id: string, userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase.from(table).delete().eq('id', id).eq('user_id', userId)
}

function AcademicTabs() {
  return (
    <nav className="workspace-tabs" aria-label="Academic sections">
      <NavLink to="/academics/courses">Courses</NavLink>
      <NavLink to="/academics/assignments">Assignments</NavLink>
      <NavLink to="/academics/exams">Exams</NavLink>
      <NavLink to="/academics/grades">Grades</NavLink>
    </nav>
  )
}

function CoursesPage() {
  const loadCourses = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('courses').select('*').eq('user_id', userId).order('name')
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadCourses)

  const createCourse = async (values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to add courses.')
    const course = {
      user_id: userId,
      name: values.name.trim(),
      course_code: values.course_code.trim() || null,
      department: values.department.trim() || null,
      instructor: values.instructor.trim() || null,
      credit_units: optionalNumber(values.credit_units, 'credit units'),
      semester: values.semester.trim() || null,
      academic_year: values.academic_year.trim() || null,
    }
    const { data, error: insertError } = await supabase.from('courses').insert(course).select('*').single()
    if (insertError) throw insertError
    updateRows((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
  }

  const updateCourse = async (id: string, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to update courses.')
    const { data, error: updateError } = await supabase.from('courses').update({
      name: values.name.trim(),
      course_code: values.course_code.trim() || null,
      department: values.department.trim() || null,
      instructor: values.instructor.trim() || null,
      credit_units: optionalNumber(values.credit_units, 'credit units'),
      semester: values.semester.trim() || null,
      academic_year: values.academic_year.trim() || null,
    }).eq('id', id).eq('user_id', userId).select('*').single()
    if (updateError) throw updateError
    updateRows((current) => current.map((course) => course.id === id ? data : course).sort((a, b) => a.name.localeCompare(b.name)))
  }

  const deleteCourse = async (id: string) => {
    if (!userId) throw new Error('Sign in to delete courses.')
    const { error: deleteError } = await removeRecord('courses', id, userId)
    if (deleteError) throw deleteError
    updateRows((current) => current.filter((course) => course.id !== id))
  }

  return (
    <RecordWorkspace
      title="Courses"
      description="Keep your course details in one place. Add your courses before linking assignments and exams."
      fields={[
        { name: 'name', label: 'Course name', type: 'text', required: true, placeholder: 'Course title' },
        { name: 'course_code', label: 'Course code', type: 'text', placeholder: 'Optional' },
        { name: 'department', label: 'Department', type: 'text', placeholder: 'Optional' },
        { name: 'instructor', label: 'Instructor', type: 'text', placeholder: 'Optional' },
        { name: 'credit_units', label: 'Credit units', type: 'number', min: 0, max: 30, step: 0.5 },
        { name: 'semester', label: 'Semester', type: 'text', placeholder: 'Optional' },
        { name: 'academic_year', label: 'Academic year', type: 'text', placeholder: 'Optional' },
      ]}
      records={rows.map((course) => ({
        id: course.id,
        title: course.name,
        fields: {
          name: course.name,
          course_code: course.course_code ?? '',
          department: course.department ?? '',
          instructor: course.instructor ?? '',
          credit_units: course.credit_units === null ? '' : String(course.credit_units),
          semester: course.semester ?? '',
          academic_year: course.academic_year ?? '',
        },
        subtitle: [course.course_code, course.semester, course.academic_year].filter(Boolean).join(' · ') || 'Course',
        detail: [course.department, course.instructor].filter(Boolean).join(' · ') || undefined,
      }))}
      loading={loading}
      error={error}
      emptyMessage="No courses yet. Add a course to start organizing your academics."
      submitLabel="Add course"
      deleteWarning="Deleting this course also deletes its assignments, exams, tasks, calendar events, grades, and focus sessions. Continue?"
      onCreate={createCourse}
      onUpdate={updateCourse}
      onDelete={deleteCourse}
      onRetry={retry}
    >
      <AcademicTabs />
    </RecordWorkspace>
  )
}

function AssignmentsPage() {
  const courses = useCourses()
  const loadAssignments = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('assignments').select('*').eq('user_id', userId).order('due_at')
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadAssignments)
  const courseName = (courseId: string) => courses.rows.find((course) => course.id === courseId)?.name ?? 'Course removed'

  const saveAssignment = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save assignments.')
    const dueAt = dateTimeToIso(values.due_at, 'due date')
    if (!dueAt) throw new Error('Choose a due date.')
    const assignment = {
      course_id: values.course_id,
      title: values.title.trim(),
      description: values.description.trim() || null,
      due_at: dueAt,
      status: assignmentStatus(values.status),
      points_possible: optionalNumber(values.points_possible, 'maximum points'),
      points_earned: optionalNumber(values.points_earned, 'earned points'),
    }
    if (id) {
      const { data, error: updateError } = await supabase.from('assignments').update(assignment)
        .eq('id', id).eq('user_id', userId).select('*').single()
      if (updateError) throw updateError
      updateRows((current) => current.map((item) => item.id === id ? data : item))
    } else {
      const { data, error: insertError } = await supabase.from('assignments')
        .insert({ ...assignment, user_id: userId }).select('*').single()
      if (insertError) throw insertError
      updateRows((current) => [...current, data].sort((a, b) => a.due_at.localeCompare(b.due_at)))
    }
  }

  const deleteAssignment = async (id: string) => {
    if (!userId) throw new Error('Sign in to delete assignments.')
    const { error: deleteError } = await removeRecord('assignments', id, userId)
    if (deleteError) throw deleteError
    updateRows((current) => current.filter((item) => item.id !== id))
  }

  return (
    <RecordWorkspace
      title="Assignments"
      description="Track coursework by course, submission date, status, and score."
      fields={[
        { name: 'course_id', label: 'Course', type: 'select', required: true, options: courses.rows.map((course) => ({ value: course.id, label: course.name })) },
        { name: 'title', label: 'Assignment', type: 'text', required: true },
        { name: 'due_at', label: 'Due date and time', type: 'datetime-local', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [
          { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In progress' },
          { value: 'submitted', label: 'Submitted' }, { value: 'graded', label: 'Graded' },
        ] },
        { name: 'points_possible', label: 'Maximum points', type: 'number', min: 0, step: 0.01 },
        { name: 'points_earned', label: 'Points earned', type: 'number', min: 0, step: 0.01 },
        { name: 'description', label: 'Details', type: 'textarea' },
      ]}
      records={rows.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        fields: {
          course_id: assignment.course_id,
          title: assignment.title,
          due_at: isoToDateTimeInput(assignment.due_at),
          status: assignment.status,
          points_possible: assignment.points_possible === null ? '' : String(assignment.points_possible),
          points_earned: assignment.points_earned === null ? '' : String(assignment.points_earned),
          description: assignment.description ?? '',
        },
        subtitle: `${courseName(assignment.course_id)} · ${formatDateTime(assignment.due_at)}`,
        detail: assignment.points_earned !== null && assignment.points_possible !== null
          ? `${assignment.points_earned} / ${assignment.points_possible} points`
          : assignment.description ?? undefined,
        status: assignment.status.replace('_', ' '),
      }))}
      loading={loading || courses.loading}
      error={error ?? courses.error}
      emptyMessage="No assignments yet. Add one after creating a course."
      submitLabel="Add assignment"
      onCreate={(values) => saveAssignment(null, values)}
      onUpdate={(id, values) => saveAssignment(id, values)}
      onDelete={deleteAssignment}
      onRetry={() => { retry(); courses.retry() }}
    >
      <AcademicTabs />
      {courses.rows.length === 0 && !courses.loading && <p className="workspace-state">Add a course first in <Link to="/academics/courses">Courses</Link>.</p>}
    </RecordWorkspace>
  )
}

function assignmentStatus(value: string): AssignmentRow['status'] {
  if (value === 'in_progress' || value === 'submitted' || value === 'graded') return value
  return 'pending'
}

function ExamsPage() {
  const courses = useCourses()
  const loadExams = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('exams').select('*').eq('user_id', userId).order('starts_at')
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadExams)
  const courseName = (courseId: string) => courses.rows.find((course) => course.id === courseId)?.name ?? 'Course removed'

  const saveExam = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save exams.')
    const startsAt = dateTimeToIso(values.starts_at, 'exam time')
    if (!startsAt) throw new Error('Choose an exam time.')
    const exam = {
      course_id: values.course_id,
      title: values.title.trim(),
      exam_type: examType(values.exam_type),
      starts_at: startsAt,
      location: values.location.trim() || null,
      notes: values.notes.trim() || null,
    }
    if (id) {
      const { data, error: updateError } = await supabase.from('exams').update(exam)
        .eq('id', id).eq('user_id', userId).select('*').single()
      if (updateError) throw updateError
      updateRows((current) => current.map((item) => item.id === id ? data : item))
    } else {
      const { data, error: insertError } = await supabase.from('exams').insert({ ...exam, user_id: userId }).select('*').single()
      if (insertError) throw insertError
      updateRows((current) => [...current, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    }
  }

  const deleteExam = async (id: string) => {
    if (!userId) throw new Error('Sign in to delete exams.')
    const { error: deleteError } = await removeRecord('exams', id, userId)
    if (deleteError) throw deleteError
    updateRows((current) => current.filter((exam) => exam.id !== id))
  }

  return (
    <RecordWorkspace
      title="Exams"
      description="Plan exam and quiz dates around your courses."
      fields={[
        { name: 'course_id', label: 'Course', type: 'select', required: true, options: courses.rows.map((course) => ({ value: course.id, label: course.name })) },
        { name: 'title', label: 'Exam or quiz', type: 'text', required: true },
        { name: 'exam_type', label: 'Type', type: 'select', required: true, options: [
          { value: 'exam', label: 'Exam' }, { value: 'quiz', label: 'Quiz' }, { value: 'midterm', label: 'Midterm' },
          { value: 'final', label: 'Final' }, { value: 'other', label: 'Other' },
        ] },
        { name: 'starts_at', label: 'Date and time', type: 'datetime-local', required: true },
        { name: 'location', label: 'Location', type: 'text' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      records={rows.map((exam) => ({
        id: exam.id,
        title: exam.title,
        fields: {
          course_id: exam.course_id,
          title: exam.title,
          exam_type: exam.exam_type,
          starts_at: isoToDateTimeInput(exam.starts_at),
          location: exam.location ?? '',
          notes: exam.notes ?? '',
        },
        subtitle: `${courseName(exam.course_id)} · ${exam.exam_type} · ${formatDateTime(exam.starts_at)}`,
        detail: exam.location ?? exam.notes ?? undefined,
      }))}
      loading={loading || courses.loading}
      error={error ?? courses.error}
      emptyMessage="No exams yet. Add one after creating a course."
      submitLabel="Add exam"
      onCreate={(values) => saveExam(null, values)}
      onUpdate={(id, values) => saveExam(id, values)}
      onDelete={deleteExam}
      onRetry={() => { retry(); courses.retry() }}
    >
      <AcademicTabs />
      {courses.rows.length === 0 && !courses.loading && <p className="workspace-state">Add a course first in <Link to="/academics/courses">Courses</Link>.</p>}
    </RecordWorkspace>
  )
}

function examType(value: string): ExamRow['exam_type'] {
  if (value === 'quiz' || value === 'midterm' || value === 'final' || value === 'other') return value
  return 'exam'
}

function GradesPage() {
  const courses = useCourses()
  const loadGrades = useCallback(async (userId: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.from('grade_records').select('*').eq('user_id', userId).order('assessed_on', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])
  const { rows, userId, loading, error, updateRows, retry } = useOwnedRows(loadGrades)
  const courseName = (courseId: string | null) => courses.rows.find((course) => course.id === courseId)?.name

  const saveGrade = async (id: string | null, values: Record<string, string>) => {
    if (!supabase || !userId) throw new Error('Sign in to save grades.')
    const grade = {
      assessment_name: values.assessment_name.trim(),
      score: requiredNumber(values.score, 'score'),
      maximum_score: requiredNumber(values.maximum_score, 'maximum score'),
      weight: optionalNumber(values.weight, 'weight'),
      assessed_on: values.assessed_on || null,
      course_id: values.course_id || null,
    }
    if (grade.score > grade.maximum_score) throw new Error('Score cannot be greater than the maximum score.')
    if (id) {
      const { data, error: updateError } = await supabase.from('grade_records').update(grade)
        .eq('id', id).eq('user_id', userId).select('*').single()
      if (updateError) throw updateError
      updateRows((current) => current.map((item) => item.id === id ? data : item))
    } else {
      const { data, error: insertError } = await supabase.from('grade_records')
        .insert({ ...grade, user_id: userId }).select('*').single()
      if (insertError) throw insertError
      updateRows((current) => [...current, data])
    }
  }

  const deleteGrade = async (id: string) => {
    if (!userId) throw new Error('Sign in to delete grades.')
    const { error: deleteError } = await removeRecord('grade_records', id, userId)
    if (deleteError) throw deleteError
    updateRows((current) => current.filter((grade) => grade.id !== id))
  }

  return (
    <RecordWorkspace
      title="Grades"
      description="Record scores and review your results. Percentages are calculated from the scores you enter."
      fields={[
        { name: 'assessment_name', label: 'Assessment', type: 'text', required: true },
        { name: 'course_id', label: 'Course (optional)', type: 'select', options: courses.rows.map((course) => ({ value: course.id, label: course.name })) },
        { name: 'score', label: 'Score', type: 'number', required: true, min: 0, step: 0.01 },
        { name: 'maximum_score', label: 'Maximum score', type: 'number', required: true, min: 0.01, step: 0.01 },
        { name: 'weight', label: 'Weight % (optional)', type: 'number', min: 0, max: 100, step: 0.01 },
        { name: 'assessed_on', label: 'Date', type: 'date' },
      ]}
      records={rows.map((grade) => ({
        id: grade.id,
        title: grade.assessment_name,
        fields: {
          assessment_name: grade.assessment_name,
          course_id: grade.course_id ?? '',
          score: String(grade.score),
          maximum_score: String(grade.maximum_score),
          weight: grade.weight === null ? '' : String(grade.weight),
          assessed_on: grade.assessed_on ?? '',
        },
        subtitle: [courseName(grade.course_id), grade.assessed_on].filter(Boolean).join(' · ') || 'Grade record',
        detail: `${((grade.score / grade.maximum_score) * 100).toFixed(1)}%`,
      }))}
      loading={loading || courses.loading}
      error={error ?? courses.error}
      emptyMessage="No grades recorded yet."
      submitLabel="Add grade"
      onCreate={(values) => saveGrade(null, values)}
      onUpdate={(id, values) => saveGrade(id, values)}
      onDelete={deleteGrade}
      onRetry={() => { retry(); courses.retry() }}
    >
      <AcademicTabs />
    </RecordWorkspace>
  )
}

export function AcademicsPage() {
  const { pathname } = useLocation()
  if (pathname === '/academics') return <Navigate to="/academics/courses" replace />
  if (pathname.endsWith('/assignments')) return <AssignmentsPage />
  if (pathname.endsWith('/exams')) return <ExamsPage />
  if (pathname.endsWith('/grades')) return <GradesPage />
  return <CoursesPage />
}
