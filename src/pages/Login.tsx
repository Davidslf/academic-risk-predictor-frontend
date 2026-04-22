import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, GraduationCap, BookOpen, AlertCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { professors, students } from '../data/mockData'

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHints, setShowHints] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Completa todos los campos.')
      return
    }
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 400))
    const result = login(username, password)
    if (!result.success) {
      setError(result.error ?? 'Credenciales inválidas.')
    }
    setLoading(false)
  }

  return (
    // DESIGN.md §7 — page canvas is House Green on the login surface (dark full-page)
    <div className="min-h-screen bg-sbucks-house flex flex-col overflow-hidden relative">
      {/* Background decorations — subtle glow blobs, no gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sbucks-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-sbucks-accent/6 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/[0.025]" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Brand mark */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sbucks-accent/25 border border-sbucks-accent/35 mb-4">
              <GraduationCap size={32} className="text-sbucks-light" />
            </div>
            <h1 className="text-white text-3xl font-extrabold" style={{ letterSpacing: '-0.016em' }}>
              Academic Risk
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.50)', letterSpacing: '-0.01em' }}>
              Plataforma Académica Inteligente
            </p>
          </div>

          {/* Form card — glassmorphism on the dark-green surface */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-card p-8 shadow-modal">
            <h2 className="text-white text-xl font-bold mb-1" style={{ letterSpacing: '-0.016em' }}>
              Iniciar sesión
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.50)', letterSpacing: '-0.01em' }}>
              Ingresa con tu código estudiantil o usuario docente
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-white/60 mb-2 uppercase"
                       style={{ letterSpacing: '0.1em' }}>
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError('') }}
                  placeholder="Ej: 2021100001 · carlos.mendoza"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30
                             focus:outline-none focus:border-sbucks-accent focus:ring-2 focus:ring-sbucks-accent/30 transition-all"
                  style={{ letterSpacing: '-0.01em' }}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-white/60 mb-2 uppercase"
                       style={{ letterSpacing: '0.1em' }}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="Contraseña"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/30
                               focus:outline-none focus:border-sbucks-accent focus:ring-2 focus:ring-sbucks-accent/30 transition-all"
                    style={{ letterSpacing: '-0.01em' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error — DESIGN.md semantic red (#c82014) */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(200,32,20,0.15)', border: '1px solid rgba(200,32,20,0.30)' }}
                  >
                    <AlertCircle size={14} style={{ color: '#f87171' }} className="flex-shrink-0" />
                    <span className="text-xs" style={{ color: '#fca5a5' }}>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit — DESIGN.md §4 Primary Filled: sbucks-accent, full-pill, scale(0.95) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-sbucks-accent hover:bg-sbucks-green
                           disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm
                           py-3.5 rounded-pill transition-all shadow-glow active:scale-95"
                style={{ letterSpacing: '-0.01em' }}
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Ingresar <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Demo hints */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <button
                onClick={() => setShowHints(v => !v)}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/60 text-xs transition-colors w-full"
              >
                <ChevronRight size={12} className={`transition-transform ${showHints ? 'rotate-90' : ''}`} />
                Credenciales de demostración
              </button>

              <AnimatePresence>
                {showHints && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2">
                      <div className="bg-white/6 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen size={12} className="text-sbucks-light" />
                          <span className="text-[0.7rem] font-bold text-white/50 uppercase" style={{ letterSpacing: '0.1em' }}>
                            Estudiantes
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {students.slice(0, 4).map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => { setUsername(s.studentCode); setPassword('demo') }}
                              className="text-left text-xs text-white/60 hover:text-white font-mono bg-white/5 hover:bg-white/10 rounded-lg px-2 py-1.5 transition-colors"
                            >
                              {s.studentCode}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white/6 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap size={12} className="text-sbucks-light" />
                          <span className="text-[0.7rem] font-bold text-white/50 uppercase" style={{ letterSpacing: '0.1em' }}>
                            Docentes
                          </span>
                        </div>
                        <div className="space-y-1">
                          {professors.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => { setUsername(p.username); setPassword('demo') }}
                              className="w-full text-left text-xs text-white/60 hover:text-white font-mono bg-white/5 hover:bg-white/10 rounded-lg px-2 py-1.5 transition-colors"
                            >
                              {p.username}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[0.68rem] text-white/30 text-center">
                        Contraseña para todos: <span className="font-mono font-bold text-white/50">demo</span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.30)', letterSpacing: '-0.01em' }}>
            Academic Risk · Plataforma multi-institucional · 2024-I
          </p>
        </motion.div>
      </div>
    </div>
  )
}
