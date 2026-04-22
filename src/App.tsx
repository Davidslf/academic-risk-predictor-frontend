import { useEffect, Component, type ReactNode } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { useGrades } from './context/GradesContext'
import LoginPage from './pages/Login'
import Landing from './pages/Landing'
import Prediccion from './pages/Prediccion'
import MisNotas from './pages/MisNotas'
import Dashboard from './pages/Dashboard'
import GradesPage from './pages/Grades'
import AdminPage from './pages/Admin'

// ─── Error Boundary ──────────────────────────────────────────────────────────
interface EBState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(err: Error): EBState {
    console.error('[ErrorBoundary]', err)
    return { hasError: true, message: err.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-usb-canvas flex items-center justify-center p-8">
          <div className="bg-white border border-usb-border rounded-3xl shadow-modal p-10 max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-extrabold text-usb-text">Algo salió mal</h2>
            <p className="text-usb-muted text-sm">
              Ocurrió un error inesperado al cargar esta página.
            </p>
            <p className="text-xs text-usb-faint font-mono bg-usb-canvas rounded-xl px-4 py-2">
              {this.state.message}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
              className="bg-ar-cyan text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-ar-cyan-dark transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Protected route wrapper ─────────────────────────────────────────────────
type AllowedRole = 'student' | 'professor' | 'admin'
function RequireRole({ role, children }: { role: AllowedRole; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    const home = user.role === 'admin' ? '/admin' : user.role === 'professor' ? '/dashboard' : '/'
    return <Navigate to={home} replace />
  }
  return <>{children}</>
}

// ─── Role-based home redirect ────────────────────────────────────────────────
function RoleHome() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin')     return <Navigate to="/admin"     replace />
  if (user.role === 'professor') return <Navigate to="/dashboard" replace />
  return <Navigate to="/" replace />
}

// ─── Professor page components ───────────────────────────────────────────────
function ProfessorDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { courseList, grades, refreshCourses, setSelectedCourseId } = useGrades()

  useEffect(() => {
    if (user?.professorId) void refreshCourses(user.professorId)
  }, [user?.professorId, refreshCourses])

  const myCourses = courseList.filter(c => c.professorId === user?.professorId)

  return (
    <Dashboard
      courses={myCourses}
      grades={grades}
      onSelectCourse={c => { setSelectedCourseId(c.id); navigate('/grades') }}
      onLogout={logout}
    />
  )
}

function ProfessorGrades() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { courseList, grades, lastSaved, selectedCourseId, setSelectedCourseId, updateGrade, updateComponents, refreshCourses } = useGrades()

  useEffect(() => {
    if (user?.professorId) void refreshCourses(user.professorId)
  }, [user?.professorId, refreshCourses])

  const myCourses = courseList.filter(c => c.professorId === user?.professorId)
  const activeCourse = myCourses.find(c => c.id === selectedCourseId) ?? myCourses[0] ?? null

  if (!activeCourse) return <Navigate to="/dashboard" replace />

  return (
    <GradesPage
      course={activeCourse}
      grades={grades}
      lastSaved={lastSaved}
      onUpdateGrade={updateGrade}
      onUpdateComponents={(id, comps) => {
        updateComponents(id, comps)
        setSelectedCourseId(id)
      }}
      onBack={() => { setSelectedCourseId(null); navigate('/dashboard') }}
      onLogout={logout}
    />
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <ErrorBoundary>
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
              element={user ? <RoleHome /> : <LoginPage />}
            />

            {/* Admin — explicit path so it never conflicts with professor wildcard */}
            <Route path="/admin" element={
              <RequireRole role="admin"><AdminPage /></RequireRole>
            } />

            {/* Student */}
            <Route path="/" element={
              <RequireRole role="student"><Landing /></RequireRole>
            } />
            <Route path="/prediccion" element={
              <RequireRole role="student"><Prediccion /></RequireRole>
            } />
            <Route path="/mis-notas" element={
              <RequireRole role="student"><MisNotas /></RequireRole>
            } />

            {/* Professor */}
            <Route path="/dashboard" element={
              <RequireRole role="professor"><ProfessorDashboard /></RequireRole>
            } />
            <Route path="/grades" element={
              <RequireRole role="professor"><ProfessorGrades /></RequireRole>
            } />

            {/* Catch-all → redirect by role */}
            <Route path="*" element={<RoleHome />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </ErrorBoundary>
  )
}
