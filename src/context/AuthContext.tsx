/**
 * AuthContext — pure backend authentication.
 * No mock data, no fallback. Login with email + password via JWT.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AuthUser, UserRole } from '../types'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { tokenStore } from '../services/api'

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:     AuthUser | null
  loading:  boolean
  login:    (email: string, password: string) => Promise<{ success: boolean; error?: string; firstName?: string; userId?: string }>
  logout:   () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Role mapping ──────────────────────────────────────────────────────────────

const ROLE_MAP: Record<string, UserRole> = {
  STUDENT:   'student',
  PROFESSOR: 'professor',
  ADMIN:     'admin',
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

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('ar-user', JSON.stringify(user))
    } else {
      localStorage.removeItem('ar-user')
    }
  }, [user])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string; firstName?: string; userId?: string }> => {
    setLoading(true)
    try {
      const tokens  = await authService.login(email.trim(), password)
      const payload = authService.decodeToken(tokens.access_token)

      if (!payload) {
        tokenStore.clearTokens()
        return { success: false, error: 'Respuesta inválida del servidor.' }
      }

      const role = ROLE_MAP[payload.role as string] ?? 'student'

      // Try to get the real full_name from the backend profile.
      // The JWT may only contain sub + role (no full_name claim).
      const userId = payload.sub as string
      let fullName: string = (payload.full_name as string | undefined) ?? ''
      try {
        const profile = await userService.getById(userId)
        if (profile?.full_name) fullName = profile.full_name
      } catch { /* silently fall back to JWT claim */ }

      // Last resort: derive a readable name from the email local-part
      if (!fullName || fullName.includes('@')) {
        fullName = email.split('@')[0].replace(/[._+]/g, ' ').trim()
      }

      // Extract just the first name for greeting purposes
      const firstName = fullName.split(/\s+/)[0] ?? fullName

      const authUser: AuthUser = {
        id:       userId,
        role,
        name:     fullName,
        username: email.trim(),
        email:    email.trim(),
        // Set role-specific ID fields
        ...(role === 'professor' ? { professorId: userId } : {}),
        ...(role === 'student'   ? { studentId:   userId } : {}),
      }

      setUser(authUser)
      return { success: true, firstName, userId }
    } catch (err: unknown) {
      tokenStore.clearTokens()
      // Return error message for the login page to handle
      if (err instanceof Error) {
        return { success: false, error: err.message }
      }
      return { success: false, error: 'No se pudo iniciar sesión.' }
    } finally {
      setLoading(false)
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
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
