import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  BarChart2, Lightbulb, Calculator, TrendingUp,
  CheckCircle, Clock, Layers, ArrowRight,
  BookOpen, Monitor, ClipboardList, Users, Zap, Brain
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Step } from 'react-joyride'
import Header from '../components/Header'
import TourGuide from '../components/TourGuide'
import { useTour } from '../hooks/useTour'
import { useAuth } from '../context/AuthContext'

gsap.registerPlugin(ScrollTrigger)

// ── Particle canvas ────────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: {
      x: number; y: number; vx: number; vy: number
      size: number; alpha: number; pulse: number
    }[] = []

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create particles
    for (let i = 0; i < 70; i++) {
      particles.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        vx:    (Math.random() - 0.5) * 0.35,
        vy:    (Math.random() - 0.5) * 0.35,
        size:  Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.5 + 0.15,
        pulse: Math.random() * Math.PI * 2,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0, 180, 216, ${0.12 * (1 - dist / 110)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        p.pulse += 0.02
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 180, 216, ${a})`
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-80 pointer-events-none"
      aria-hidden="true"
    />
  )
}

// ── Animated blob ─────────────────────────────────────────────────────────────
function Blob({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        scale:    [1, 1.18, 0.95, 1.12, 1],
        x:        [0, 30, -20, 15, 0],
        y:        [0, -20, 25, -10, 0],
        opacity:  [0.12, 0.22, 0.15, 0.2, 0.12],
      }}
      transition={{
        duration: 18,
        delay,
        repeat:   Infinity,
        ease:     'easeInOut',
      }}
    />
  )
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ value, suffix = '' }: { value: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {value}{suffix}
    </motion.span>
  )
}

// ── Tour steps ────────────────────────────────────────────────────────────────
const TOUR_STEPS: Step[] = [
  {
    target:    '#tour-nav',
    title:     '🧭 Tu menú de navegación',
    content:   'Tienes tres secciones: "Inicio" (esta página), "Mis Notas" para ver tus calificaciones por materia, y "Predicción" para analizar tu riesgo académico con IA.',
    placement: 'bottom',
  },
  {
    target:    '#tour-variables',
    title:     '📊 ¿Qué analiza el predictor?',
    content:   'El modelo procesa 5 variables: asistencia a clases, seguimiento académico, nota del primer parcial, uso de la plataforma digital y asistencia a tutorías.',
    placement: 'top',
  },
  {
    target:    '#tour-hero-cta',
    title:     '🚀 ¡Inicia tu análisis!',
    content:   'Al hacer clic, el modelo de IA evalúa tus 5 variables en menos de 1 segundo y genera un reporte personalizado. También tendrás un chat con IA disponible en esa página para resolver cualquier duda.',
    placement: 'top',
  },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { run, onTourEnd } = useTour('student-landing')
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef      = useRef<HTMLElement>(null)

  const firstName = (() => {
    const n = user?.name ?? ''
    if (!n) return 'Estudiante'
    // Defensive: if name is actually an email (full_name missing in old JWT),
    // extract the first segment before the @ and before any dot
    if (n.includes('@')) {
      const local = n.split('@')[0]           // "david.lujan"
      const part  = local.split('.')[0]       // "david"
      return part.charAt(0).toUpperCase() + part.slice(1) // "David"
    }
    return n.split(' ')[0]
  })()

  // Parallax for hero blobs
  const { scrollY } = useScroll()
  const blobY = useTransform(scrollY, [0, 400], [0, -60])

  // ── GSAP scroll reveals ──────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-anim="feature-card"]', {
        y: 60, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '[data-anim="feature-card"]', start: 'top 85%', toggleActions: 'play none none none' },
      })
      gsap.from('[data-anim="process-step"]', {
        y: 50, opacity: 0, duration: 0.7, stagger: 0.18, ease: 'power3.out',
        scrollTrigger: { trigger: '[data-anim="process-step"]', start: 'top 85%', toggleActions: 'play none none none' },
      })
      gsap.from('[data-anim="var-card"]', {
        y: 35, opacity: 0, duration: 0.55, stagger: 0.07, ease: 'power2.out',
        scrollTrigger: { trigger: '[data-anim="var-card"]', start: 'top 85%', toggleActions: 'play none none none' },
      })
      gsap.from('[data-anim="stat-card"]', {
        scale: 0.85, opacity: 0, duration: 0.6, stagger: 0.09, ease: 'back.out(1.4)',
        scrollTrigger: { trigger: '[data-anim="stat-card"]', start: 'top 88%', toggleActions: 'play none none none' },
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-usb-canvas flex flex-col">
      <TourGuide run={run} steps={TOUR_STEPS} onEnd={onTourEnd} />
      <Header />

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative bg-ar-gradient overflow-hidden">
        {/* Particle network */}
        <ParticleCanvas />

        {/* Animated blobs */}
        <motion.div style={{ y: blobY }} className="absolute inset-0 pointer-events-none">
          <Blob
            className="absolute top-[-10%] right-[-8%] w-[520px] h-[520px] rounded-full bg-ar-cyan blur-[90px]"
            delay={0}
          />
          <Blob
            className="absolute bottom-[-15%] left-[-10%] w-[420px] h-[420px] rounded-full bg-violet-500 blur-[100px]"
            delay={4}
          />
          <Blob
            className="absolute top-[30%] left-[35%] w-[300px] h-[300px] rounded-full bg-ar-cyan blur-[80px]"
            delay={8}
          />
        </motion.div>

        {/* Subtle grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative max-w-5xl mx-auto px-5 py-24 md:py-32 flex flex-col md:flex-row items-center gap-14">
          {/* ── Left content ── */}
          <div className="flex-1 text-center md:text-left">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 flex items-center gap-3 justify-center md:justify-start"
            >
              <img
                src="/assets/ar-logo.png"
                alt="Academic Risk Logo"
                className="h-10 w-auto drop-shadow-[0_0_12px_rgba(0,180,216,0.5)]"
              />
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <span className="inline-flex items-center gap-2 bg-ar-cyan/20 border border-ar-cyan/40 text-ar-cyan text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                <Zap size={11} />
                Predictor Académico IA
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-4xl md:text-[3.4rem] font-black text-white leading-[1.08] tracking-tight mb-4"
            >
              Bienvenido a{' '}
              <span className="text-ar-cyan">Academic Risk</span>
              {firstName && (
                <span className="text-white">{' '}{firstName}</span>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
              className="text-white/60 text-lg mb-8 max-w-lg leading-relaxed"
            >
              Analiza tus 5 variables académicas y descubre tu probabilidad de éxito
              con inteligencia artificial. Recibe consejos personalizados al instante.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.24 }}
              className="flex flex-wrap gap-3 justify-center md:justify-start"
            >
              <motion.button
                id="tour-hero-cta"
                onClick={() => navigate('/prediccion')}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center gap-2 bg-ar-cyan text-white font-bold px-9 py-4 rounded-full text-base shadow-glow"
              >
                Comenzar predicción
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                onClick={() => navigate('/notas')}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-7 py-4 rounded-full text-base backdrop-blur-sm hover:bg-white/15 transition-colors"
              >
                Ver mis notas
              </motion.button>
            </motion.div>
          </div>

          {/* ── Right: floating stat cards ── */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-3 w-full max-w-xs">
            {[
              { label: 'Precisión del modelo', value: '90%',   color: 'text-ar-cyan',    bg: 'from-ar-cyan/20 to-ar-cyan/5',     icon: Brain    },
              { label: 'Tiempo de análisis',   value: '<1 min', color: 'text-emerald-400', bg: 'from-emerald-400/20 to-emerald-400/5', icon: Clock },
              { label: 'Variables analizadas', value: '5',     color: 'text-amber-400',  bg: 'from-amber-400/20 to-amber-400/5', icon: Layers   },
              { label: 'Consejero IA',         value: '24/7',  color: 'text-violet-400', bg: 'from-violet-400/20 to-violet-400/5', icon: Zap    },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.4, type: 'spring', stiffness: 320 }}
                whileHover={{ scale: 1.06, y: -4 }}
                className={`bg-gradient-to-br ${s.bg} backdrop-blur border border-white/15 rounded-2xl p-4 text-center cursor-default`}
              >
                <s.icon size={18} className={`mx-auto mb-2 ${s.color}`} />
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-white/50 text-[0.68rem] mt-0.5 leading-tight">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,24 C360,48 1080,0 1440,24 L1440,48 L0,48 Z" fill="#F8FAFC" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAND ─────────────────────────────────────────────────────── */}
      <section className="py-12 bg-usb-canvas">
        <div className="max-w-4xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '99K+',   label: 'Registros de entrenamiento', color: 'text-ar-cyan'    },
              { value: '90%',    label: 'Precisión del modelo',       color: 'text-emerald-500' },
              { value: '5',      label: 'Variables analizadas',       color: 'text-amber-500'   },
              { value: '< 1 s',  label: 'Tiempo de predicción',       color: 'text-violet-500'  },
            ].map(s => (
              <div key={s.label} data-anim="stat-card"
                className="text-center bg-white rounded-2xl border border-usb-border p-5 shadow-sm hover:shadow-card-hover transition-shadow"
              >
                <p className={`text-3xl font-black ${s.color} mb-1`}>
                  <Counter value={s.value} />
                </p>
                <p className="text-usb-muted text-xs leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="tour-features" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="text-ar-cyan text-xs font-bold uppercase tracking-widest">¿Qué obtienes?</span>
            <h2 className="text-3xl md:text-4xl font-black text-usb-text mt-2 tracking-tight">
              Todo lo que necesitas para mejorar
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: BarChart2, title: 'Probabilidad de Riesgo',
                desc: 'Velocímetro visual con tu % de riesgo calculado con regresión logística.',
                color: 'bg-ar-cyan/10 text-ar-cyan', glow: 'hover:shadow-[0_8px_30px_rgba(0,180,216,0.2)]',
              },
              {
                icon: TrendingUp, title: 'Gráficas Detalladas',
                desc: 'Compara tus métricas vs el promedio de estudiantes que aprobaron.',
                color: 'bg-emerald-50 text-emerald-600', glow: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
              },
              {
                icon: Lightbulb, title: 'Consejos IA',
                desc: 'Análisis personalizado generado con IA basado en tu perfil académico.',
                color: 'bg-amber-50 text-amber-600', glow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
              },
              {
                icon: Calculator, title: 'Detalles Matemáticos',
                desc: 'Explora la ecuación logit y probabilidad exacta de tu predicción.',
                color: 'bg-violet-50 text-violet-600', glow: 'hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)]',
              },
            ].map((f) => (
              <div key={f.title} data-anim="feature-card">
                <motion.div
                  whileHover={{ y: -7 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className={`bg-usb-canvas rounded-2xl p-6 border border-usb-border transition-shadow h-full cursor-default ${f.glow}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                    <f.icon size={22} />
                  </div>
                  <h3 className="font-bold text-usb-text mb-1.5">{f.title}</h3>
                  <p className="text-usb-muted text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-usb-canvas">
        <div className="max-w-4xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="text-ar-cyan text-xs font-bold uppercase tracking-widest">Proceso</span>
            <h2 className="text-3xl md:text-4xl font-black text-usb-text mt-2 tracking-tight">Tres pasos simples</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: ClipboardList, title: 'Ingresa tus datos',  desc: 'Asistencia, seguimiento, notas y uso de plataforma.', color: 'bg-ar-cyan'     },
              { step: '02', icon: Brain,          title: 'Análisis IA',        desc: 'El modelo procesa tus 5 variables en menos de 1 segundo.', color: 'bg-violet-500' },
              { step: '03', icon: Lightbulb,      title: 'Recibe tu reporte', desc: 'Gráficas, nivel de riesgo y consejos personalizados.', color: 'bg-emerald-500' },
            ].map((p, i) => (
              <div key={p.step} data-anim="process-step" className="relative text-center">
                {i < 2 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.2 }}
                    className="hidden md:block absolute top-6 left-[calc(100%-20px)] w-10 h-px bg-gradient-to-r from-ar-cyan/40 to-transparent origin-left z-10"
                  />
                )}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${p.color} text-white font-extrabold text-sm mb-4 shadow-lg`}>
                  {p.step}
                </div>
                <div className="w-10 h-10 rounded-xl bg-ar-navy/5 flex items-center justify-center mx-auto mb-3 border border-usb-border">
                  <p.icon size={20} className="text-ar-navy" />
                </div>
                <h3 className="font-bold text-usb-text mb-1">{p.title}</h3>
                <p className="text-usb-muted text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VARIABLES ──────────────────────────────────────────────────────── */}
      <section id="tour-variables" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="text-ar-cyan text-xs font-bold uppercase tracking-widest">Variables del modelo</span>
            <h2 className="text-3xl md:text-4xl font-black text-usb-text mt-2 tracking-tight">¿Qué analiza el predictor?</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Users,         label: 'Asistencia a Clases',     desc: 'Porcentaje de clases a las que asistes',   color: 'text-ar-cyan',     bg: 'bg-ar-cyan/8'     },
              { icon: ClipboardList, label: 'Nivel de Seguimiento',    desc: 'Calificación promedio en seguimientos',     color: 'text-emerald-500', bg: 'bg-emerald-50'    },
              { icon: BookOpen,      label: 'Nota del Primer Parcial', desc: 'Tu calificación en el primer examen',       color: 'text-amber-500',   bg: 'bg-amber-50'      },
              { icon: Monitor,       label: 'Uso de Plataforma',       desc: 'Inicios de sesión en el sistema LMS',       color: 'text-violet-500',  bg: 'bg-violet-50'     },
              { icon: CheckCircle,   label: 'Asistencia a Tutorías',   desc: '¿Usas el servicio de tutorías?',            color: 'text-rose-500',    bg: 'bg-rose-50'       },
              { icon: Layers,        label: 'Modelo de Regresión',     desc: 'Logistic Regression · 99k registros',       color: 'text-usb-muted',   bg: 'bg-usb-canvas'    },
            ].map((v) => (
              <div key={v.label} data-anim="var-card">
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex items-start gap-3 p-4 bg-usb-canvas rounded-xl border border-usb-border hover:border-ar-cyan/30 hover:shadow-sm transition-all cursor-default"
                >
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg ${v.bg} flex items-center justify-center`}>
                    <v.icon size={16} className={v.color} />
                  </div>
                  <div>
                    <p className="font-semibold text-usb-text text-sm">{v.label}</p>
                    <p className="text-usb-muted text-xs mt-0.5">{v.desc}</p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────────── */}
      <section id="tour-cta-banner" className="py-20 bg-ar-gradient relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <Blob className="absolute top-[-20%] right-[-5%] w-80 h-80 rounded-full bg-ar-cyan blur-[70px]" delay={2} />
          <Blob className="absolute bottom-[-20%] left-[-5%] w-64 h-64 rounded-full bg-violet-500 blur-[70px]" delay={6} />
        </div>
        <ParticleCanvas />

        <div className="relative max-w-2xl mx-auto px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ar-cyan/20 border border-ar-cyan/30 mb-5">
              <Clock size={28} className="text-ar-cyan" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
              Menos de <span className="text-ar-cyan">1 minuto</span>
            </h2>
            <p className="text-white/60 mb-8 text-lg">
              Conoce tu nivel de riesgo académico ahora mismo y actúa a tiempo.
            </p>
            <motion.button
              onClick={() => navigate('/prediccion')}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="inline-flex items-center gap-2 bg-ar-cyan text-white font-bold px-10 py-4 rounded-full text-base shadow-glow"
            >
              Ir al predictor
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-ar-navy border-t border-white/10 py-8">
        <div className="max-w-5xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/ar-logo.png"
              alt="Academic Risk"
              className="h-7 w-auto opacity-80"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-white font-bold text-sm">Academic Risk</span>
          </div>
          <p className="text-white/30 text-xs">Plataforma académica · Período 2024-I</p>
          <p className="text-white/20 text-xs">Powered by Logistic Regression AI</p>
        </div>
      </footer>
    </div>
  )
}
