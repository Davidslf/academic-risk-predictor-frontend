import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AuthUser, UserRole } from '../types'
import { professors, students, DEMO_PASSWORD } from '../data/mockData'

interface AuthContextValue {
  user: AuthUser | null
  login: (username: string, password: string) => { success: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('ar-user')
      if (stored) return JSON.parse(stored) as AuthUser
    } catch { /* ignore */ }
    return null
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('ar-user', JSON.stringify(user))
    } else {
      localStorage.removeItem('ar-user')
    }
  }, [user])

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    if (password !== DEMO_PASSWORD) {
      return { success: false, error: 'Contraseña incorrecta. (Demo: usa "demo")' }
    }

    const trimmed = username.trim().toLowerCase()

    // Check professors first (by username slug)
    const prof = professors.find(p => p.username.toLowerCase() === trimmed)
    if (prof) {
      const authUser: AuthUser = {
        id: prof.id,
        role: 'professor' as UserRole,
        name: `${prof.title} ${prof.name}`,
        username: prof.username,
        professorId: prof.id,
      }
      setUser(authUser)
      return { success: true }
    }

    // Check students (by student code)
    const student = students.find(s => s.studentCode === trimmed || s.studentCode === username.trim())
    if (student) {
      const authUser: AuthUser = {
        id: student.id,
        role: 'student' as UserRole,
        name: student.name,
        username: student.studentCode,
        studentId: student.id,
      }
      setUser(authUser)
      return { success: true }
    }

    return { success: false, error: 'Usuario no encontrado. Verifica tu código o nombre de usuario.' }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
