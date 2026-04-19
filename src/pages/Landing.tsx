import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart2, Lightbulb, Calculator, TrendingUp,
  CheckCircle, Clock, Layers, ArrowRight,
  BookOpen, Monitor, ClipboardList, Users
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Step } from 'react-joyride'
import Header from '../components/Header'
import TourGuide from '../components/TourGuide'
import { useTour } from '../hooks/useTour'
import { useAuth } from '../context/AuthContext'

gsap.registerPlugin(ScrollTrigger)

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

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: 'easeOut' as const },
})

export default function Landing() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { run, onTourEnd } = useTour('student-landing')
  const containerRef = useRef<HTMLDivElement>(null)

  const firstName = user?.name.split(' ')[0] ?? ''

  // ── GSAP ScrollTrigger stagger reveals ────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {

      // Feature cards — stagger up
      gsap.from('[data-anim="feature-card"]', {
        y:       55,
        opacity: 0,
        duration: 0.75,
        stagger:  0.1,
        ease:    'power3.out',
        scrollTrigger: {
          trigger:      '[data-anim="feature-card"]',
          start:        'top 84%',
          toggleActions: 'play none none none',
        },
      })

      // Process steps — cascade in
      gsap.from('[data-anim="process-step"]', {
        y:       45,
        opacity: 0,
        duration: 0.7,
        stagger:  0.18,
        ease:    'power3.out',
        scrollTrigger: {
          trigger:      '[data-anim="process-step"]',
          start:        'top 84%',
          toggleActions: 'play none none none',
        },
      })

      // Variable cards — tight stagger
      gsap.from('[data-anim="var-card"]', {
        y:       30,
        opacity: 0,
        duration: 0.55,
        stagger:  0.07,
        ease:    'power2.out',
        scrollTrigger: {
          trigger:      '[data-anim="var-card"]',
          start:        'top 84%',
          toggleActions: 'play none none none',
        },
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-usb-canvas flex flex-col">
      <TourGuide run={run} steps={TOUR_STEPS} onEnd={onTourEnd} />
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-ar-gradient overflow-hidden">
        {/* decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-ar-cyan/10 blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-ar-cyan/5 blur-3xl translate-y-1/2 -translate-x-1/4" />
          {/* grid */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-5 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
          {/* Left */}
          <div className="flex-1 text-center md:text-left">
            <motion.div {...fadeUp(0)}>
              <span className="inline-flex items-center gap-2 bg-ar-cyan/20 border border-ar-cyan/30 text-ar-cyan text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-5">
                <BarChart2 size={12} />
                Predictor Académico IA
              </span>
            </motion.div>
            <motion.h1 {...fadeUp(0.08)} className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight mb-4">
              Bienvenido a<br />
              <span className="text-ar-cyan">Akademik Risk</span>
            </motion.h1>
            <motion.p {...fadeUp(0.15)} className="text-white/60 text-lg mb-8 max-w-lg">
              Analiza tus 5 variables académicas y descubre tu probabilidad de éxito
              con inteligencia artificial. Recibe consejos personalizados al instante.
            </motion.p>
            <motion.div {...fadeUp(0.22)} className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                id="tour-hero-cta"
                onClick={() => navigate('/prediccion')}
                className="flex items-center gap-2 bg-ar-cyan hover:bg-ar-cyan-dark text-white font-bold px-8 py-4 rounded-full text-base transition-all shadow-glow hover:shadow-lg hover:-translate-y-0.5"
              >
                Comenzar predicción
                <ArrowRight size={18} />
              </button>
            </motion.div>
          </div>

          {/* Right: floating stats */}
          <motion.div
            {...fadeUp(0.2)}
            className="flex-shrink-0 grid grid-cols-2 gap-3 w-full max-w-xs"
          >
            {[
              { label: 'Precisión del modelo', value: '90%', color: 'text-ar-cyan' },
              { label: 'Tiempo de análisis', value: '<1 min', color: 'text-emerald-400' },
              { label: 'Variables analizadas', value: '5', color: 'text-amber-400' },
              { label: 'Consejero IA', value: '24/7', color: 'text-violet-400' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4 text-center"
              >
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-white/50 text-[0.68rem] mt-0.5 leading-tight">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="tour-features" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="text-ar-cyan text-xs font-bold uppercase tracking-wider">¿Qué obtienes?</span>
            <h2 className="text-3xl md:text-4xl font-black text-usb-text mt-2 tracking-tight">Todo lo que necesitas para mejorar</h2>
          </motion.div>

          {/* GSAP controls opacity/y — motion.div only for hover lift */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: BarChart2,
                title: 'Probabilidad de Riesgo',
                desc: 'Velocímetro visual con tu % de riesgo académico calculado con regresión logística.',
                color: 'bg-ar-cyan/10 text-ar-cyan',
              },
              {
                icon: TrendingUp,
                title: 'Gráficas Detalladas',
                desc: 'Compara tus métricas vs el promedio de estudiantes que aprobaron.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: Lightbulb,
                title: 'Consejos IA',
                desc: 'Análisis personalizado generado con IA basado en tu perfil académico.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: Calculator,
                title: 'Detalles Matemáticos',
                desc: 'Explora la ecuación logit y probabilidad exacta de tu predicción.',
                color: 'bg-violet-50 text-violet-600',
              },
            ].map((f) => (
              /* Outer div — GSAP scroll target */
              <div key={f.title} data-anim="feature-card">
                {/* Inner motion.div — Framer hover lift */}
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="bg-usb-canvas rounded-2xl p-6 border border-usb-border hover:shadow-card-hover transition-shadow h-full cursor-default"
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

      {/* ── Process ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-usb-canvas">
        <div className="max-w-4xl mx-auto px-5">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="text-ar-cyan text-xs font-bold uppercase tracking-wider">Proceso</span>
            <h2 className="text-3xl md:text-4xl font-black text-usb-text mt-2 tracking-tight">Tres pasos simples</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: ClipboardList, title: 'Ingresa tus datos', desc: 'Asistencia, seguimiento, notas y uso de plataforma.' },
              { step: '02', icon: BarChart2,    title: 'Análisis IA',        desc: 'El modelo procesa tus 5 variables en menos de 1 segundo.' },
              { step: '03', icon: Lightbulb,    title: 'Recibe tu reporte',  desc: 'Gráficas, nivel de riesgo y consejos personalizados.' },
            ].map((p, i) => (
              /* GSAP scroll target — no Framer whileInView */
              <div key={p.step} data-anim="process-step" className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-[calc(100%-16px)] w-8 border-t-2 border-dashed border-usb-border z-10" />
                )}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ar-cyan text-white font-extrabold text-sm mb-4 shadow-glow">
                  {p.step}
                </div>
                <div className="w-10 h-10 rounded-xl bg-ar-navy/10 flex items-center justify-center mx-auto mb-3">
                  <p.icon size={20} className="text-ar-navy" />
                </div>
                <h3 className="font-bold text-usb-text mb-1">{p.title}</h3>
                <p className="text-usb-muted text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Variables ────────────────────────────────────────────────────── */}
      <section id="tour-variables" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-5">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="text-ar-cyan text-xs font-bold uppercase tracking-wider">Variables del modelo</span>
            <h2 className="text-3xl md:text-4xl font-black text-usb-text mt-2 tracking-tight">¿Qué analiza el predictor?</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Users,        label: 'Asistencia a Clases',     desc: 'Porcentaje de clases a las que asistes', color: 'text-ar-cyan'     },
              { icon: ClipboardList, label: 'Nivel de Seguimiento',   desc: 'Calificación promedio en seguimientos',  color: 'text-emerald-500' },
              { icon: BookOpen,     label: 'Nota del Primer Parcial', desc: 'Tu calificación en el primer examen',    color: 'text-amber-500'   },
              { icon: Monitor,      label: 'Uso de Plataforma',       desc: 'Inicios de sesión en el sistema LMS',    color: 'text-violet-500'  },
              { icon: CheckCircle,  label: 'Asistencia a Tutorías',   desc: '¿Usas el servicio de tutorías?',         color: 'text-rose-500'    },
              { icon: Layers,       label: 'Modelo de Regresión',     desc: 'Logistic Regression · 99k registros',    color: 'text-usb-muted'   },
            ].map((v) => (
              /* GSAP scroll target */
              <div
                key={v.label}
                data-anim="var-card"
                className="flex items-start gap-3 p-4 bg-usb-canvas rounded-xl border border-usb-border"
              >
                <div className={`mt-0.5 flex-shrink-0 ${v.color}`}>
                  <v.icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-usb-text text-sm">{v.label}</p>
                  <p className="text-usb-muted text-xs mt-0.5">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section id="tour-cta-banner" className="py-16 bg-ar-gradient">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <motion.div {...fadeUp()}>
            <Clock size={32} className="text-ar-cyan mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">Menos de 1 minuto</h2>
            <p className="text-white/60 mb-6">Conoce tu nivel de riesgo académico ahora mismo y actúa a tiempo.</p>
            <button
              onClick={() => navigate('/prediccion')}
              className="inline-flex items-center gap-2 bg-ar-cyan hover:bg-ar-cyan-dark text-white font-bold px-8 py-4 rounded-full text-base transition-all shadow-glow hover:shadow-lg"
            >
              Ir al predictor
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-ar-navy border-t border-white/10 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart2 size={16} className="text-ar-cyan" />
          <span className="text-white font-bold text-sm">Academic Risk</span>
        </div>
        <p className="text-white/30 text-xs">Plataforma académica · Período 2024-I</p>
      </footer>
    </div>
  )
}
