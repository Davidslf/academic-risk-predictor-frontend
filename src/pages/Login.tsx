import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, ArrowRight, AlertCircle,
  GraduationCap, BookOpen, BarChart2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { friendlyError } from '../services/errorMessages'

// ─── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(texts: string[], speed = 55, pause = 2200) {
  const [displayed, setDisplayed] = useState('')
  const [textIdx, setTextIdx]     = useState(0)
  const [charIdx, setCharIdx]     = useState(0)
  const [deleting, setDeleting]   = useState(false)

  useEffect(() => {
    const current = texts[textIdx]
    const delay   = deleting ? speed / 2 : speed
    const timer = setTimeout(() => {
      if (!deleting) {
        setDisplayed(current.slice(0, charIdx + 1))
        if (charIdx + 1 === current.length) setTimeout(() => setDeleting(true), pause)
        else setCharIdx(c => c + 1)
      } else {
        setDisplayed(current.slice(0, charIdx - 1))
        if (charIdx - 1 === 0) {
          setDeleting(false)
          setCharIdx(() => 0)
          setTextIdx(i => (i + 1) % texts.length)
        } else {
          setCharIdx(c => c - 1)
        }
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [charIdx, deleting, textIdx, texts, speed, pause])

  return displayed
}

// ─── Welcome voice ────────────────────────────────────────────────────────────
function playWelcomeVoice(name: string) {
  try {
    if (!('speechSynthesis' in window)) return
    const synth = window.speechSynthesis

    const doSpeak = () => {
      const voices = synth.getVoices()
      const preferred = ['es-MX', 'es-CO', 'es-AR', 'es-CL', 'es-US', 'es-419']
      const voice =
        voices.find(v => preferred.includes(v.lang)) ||
        voices.find(v => v.lang.startsWith('es-') && v.lang !== 'es-ES') ||
        voices.find(v => v.lang.startsWith('es'))

      const utter = new SpeechSynthesisUtterance(
        `Bienvenido a Academic Risk, tu predictor de riesgo académico. Hola, ${name}.`
      )
      utter.lang   = voice?.lang ?? 'es-MX'
      utter.rate   = 0.82
      utter.pitch  = 1.0
      utter.volume = 1
      if (voice) utter.voice = voice
      synth.cancel()
      synth.speak(utter)
    }

    const voices = synth.getVoices()
    if (voices.length > 0) doSpeak()
    else synth.onvoiceschanged = () => { synth.onvoiceschanged = null; doSpeak() }
  } catch { /* browser doesn't support speech */ }
}

// ─── Teleport overlay ─────────────────────────────────────────────────────────
function TeleportOverlay({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #0d1f3c 0%, #04091a 100%)' }}
    >
      {/* Expanding rings */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0.7 - i * 0.05 }}
          animate={{ scale: 5 + i * 1.8, opacity: 0 }}
          transition={{ duration: 1.6, delay: i * 0.08, ease: 'easeOut' }}
          className="absolute w-20 h-20 rounded-full border border-ar-cyan/40"
        />
      ))}

      {/* Vertical light beam */}
      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: [0, 1, 1, 0], opacity: [0, 0.7, 0.7, 0] }}
        transition={{ duration: 1.8, times: [0, 0.25, 0.7, 1] }}
        style={{ transformOrigin: 'center' }}
        className="absolute inset-x-1/2 -translate-x-px w-[2px] h-full bg-gradient-to-b from-transparent via-ar-cyan to-transparent"
      />
      {/* Horizontal light beam */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 0.35, 0.35, 0] }}
        transition={{ duration: 1.8, times: [0, 0.3, 0.7, 1], delay: 0.1 }}
        style={{ transformOrigin: 'center' }}
        className="absolute inset-y-1/2 -translate-y-px h-[2px] w-full bg-gradient-to-r from-transparent via-ar-cyan to-transparent"
      />

      {/* Sparks at intersection */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 15)],
            y: [0, (i < 3 ? -1 : 1) * (15 + i * 10)],
          }}
          transition={{ duration: 0.7, delay: 0.3 + i * 0.04, ease: 'easeOut' }}
          className="absolute w-1.5 h-1.5 rounded-full bg-ar-cyan"
        />
      ))}

      {/* Center logo + welcome text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7, ease: 'easeOut' as const }}
        className="relative z-10 flex flex-col items-center gap-5"
      >
        {/* Logo with glow */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute w-32 h-32 rounded-full bg-ar-cyan/25 blur-2xl"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.img
            src="/assets/ar-icon.png"
            alt="Academic Risk"
            className="relative z-10 w-24 h-24 object-contain"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-ar-cyan text-xs font-bold uppercase tracking-[0.35em]"
          >
            Academic Risk
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58 }}
            className="text-white text-3xl font-extrabold font-display leading-tight"
          >
            ¡Bienvenido/a!
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.70 }}
            className="text-white/70 text-xl font-semibold"
          >
            {name}
          </motion.p>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '220px' }}
          transition={{ delay: 0.9, duration: 0.6, ease: 'easeOut' }}
          className="h-px bg-gradient-to-r from-transparent via-ar-cyan to-transparent"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-ar-cyan/70 text-xs font-semibold uppercase tracking-[0.25em]"
        >
          Ingresando al sistema…
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

