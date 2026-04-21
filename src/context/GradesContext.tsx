import {
  createContext, useContext, useState, useEffect, useRef,
  useCallback, type ReactNode,
} from 'react'
import type { Course, Grade, GradeComponent } from '../types'
import { courses as initialCourses, generateInitialGrades } from '../data/mockData'
import { courseService, type BackendCourse } from '../services/courseService'

interface GradesContextValue {
  courseList:       Course[]
  grades:           Grade[]
  lastSaved:        Date | null
  loadingCourses:   boolean
  updateGrade:      (studentId: string, componentId: string, value: number | null) => void
  updateComponents: (courseId: string, components: Course['components']) => void
  refreshCourses:   (professorId: string) => Promise<void>
}

const GradesContext = createContext<GradesContextValue | null>(null)

// ─── Default grade components when the backend doesn't provide them ───────────
function defaultComponents(courseId: string): GradeComponent[] {
  return [
    { id: `${courseId}-p1`, name: 'Parcial 1',   percentage: 30 },
    { id: `${courseId}-p2`, name: 'Parcial 2',   percentage: 30 },
    { id: `${courseId}-pf`, name: 'Final',        percentage: 40 },
  ]
}

// ─── Convert a backend course to the frontend Course shape ───────────────────
function backendToFrontend(bc: BackendCourse, professorId: string): Course {
  return {
    id:         bc.id,
    code:       bc.code,
    name:       bc.name,
    group:      bc.academic_period ?? 'A',
    professorId,
    semester:   bc.academic_period ?? '2025-I',
    studentIds: [],                         // populated lazily per-course
    components: defaultComponents(bc.id),
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GradesProvider({ children }: { children: ReactNode }) {
  const [courseList, setCourseList] = useState<Course[]>(initialCourses)
  const [grades, setGrades] = useState<Grade[]>(() => {
    try {
      const s = localStorage.getItem('ar-grades')
      if (s) return JSON.parse(s) as Grade[]
    } catch { /* ignore */ }
    return generateInitialGrades()
  })
  const [lastSaved, setLastSaved]       = useState<Date | null>(null)
  const [loadingCourses, setLoading]    = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Persist grades to localStorage with debounce
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      localStorage.setItem('ar-grades', JSON.stringify(grades))
      setLastSaved(new Date())
    }, 700)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [grades])

  // ── Fetch courses for a professor from the backend ─────────────────────────
  const refreshCourses = useCallback(async (professorId: string) => {
    setLoading(true)
    try {
      const backendCourses = await courseService.listByProfessor(professorId)
      if (backendCourses.length > 0) {
        setCourseList(backendCourses.map(bc => backendToFrontend(bc, professorId)))
      }
      // If the backend returns nothing, keep existing mock courses
    } catch (err) {
      console.info('[GradesContext] Backend courses unavailable, using mock:', err)
      // Silently fall back to mock data
    } finally {
      setLoading(false)
    }
  }, [])

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
        updateGrade,
        updateComponents,
        refreshCourses,
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
