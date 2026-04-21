import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Course } from './types'
import { useAuth } from './context/AuthContext'
import { useGrades } from './context/GradesContext'
import LoginPage from './pages/Login'
import Landing from './pages/Landing'
import Prediccion from './pages/Prediccion'
import MisNotas from './pages/MisNotas'
import Dashboard from './pages/Dashboard'
import GradesPage from './pages/Grades'
import AdminPage from './pages/Admin'

// ─── Protected route wrapper ─────────────────────────────────────────────────
type AllowedRole = 'student' | 'professor' | 'admin'
function RequireRole({ role, children }: { role: AllowedRole; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    const home = user.role === 'student' ? '/' : user.role === 'admin' ? '/admin' : '/dashboard'
    return <Navigate to={home} replace />
  }
  return <>{children}</>
}

// ─── Professor portal ────────────────────────────────────────────────────────
function ProfessorPortal() {
  const { user, logout } = useAuth()
  const { courseList, grades, lastSaved, updateGrade, updateComponents, refreshCourses } = useGrades()
  const navigate = useNavigate()
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // Load professor's real courses from the backend on mount
  useEffect(() => {
    if (user?.professorId) {
      void refreshCourses(user.professorId)
    }
  }, [user?.professorId, refreshCourses])

  const myCourses = courseList.filter(c => c.professorId === user?.professorId)

  // When navigating to /grades with no prior selection, fall back to the first course
  const activeCourse = selectedCourse ?? myCourses[0] ?? null

  return (
    <Routes>
      <Route
        path="dashboard"
        element={
          <Dashboard
            courses={myCourses}
            grades={grades}
            onSelectCourse={c => { setSelectedCourse(c); navigate('/grades') }}
            onLogout={logout}
          />
        }
      />
      <Route
        path="grades"
        element={
          activeCourse ? (
            <GradesPage
              course={activeCourse}
              grades={grades}
              lastSaved={lastSaved}
              onUpdateGrade={updateGrade}
              onUpdateComponents={(id, comps) => {
                updateComponents(id, comps)
                setSelectedCourse(prev => prev?.id === id ? { ...prev, components: comps } : prev)
              }}
              onBack={() => { setSelectedCourse(null); navigate('/dashboard') }}
              onLogout={logout}
            />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
    </Routes>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{ minHeight: '100vh' }}
      >
        <Routes location={location}>
          {/* Public */}
          <Route
            path="/login"
            element={user
              ? <Navigate to={user.role === 'student' ? '/' : user.role === 'admin' ? '/admin' : '/dashboard'} replace />
              : <LoginPage />
            }
          />

          {/* Student routes */}
          <Route path="/" element={
            <RequireRole role="student"><Landing /></RequireRole>
          } />
          <Route path="/prediccion" element={
            <RequireRole role="student"><Prediccion /></RequireRole>
          } />
          <Route path="/mis-notas" element={
            <RequireRole role="student"><MisNotas /></RequireRole>
          } />

          {/* Professor routes */}
          <Route path="/*" element={
            <RequireRole role="professor"><ProfessorPortal /></RequireRole>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <RequireRole role="admin"><AdminPage /></RequireRole>
          } />

          {/* Fallback */}
          <Route path="*" element={
            <Navigate to={
              user ? (user.role === 'student' ? '/' : user.role === 'admin' ? '/admin' : '/dashboard') : '/login'
            } replace />
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
