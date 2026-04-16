import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import type { Course, Grade } from '../types'
import { courses as initialCourses, generateInitialGrades } from '../data/mockData'

interface GradesContextValue {
  courseList:         Course[]
  grades:             Grade[]
  lastSaved:          Date | null
  updateGrade:        (studentId: string, componentId: string, value: number | null) => void
  updateComponents:   (courseId: string, components: Course['components']) => void
}

const GradesContext = createContext<GradesContextValue | null>(null)

export function GradesProvider({ children }: { children: ReactNode }) {
  const [courseList, setCourseList] = useState<Course[]>(initialCourses)
  const [grades, setGrades] = useState<Grade[]>(() => {
    try {
      const s = localStorage.getItem('ar-grades')
      if (s) return JSON.parse(s) as Grade[]
    } catch { /* ignore */ }
    return generateInitialGrades()
  })
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      localStorage.setItem('ar-grades', JSON.stringify(grades))
      setLastSaved(new Date())
    }, 700)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [grades])

  const updateGrade = (studentId: string, componentId: string, value: number | null) => {
    setGrades(prev => {
      const idx = prev.findIndex(g => g.studentId === studentId && g.componentId === componentId)
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], value }; return next }
      return [...prev, { studentId, componentId, value }]
    })
  }

  const updateComponents = (courseId: string, components: Course['components']) => {
    setCourseList(prev => prev.map(c => c.id === courseId ? { ...c, components } : c))
  }

  return (
    <GradesContext.Provider value={{ courseList, grades, lastSaved, updateGrade, updateComponents }}>
      {children}
    </GradesContext.Provider>
  )
}

export function useGrades() {
  const ctx = useContext(GradesContext)
  if (!ctx) throw new Error('useGrades must be used within GradesProvider')
  return ctx
}
