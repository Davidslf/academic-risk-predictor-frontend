import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AuthUser, UserRole } from '../types'
import { professors, students, adminUser, DEMO_PASSWORD } from '../data/mockData'
import { authService } from '../services/authService'
import { tokenStore } from '../services/api'

interface AuthContextValue {
  user:    AuthUser | null
  loading: boolean
  login:   (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout:  () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Username → email mapping ─────────────────────────────────────────────────
// The backend authenticates via email; the UI uses username/code.

function resolveEmail(username: string): string | null {
  const trimmed = username.trim().toLowerCase()

  // Admin
  if (trimmed === adminUser.username) return 'admin@academicrisk.edu'

  // Professor slug → email
  const prof = professors.find(p => p.username.toLowerCase() === trimmed)
  if (prof) return prof.email

  // Student code → synthetic email
  const student = students.find(
    s => s.studentCode === trimmed || s.studentCode === username.trim(),
  )
  if (student) return `${student.studentCode}@student.academicrisk.edu`

  return null
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('ar-user')
      if (stored) return JSON.parse(stored) as AuthUser
    } catch { /* ignore */ }
    return null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem('ar-user', JSON.stringify(user))
    } else {
      localStorage.removeItem('ar-user')
    }
  }, [user])

  // ── Mock login (always works offline) ──────────────────────────────────────
  function mockLogin(username: string, password: string): { success: boolean; error?: string } {
    if (password !== DEMO_PASSWORD) {
      return { success: false, error: 'Contraseña incorrecta. (Demo: usa "demo")' }
    }
    const trimmed = username.trim().toLowerCase()

    if (trimmed === adminUser.username) {
      setUser({ id: adminUser.id, role: 'admin', name: adminUser.name, username: adminUser.username })
      return { success: true }
    }

    const prof = professors.find(p => p.username.toLowerCase() === trimmed)
    if (prof) {
      setUser({
        id:          prof.id,
        role:        'professor' as UserRole,
        name:        `${prof.title} ${prof.name}`,
        username:    prof.username,
        professorId: prof.id,
      })
      return { success: true }
    }

    const student = students.find(
      s => s.studentCode === trimmed || s.studentCode === username.trim(),
    )
    if (student) {
      setUser({
        id:        student.id,
        role:      'student' as UserRole,
        name:      student.name,
        username:  student.studentCode,
        studentId: student.id,
      })
      return { success: true }
    }

    return { success: false, error: 'Usuario no encontrado. Verifica tu código o nombre de usuario.' }
  }

  // ── Main login: try backend → fallback to mock ─────────────────────────────
  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    try {
      const email = resolveEmail(username)

      if (email) {
        try {
          const tokens = await authService.login(email, password)
          // Decode the JWT to extract user info
          const payload = authService.decodeToken(tokens.access_token)
          const trimmed = username.trim().toLowerCase()

          // Build AuthUser from local mock data (ids stay consistent)
          if (trimmed === adminUser.username) {
            setUser({ id: adminUser.id, role: 'admin', name: adminUser.name, username: adminUser.username })
            return { success: true }
          }

          const prof = professors.find(p => p.username.toLowerCase() === trimmed)
          if (prof) {
            // Prefer backend UUID when available
            const backendId = (payload?.sub as string) ?? prof.id
            setUser({
              id:          backendId,
              role:        'professor',
              name:        `${prof.title} ${prof.name}`,
              username:    prof.username,
              professorId: backendId,
            })
            return { success: true }
          }

          const student = students.find(
            s => s.studentCode === trimmed || s.studentCode === username.trim(),
          )
          if (student) {
            const backendId = (payload?.sub as string) ?? student.id
            setUser({
              id:        backendId,
              role:      'student',
              name:      student.name,
              username:  student.studentCode,
              studentId: backendId,
            })
            return { success: true }
          }

          // Backend accepted but user not in mock — use payload data
          if (payload) {
            const roleMap: Record<string, UserRole> = {
              STUDENT:   'student',
              PROFESSOR: 'professor',
              ADMIN:     'admin',
            }
            setUser({
              id:       payload.sub as string,
              role:     roleMap[payload.role as string] ?? 'student',
              name:     (payload.full_name as string) ?? username,
              username: username.trim(),
            })
            return { success: true }
          }
        } catch (backendErr) {
          // Backend unavailable or rejected — fall through to mock
          console.info('[Auth] Backend login failed, using mock:', backendErr)
          tokenStore.clearTokens()
          return mockLogin(username, password)
        }
      }

      // No email mapping found → mock only
      return mockLogin(username, password)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    void authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