// ─── Canvas particle network (left panel background) ─────────────────────────
function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Resize canvas to match DOM size in pixels
    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    interface Particle { x: number; y: number; vx: number; vy: number; r: number }

    const COUNT   = 60
    const MAX_D   = 120

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r:  Math.random() * 1.6 + 0.5,
    }))

    let animId: number

    const tick = () => {
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,180,216,0.75)'
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x
          const dy   = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_D) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0,180,216,${(1 - dist / MAX_D) * 0.38})`
            ctx.lineWidth   = 0.7
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(tick)
    }

    tick()

    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  )
}

// ─── Animated background (left panel) ────────────────────────────────────────
function AnimatedBackground() {
  return (
    <>
      {/* Canvas particle network */}
      <ParticleNetwork />

      {/* Subtle dot-grid overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Scanning beam — thin horizontal line that sweeps down */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-ar-cyan/50 to-transparent pointer-events-none"
        animate={{ y: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear', times: [0, 0.05, 0.9, 1] }}
      />
    </>
  )
}

// ─── Login page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [teleporting, setTeleporting] = useState(false)
  const [userName, setUserName]       = useState('')

  const typewritten = useTypewriter([
    'Predice tu riesgo académico',
    'Visualiza tu rendimiento',
    'Obtén consejos personalizados',
    'Toma el control de tu futuro',
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setLoading(true)
    setError('')

    const result = await login(email.trim(), password)

    if (!result.success) {
      setError(result.error ?? 'No se pudo iniciar sesión.')
      setLoading(false)
      return
    }

    // On success — get name from context (it was just set), show welcome overlay
    const storedUser = localStorage.getItem('ar-user')
    const name = storedUser ? (JSON.parse(storedUser) as { name: string }).name : email
    const firstName = name.split(' ')[0]

    setUserName(firstName)
    setLoading(false)
    setTeleporting(true)
    playWelcomeVoice(firstName)
    // Navigation happens automatically via Router redirect once user is set
  }

  return (
    <>
      <AnimatePresence>{teleporting && <TeleportOverlay name={userName} />}</AnimatePresence>

      <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">

        {/* ── Left brand panel ───────────────────────────────────────────── */}
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' as const }}
          className="hidden lg:flex lg:w-[55%] xl:w-1/2 bg-ar-gradient relative overflow-hidden flex-col justify-between p-12"
        >
          <AnimatedBackground />

          {/* Top — logo */}
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="relative z-10 flex items-center gap-4"
          >
            {/* Logo with glow ring */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-xl bg-ar-cyan/30 blur-lg"
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.3, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.img
                src="/assets/ar-icon.png"
                alt="Academic Risk"
                className="relative z-10 h-14 w-auto"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
              />
            </div>
            <div>
              <img src="/assets/ar-logo.png" alt="Academic Risk" className="h-9 w-auto" />
              <p className="text-white/40 text-[0.68rem] mt-0.5 font-medium">Plataforma académica inteligente</p>
            </div>
          </motion.div>

          {/* Middle — hero content */}
          <div className="relative z-10 space-y-8">
            {/* Big typewriter headline */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <h1 className="font-sans text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight mb-4 min-h-[3.6em]">
                {typewritten}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.55 }}
                  className="inline-block w-[3px] h-12 bg-ar-cyan ml-1.5 align-middle rounded-sm"
                />
              </h1>
              <p className="text-white/50 text-lg leading-relaxed max-w-md">
                Tu predictor de riesgo académico impulsado por inteligencia artificial.
                Analiza, anticipa y mejora tu rendimiento.
              </p>
            </motion.div>

            {/* Feature pills — each floats independently */}
            <div className="flex flex-wrap gap-2.5">
              {[
                { label: 'Predicción IA',       icon: BarChart2,     delay: 0.7 },
                { label: 'Portal de notas',      icon: BookOpen,      delay: 0.85 },
                { label: 'Consejero virtual',    icon: GraduationCap, delay: 1.0  },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 16, scale: 0.85 }}
                  animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
                  transition={{
                    opacity: { delay: f.delay, duration: 0.45 },
                    scale:   { delay: f.delay, duration: 0.45 },
                    y: { delay: f.delay + 0.5, duration: 2.8 + i * 0.4, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  className="flex items-center gap-2 bg-white/10 border border-white/15 text-white/75 text-sm font-semibold px-4 py-2 rounded-full backdrop-blur-sm"
                >
                  <f.icon size={14} className="text-ar-cyan" />
                  {f.label}
                </motion.div>
              ))}
            </div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="flex items-center gap-5 pt-2"
            >
              {[
                { value: '90%',    label: 'Precisión' },
                { value: '<1 min', label: 'Análisis' },
                { value: '5',      label: 'Variables' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-ar-cyan text-2xl font-extrabold leading-tight">{s.value}</p>
                  <p className="text-white/40 text-[0.65rem] uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
              <div className="h-8 w-px bg-white/10 mx-1" />
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
                <span className="text-emerald-400 text-xs font-bold">Sistema activo</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-white/20 text-xs relative z-10"
          >
            © 2024 Academic Risk · Todos los derechos reservados
          </motion.p>
        </motion.div>

        {/* ── Right form panel ───────────────────────────────────────────── */}
        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' as const }}
          className="flex-1 flex flex-col bg-white"
        >
          {/* Mobile-only hero header */}
          <div className="lg:hidden bg-ar-gradient px-6 py-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-ar-cyan/10 blur-2xl -translate-y-1/2 translate-x-1/2" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 flex flex-col items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-ar-cyan/20 blur-lg scale-150" />
                <motion.img
                  src="/assets/ar-icon.png"
                  alt="AR"
                  className="relative z-10 h-14 w-auto"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
                />
              </div>
              <div>
                <p className="text-white font-black text-xl tracking-tight">Academic Risk</p>
                <p className="text-white/50 text-sm mt-0.5">Tu predictor de riesgo académico</p>
              </div>
            </motion.div>
          </div>

          {/* Form area */}
          <div className="flex-1 flex items-center justify-center px-6 py-10 sm:py-14">
            <div className="w-full max-w-sm">

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-8"
              >
                <h1 className="font-sans text-3xl font-black text-usb-text tracking-tight mb-1.5">Iniciar sesión</h1>
                <p className="text-usb-muted text-sm">Ingresa con tus credenciales para continuar</p>
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-2">
                    Correo electrónico
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="correo@ejemplo.edu"
                    className="w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 text-sm text-usb-text placeholder-usb-faint focus:outline-none focus:border-ar-cyan focus:ring-2 focus:ring-ar-cyan/20 transition-all"
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      placeholder="Contraseña"
                      className="w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 pr-11 text-sm text-usb-text placeholder-usb-faint focus:outline-none focus:border-ar-cyan focus:ring-2 focus:ring-ar-cyan/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint hover:text-usb-muted transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"
                    >
                      <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                      <span className="text-red-600 text-xs">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="relative w-full flex items-center justify-center gap-2 bg-ar-navy hover:bg-ar-navy-dark disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-full transition-all shadow-md hover:shadow-xl overflow-hidden group"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                  />
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <> Ingresar <ArrowRight size={16} /> </>
                  )}
                </motion.button>
              </motion.form>

              {/* Footer note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-center text-xs text-usb-faint border-t border-usb-border pt-5"
              >
                Usa las credenciales asignadas por tu institución.
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
