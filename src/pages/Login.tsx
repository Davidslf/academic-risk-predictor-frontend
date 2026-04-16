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
    // small delay for UX
    await new Promise(r => setTimeout(r, 400))
    const result = login(username, password)
    if (!result.success) {
      setError(result.error ?? 'Credenciales inválidas.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-ar-gradient flex flex-col overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-ar-cyan/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-ar-cyan/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/3" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ar-cyan/20 border border-ar-cyan/30 mb-4">
              <GraduationCap size={32} className="text-ar-cyan" />
            </div>
            <h1 className="text-white text-3xl font-extrabold tracking-tight">Academic Risk</h1>
            <p className="text-white/50 text-sm mt-1">Plataforma Académica Inteligente</p>
          </div>

          {/* Form card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-modal">
            <h2 className="text-white text-xl font-bold mb-1">Iniciar sesión</h2>
            <p className="text-white/50 text-sm mb-6">Ingresa con tu código estudiantil o usuario docente</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError('') }}
                  placeholder="Ej: 2021100001 · carlos.mendoza"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-ar-cyan focus:ring-2 focus:ring-ar-cyan/30 transition-all"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="Contraseña"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/30 focus:outline-none focus:border-ar-cyan focus:ring-2 focus:ring-ar-cyan/30 transition-all"
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

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2.5"
                  >
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                    <span className="text-red-300 text-xs">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-full transition-all shadow-glow hover:shadow-lg"
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
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen size={12} className="text-ar-cyan" />
                          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-white/50">Estudiantes</span>
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
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap size={12} className="text-ar-cyan" />
                          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-white/50">Docentes</span>
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
                      <p className="text-[0.68rem] text-white/30 text-center">Contraseña para todos: <span className="font-mono font-bold text-white/50">demo</span></p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="text-center text-white/30 text-xs mt-6">
            Academic Risk · Plataforma multi-institucional · 2024-I
          </p>
        </motion.div>
      </div>
    </div>
  )
}
