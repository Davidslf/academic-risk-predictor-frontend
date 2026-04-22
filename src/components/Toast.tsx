import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const icons = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
}

/* DESIGN.md §4 — success & info use sbucks-accent green; error uses semantic red; warning uses amber */
const styles = {
  success: { bar: 'bg-sbucks-accent', icon: 'text-sbucks-accent', bg: 'bg-white' },
  error:   { bar: 'bg-red-500',       icon: 'text-red-500',       bg: 'bg-white' },
  warning: { bar: 'bg-amber-400',     icon: 'text-amber-500',     bg: 'bg-white' },
  info:    { bar: 'bg-sbucks-green',  icon: 'text-sbucks-green',  bg: 'bg-white' },
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const s = styles[toast.type]
  const Icon = icons[toast.type]

  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, onRemove])

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      /* DESIGN.md §6 — 2-layer modal shadow */
      className={`relative flex items-start gap-3 w-80 ${s.bg} rounded-card shadow-modal border border-usb-border overflow-hidden pr-4 pl-4 py-3.5`}
    >
      {/* Left color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-card`} />

      <Icon size={18} className={`${s.icon} flex-shrink-0 mt-0.5 ml-1`} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-ink" style={{ letterSpacing: '-0.01em' }}>{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-ink-faint hover:text-ink-soft transition-colors flex-shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev.slice(-4), { ...opts, id }])
  }, [])

  const ctx: ToastContextValue = {
    toast: add,
    success: (title, message) => add({ type: 'success', title, message }),
    error:   (title, message) => add({ type: 'error',   title, message }),
    warning: (title, message) => add({ type: 'warning', title, message }),
    info:    (title, message) => add({ type: 'info',    title, message }),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
