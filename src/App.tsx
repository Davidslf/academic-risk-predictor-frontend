import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import type { Course } from './types'
import { useAuth } from './context/AuthContext'
import { useGrades } from './context/GradesContext'
import LoginPage from './pages/Login'
import Landing from './pages/Landing'
import Prediccion from './pages/Prediccion'
import MisNotas from './pages/MisNotas'
import Dashboard from './pages/Dashboard'
import GradesPage from './pages/Grades'

// ─── Protected route wrapper ─────────────────────────────────────────────────
function RequireRole({ role, children }: { role: 'student' | 'professor'; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'student' ? '/' : '/dashboard'} replace />
  return <>{children}</>
}

// ─── Professor portal ────────────────────────────────────────────────────────
function ProfessorPortal() {
  const { user, logout } = useAuth()
  const { courseList, grades, lastSaved, updateGrade, updateComponents } = useGrades()
  const navigate = useNavigate()
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const myCourses = courseList.filter(c => c.professorId === user?.professorId)

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
          selectedCourse ? (
            <GradesPage
              course={selectedCourse}
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

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user
          ? <Navigate to={user.role === 'student' ? '/' : '/dashboard'} replace />
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

      {/* Fallback */}
      <Route path="*" element={
        <Navigate to={user ? (user.role === 'student' ? '/' : '/dashboard') : '/login'} replace />
      } />
    </Routes>
  )
}
