import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Cloud, Loader2, BarChart2, BookOpen, LayoutDashboard, ClipboardList } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface Props {
  lastSaved?: Date | null
  subtitle?: string
}

export default function Header({ lastSaved, subtitle }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const timeStr = lastSaved
    ? lastSaved.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  const initials = user?.name.split(' ').map(w => w[0]).slice(0, 2).join('') ?? '?'
  const isStudent = user?.role === 'student'
  const isProfessor = user?.role === 'professor'

  return (
    <header className="bg-ar-navy border-b border-white/10 sticky top-0 z-40 shadow-lg">
      <div className="flex items-center justify-between px-5 py-3 max-w-7xl mx-auto">
        {/* Left: brand */}
        <div className="flex items-center gap-4">
          <Link to={isStudent ? '/' : '/dashboard'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-ar-cyan/20 border border-ar-cyan/30 flex items-center justify-center">
              <BarChart2 size={16} className="text-ar-cyan" />
            </div>
            <div>
              <span className="text-white font-extrabold text-sm tracking-tight group-hover:text-ar-cyan transition-colors">
                Academic Risk
              </span>
              {subtitle && (
                <p className="text-white/40 text-[0.65rem] leading-tight">{subtitle}</p>
              )}
            </div>
          </Link>

          {/* Nav links */}
          {isStudent && (
            <nav className="hidden md:flex items-center gap-1 ml-2">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  location.pathname === '/'
                    ? 'bg-ar-cyan/20 text-ar-cyan'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen size={13} />
                Inicio
              </Link>
              <Link
                to="/mis-notas"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  location.pathname === '/mis-notas'
                    ? 'bg-ar-cyan/20 text-ar-cyan'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <ClipboardList size={13} />
                Mis Notas
              </Link>
              <Link
                to="/prediccion"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  location.pathname === '/prediccion'
                    ? 'bg-ar-cyan/20 text-ar-cyan'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart2 size={13} />
                Predicción
              </Link>
            </nav>
          )}

          {isProfessor && (
            <nav className="hidden md:flex items-center gap-1 ml-2">
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-ar-cyan/20 text-ar-cyan'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard size={13} />
                Dashboard
              </Link>
              <Link
                to="/grades"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  location.pathname === '/grades'
                    ? 'bg-ar-cyan/20 text-ar-cyan'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen size={13} />
                Calificaciones
              </Link>
            </nav>
          )}
        </div>

        {/* Right: autosave + user */}
        <div className="flex items-center gap-3">
          {/* Autosave indicator (professors only) */}
          {isProfessor && lastSaved !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-xs bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              {timeStr ? (
                <>
                  <Cloud size={11} className="text-ar-cyan" />
                  <span className="font-medium">Guardado · {timeStr}</span>
                </>
              ) : (
                <>
                  <Loader2 size={11} className="animate-spin text-ar-cyan" />
                  <span className="font-medium">Guardando…</span>
                </>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-white/10" />

          {/* User */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-ar-cyan/20 border border-ar-cyan/30 flex items-center justify-center text-ar-cyan font-extrabold text-xs">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-[0.78rem] font-bold leading-tight">{user?.name}</p>
              <p className="text-white/40 text-[0.65rem] capitalize">{user?.role === 'student' ? 'Estudiante' : 'Docente'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-1 p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
