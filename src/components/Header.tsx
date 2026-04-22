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
    /* DESIGN.md §4 Nav — House Green bg, 3-layer shadow, sticky */
    <header className="bg-sbucks-house sticky top-0 z-40 shadow-nav">
      <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto" style={{ minHeight: '64px' }}>
        {/* Left: brand */}
        <div className="flex items-center gap-4">
          <Link to={isStudent ? '/' : '/dashboard'} className="flex items-center gap-2.5 group">
            {/* Brand icon pill — sbucks-accent/20 */}
            <div className="w-8 h-8 rounded-lg bg-sbucks-accent/30 border border-sbucks-accent/40 flex items-center justify-center">
              <BarChart2 size={16} className="text-sbucks-light" />
            </div>
            <div>
              <span
                className="text-white font-extrabold text-sm group-hover:text-sbucks-light transition-colors"
                style={{ letterSpacing: '-0.016em' }}
              >
                Academic Risk
              </span>
              {subtitle && (
                <p className="text-white/40 text-[0.62rem] leading-tight">{subtitle}</p>
              )}
            </div>
          </Link>

          {/* Nav links — students */}
          {isStudent && (
            <nav className="hidden md:flex items-center gap-0.5 ml-3">
              {[
                { to: '/',           icon: BookOpen,      label: 'Inicio' },
                { to: '/mis-notas',  icon: ClipboardList, label: 'Mis Notas' },
                { to: '/prediccion', icon: BarChart2,      label: 'Predicción' },
              ].map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-sbucks-accent/25 text-sbucks-light'
                        : 'text-white/50 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Nav links — professors */}
          {isProfessor && (
            <nav className="hidden md:flex items-center gap-0.5 ml-3">
              {[
                { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                { to: '/grades',    icon: BookOpen,        label: 'Calificaciones' },
              ].map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-sbucks-accent/25 text-sbucks-light'
                        : 'text-white/50 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>

        {/* Right: autosave + user */}
        <div className="flex items-center gap-3">
          {/* Autosave indicator — professors only */}
          {isProfessor && lastSaved !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-xs bg-white/6 px-3 py-1.5 rounded-pill border border-white/10">
              {timeStr ? (
                <>
                  <Cloud size={11} className="text-sbucks-light" />
                  <span className="font-medium">Guardado · {timeStr}</span>
                </>
              ) : (
                <>
                  <Loader2 size={11} className="animate-spin text-sbucks-light" />
                  <span className="font-medium">Guardando…</span>
                </>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-white/15" />

          {/* User avatar + name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sbucks-accent/30 border border-sbucks-accent/40 flex items-center justify-center text-sbucks-light font-extrabold text-xs">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-[0.78rem] font-bold leading-tight" style={{ letterSpacing: '-0.01em' }}>
                {user?.name}
              </p>
              <p className="text-white/40 text-[0.62rem] capitalize">
                {user?.role === 'student' ? 'Estudiante' : 'Docente'}
              </p>
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
