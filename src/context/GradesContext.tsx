/**
 * GradesContext — no mock data.
 * All courses loaded from the real backend by professor ID.
 * Grades are stored locally (localStorage) until a grades API is built.
 */

import {
  createContext, useContext, useState, useEffect, useRef,
  useCallback, type ReactNode,
} from 'react'
import type { Course, Grade, GradeComponent } from '../types'
import { courseService, type BackendCourse } from '../services/courseService'
import { programService } from '../services/programService'

interface GradesContextValue {
  courseList:         Course[]
  grades:             Grade[]
  lastSaved:          Date | null
  loadingCourses:     boolean
  selectedCourseId:   string | null
  setSelectedCourseId:(id: string | null) => void
  updateGrade:        (studentId: string, componentId: string, value: number | null) => void
  updateComponents:   (courseId: string, components: Course['components']) => void
  refreshCourses:     (professorId: string) => Promise<void>
  clearCourses:       () => void
}

const GradesContext = createContext<GradesContextValue | null>(null)

// ─── Default grade components ─────────────────────────────────────────────────
function defaultComponents(courseId: string): GradeComponent[] {
  return [
    { id: `${courseId}-p1`, name: 'Parcial 1', percentage: 30 },
    { id: `${courseId}-p2`, name: 'Parcial 2', percentage: 30 },
    { id: `${courseId}-pf`, name: 'Final',     percentage: 40 },
  ]
}

// ─── Convert backend course → frontend Course ─────────────────────────────────
function backendToFrontend(
  bc: BackendCourse,
  professorId: string,
  studentIds: string[] = [],
  programName?: string,
): Course {
  return {
    id:         bc.id,
    code:       bc.code,
    name:       bc.name,
    group:      'A',
    professorId,
    semester:   bc.academic_period ?? '2025-I',
    studentIds,
    components: defaultComponents(bc.id),
    program:    programName ?? bc.program_id,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GradesProvider({ children }: { children: ReactNode }) {
  const [courseList, setCourseList] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [grades, setGrades] = useState<Grade[]>(() => {
    try {
      const s = localStorage.getItem('ar-grades')
      if (s) return JSON.parse(s) as Grade[]
    } catch { /* ignore */ }
    return []
  })
  const [lastSaved, setLastSaved]    = useState<Date | null>(null)
  const [loadingCourses, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Persist grades to localStorage
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      localStorage.setItem('ar-grades', JSON.stringify(grades))
      setLastSaved(new Date())
    }, 700)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [grades])

  // ── Fetch professor's courses from backend ─────────────────────────────────
  const refreshCourses = useCallback(async (professorId: string) => {
    setLoading(true)
    try {
      const backendCourses = await courseService.listByProfessor(professorId)

      // Collect unique program IDs and resolve their names
      const programIds = [...new Set(backendCourses.map(bc => bc.program_id).filter(Boolean))]
      const programNames: Record<string, string> = {}
      const progResults = await Promise.allSettled(
        programIds.map(async (pid) => {
          const prog = await programService.getProgram(pid)
          return { pid, name: prog.program_name }
        }),
      )
      for (const r of progResults) {
        if (r.status === 'fulfilled') {
          programNames[r.value.pid] = r.value.name
        } else {
          console.warn('[GradesContext] Could not resolve program name:', r.reason)
        }
      }

      // Fetch students for each course in parallel
      const coursesWithStudents = await Promise.all(
        backendCourses.map(async (bc) => {
          let studentIds: string[] = []
          try {
            const students = await courseService.listCourseStudents(bc.id, professorId)
            studentIds = students.map(s => s.id)
          } catch { /* empty */ }

          return backendToFrontend(
            bc,
            professorId,
            studentIds,
            programNames[bc.program_id] ?? bc.program_id,
          )
        }),
      )

      setCourseList(coursesWithStudents)
    } catch (err) {
      console.error('[GradesContext] Failed to load courses:', err)
      setCourseList([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearCourses = useCallback(() => setCourseList([]), [])

  // ── Grade mutations ────────────────────────────────────────────────────────
  const updateGrade = (studentId: string, componentId: string, value: number | null) => {
    setGrades(prev => {
      const idx = prev.findIndex(
        g => g.studentId === studentId && g.componentId === componentId,
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], value }
        return next
      }
      return [...prev, { studentId, componentId, value }]
    })
  }

  const updateComponents = (courseId: string, components: Course['components']) => {
    setCourseList(prev =>
      prev.map(c => c.id === courseId ? { ...c, components } : c),
    )
  }

  return (
    <GradesContext.Provider
      value={{
        courseList,
        grades,
        lastSaved,
        loadingCourses,
        selectedCourseId,
        setSelectedCourseId,
        updateGrade,
        updateComponents,
        refreshCourses,
        clearCourses,
      }}
    >
      {children}
    </GradesContext.Provider>
  )
}

export function useGrades() {
  const ctx = useContext(GradesContext)
  if (!ctx) throw new Error('useGrades must be used within GradesProvider')
  return ctx
}
