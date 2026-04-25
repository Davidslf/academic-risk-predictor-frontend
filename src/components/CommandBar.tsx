/**
 * CommandBar — Cmd+K fast navigation and action palette.
 * Keyboard-driven: Arrow↑↓ navigate, Enter activates, Escape closes.
 * XSS-safe: query is used only as React text — never as innerHTML.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutDashboard, BookOpen, BarChart2,
  GraduationCap, Users, LogOut, Settings, ChevronRight, Command,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ─── Action registry ─────────────────────────────────────────────────────────

type ActionGroup = 'Navegación' | 'Acciones'

interface Action {
  id:       string
  label:    string
  hint?:    string
  icon:     LucideIcon
  group:    ActionGroup
  roles?:   ('student' | 'professor' | 'admin')[]
  onSelect: (ctx: { navigate: ReturnType<typeof useNavigate>; logout: () => void }) => void
}

const ACTIONS: Action[] = [
  {
    id: 'nav-home-student',
    label: 'Inicio',
    hint: 'Tu panel principal',
    icon: BookOpen,
    group: 'Navegación',
    roles: ['student'],
    onSelect: ({ navigate }) => navigate('/'),
  },
  {
    id: 'nav-progress',
    label: 'Mi Progreso',
    hint: 'Materias y predicciones',
    icon: GraduationCap,
    group: 'Navegación',
    roles: ['student'],
    onSelect: ({ navigate }) => navigate('/mis-materias'),
  },
  {
    id: 'nav-prediccion',
    label: 'Predicción IA',
    hint: 'Riesgo académico',
    icon: BarChart2,
    group: 'Navegación',
    roles: ['student'],
    onSelect: ({ navigate }) => navigate('/prediccion'),
  },
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    hint: 'Resumen del curso',
    icon: LayoutDashboard,
    group: 'Navegación',
    roles: ['professor'],
    onSelect: ({ navigate }) => navigate('/dashboard'),
  },
  {
    id: 'nav-grades',
    label: 'Calificaciones',
    hint: 'Ingresar y editar notas',
    icon: BookOpen,
    group: 'Navegación',
    roles: ['professor'],
    onSelect: ({ navigate }) => navigate('/grades'),
  },
  {
    id: 'nav-estadisticas',
    label: 'Estadísticas',
    hint: 'Análisis del grupo',
    icon: BarChart2,
    group: 'Navegación',
    roles: ['professor'],
    onSelect: ({ navigate }) => navigate('/estadisticas'),
  },
  {
    id: 'nav-admin',
    label: 'Panel de Admin',
    hint: 'Usuarios y programas',
    icon: Settings,
    group: 'Navegación',
    roles: ['admin'],
    onSelect: ({ navigate }) => navigate('/admin'),
  },
  {
    id: 'nav-usuarios',
    label: 'Gestión de Usuarios',
    hint: 'Admin',
    icon: Users,
    group: 'Navegación',
    roles: ['admin'],
    onSelect: ({ navigate }) => navigate('/admin'),
  },
  {
    id: 'action-logout',
    label: 'Cerrar sesión',
    hint: 'Salir de la plataforma',
    icon: LogOut,
    group: 'Acciones',
    onSelect: ({ navigate, logout }) => { logout(); navigate('/login') },
  },
]

// ─── Hook: open/close via Cmd+K ─────────────────────────────────────────────

export function useCommandBar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { open, setOpen }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface CommandBarProps {
  open:    boolean
  onClose: () => void
}

export default function CommandBar({ open, onClose }: CommandBarProps) {
  const [query,   setQuery]   = useState('')
  const [cursor,  setCursor]  = useState(0)
  const inputRef              = useRef<HTMLInputElement>(null)
  const listRef               = useRef<HTMLUListElement>(null)
  const navigate              = useNavigate()
  const { user, logout }      = useAuth()

  // Filter actions by role + query
  const filtered = useMemo(() => {
    const role = user?.role ?? 'student'
    const q    = query.toLowerCase().trim()
    return ACTIONS.filter(a => {
      if (a.roles && !a.roles.includes(role as 'student' | 'professor' | 'admin')) return false
      if (!q) return true
      return a.label.toLowerCase().includes(q) || (a.hint ?? '').toLowerCase().includes(q)
    })
  }, [query, user?.role])

  // Reset cursor when results change
  useEffect(() => { setCursor(0) }, [filtered.length])

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const activate = useCallback((action: Action) => {
    action.onSelect({ navigate, logout })
    onClose()
  }, [navigate, logout, onClose])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor(c => Math.min(c + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor(c => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[cursor]) activate(filtered[cursor])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const item = listRef.current?.children[cursor] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  // Group filtered results
  const groups = useMemo(() => {
    const map = new Map<ActionGroup, Action[]>()
    for (const a of filtered) {
      if (!map.has(a.group)) map.set(a.group, [])
      map.get(a.group)!.push(a)
    }
    return map
  }, [filtered])

  // Flat index for cursor
  const flatItems = useMemo(() => filtered, [filtered])

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          >
            {/* Dialog */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Barra de comandos"
              initial={{ opacity: 0, scale: 0.93, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: -12 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: 'var(--shadow-modal)', maxHeight: '70vh' }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-usb-border">
                <Search size={17} className="text-usb-faint flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Buscar páginas o acciones…"
                  className="flex-1 text-sm text-usb-text placeholder-usb-faint outline-none bg-transparent font-medium"
                  aria-label="Buscar comandos"
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd className="hidden sm:flex items-center gap-1 text-[0.65rem] font-bold text-usb-faint border border-usb-border rounded-lg px-1.5 py-0.5">
                  <Command size={10} /> K
                </kbd>
              </div>

              {/* Results */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 60px)' }}>
                {filtered.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-usb-faint font-medium">Sin resultados para "{query}"</p>
                  </div>
                ) : (
                  <ul ref={listRef} role="listbox" className="py-1.5">
                    {Array.from(groups.entries()).map(([groupName, actions]) => (
                      <li key={groupName} role="group" aria-label={groupName}>
                        <div className="px-4 pt-3 pb-1 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-usb-faint">
                          {groupName}
                        </div>
                        {actions.map(action => {
                          const flatIdx = flatItems.indexOf(action)
                          const active  = flatIdx === cursor
                          const Icon    = action.icon
                          return (
                            <button
                              key={action.id}
                              role="option"
                              aria-selected={active}
                              onClick={() => activate(action)}
                              onMouseEnter={() => setCursor(flatIdx)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                                active
                                  ? 'bg-green-light/40'
                                  : 'hover:bg-canvas-warm'
                              }`}
                            >
                              <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                                active ? 'bg-green-accent text-white' : 'bg-canvas-ceramic text-usb-muted'
                              }`}>
                                <Icon size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-tight truncate ${
                                  active ? 'text-green-accent' : 'text-usb-text'
                                }`}>
                                  {action.label}
                                </p>
                                {action.hint && (
                                  <p className="text-xs text-usb-faint truncate">{action.hint}</p>
                                )}
                              </div>
                              {active && <ChevronRight size={14} className="text-green-accent flex-shrink-0" />}
                            </button>
                          )
                        })}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer hint */}
              <div className="border-t border-usb-border px-4 py-2 flex items-center gap-4 text-[0.65rem] text-usb-faint">
                <span><kbd className="font-mono font-bold">↑↓</kbd> navegar</span>
                <span><kbd className="font-mono font-bold">↵</kbd> abrir</span>
                <span><kbd className="font-mono font-bold">Esc</kbd> cerrar</span>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
