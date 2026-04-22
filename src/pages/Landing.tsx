import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart2, Lightbulb, Calculator, TrendingUp,
  CheckCircle, Clock, Layers, ArrowRight,
  BookOpen, Monitor, ClipboardList, Users
} from 'lucide-react'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: 'easeOut' as const },
})

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    // DESIGN.md §5 — page canvas is pg-warm, never pure white
    <div className="min-h-screen bg-pg-warm flex flex-col">
      <Header />

      {/* ── Hero ─── DESIGN.md: dark House Green feature band ──────────────── */}
      <section className="relative bg-sbucks-house overflow-hidden">
        {/* Subtle decorative glow — no gradients per DESIGN.md */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full bg-sbucks-accent/8 blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-sbucks-accent/5 blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
          {/* Left */}
          <div className="flex-1 text-center md:text-left">
            <motion.div {...fadeUp(0)}>
              {/* Section label — uppercase tracking, sbucks-accent */}
              <span className="inline-flex items-center gap-2 bg-sbucks-accent/20 border border-sbucks-accent/30 text-sbucks-light text-xs font-bold uppercase px-3 py-1.5 rounded-pill mb-5"
                    style={{ letterSpacing: '0.1em' }}>
                <BarChart2 size={12} />
                Predictor Académico IA
              </span>
            </motion.div>

            {/* H1 — display size, -0.016em tracking, white on dark */}
            <motion.h1
              {...fadeUp(0.08)}
              className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4"
              style={{ letterSpacing: '-0.016em' }}
            >
              Hola, {firstName}.<br />
              <span className="text-sbucks-light">Predice tu éxito</span><br />
              académico
            </motion.h1>

            {/* Body copy — white soft on dark */}
            <motion.p
              {...fadeUp(0.15)}
              className="text-lg mb-8 max-w-lg"
              style={{ color: 'rgba(255,255,255,0.70)', letterSpacing: '-0.01em' }}
            >
              Analiza tus 5 variables académicas y descubre tu probabilidad de éxito
              con inteligencia artificial. Recibe consejos personalizados al instante.
            </motion.p>

            {/* CTAs — DESIGN.md §4: white-filled (inverted) + outlined on dark */}
            <motion.div {...fadeUp(0.22)} className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={() => navigate('/prediccion')}
                className="btn-inverted px-8 py-3.5 text-base font-bold shadow-frap"
                style={{ borderRadius: '50px' }}
              >
                Comenzar predicción
                <ArrowRight size={18} />
              </button>
            </motion.div>
          </div>

          {/* Right: floating stats grid */}
          <motion.div
            {...fadeUp(0.2)}
            className="flex-shrink-0 grid grid-cols-2 gap-3 w-full max-w-xs"
          >
            {[
              { label: 'Precisión del modelo', value: '90%',    color: 'text-sbucks-light' },
              { label: 'Tiempo de análisis',   value: '<1 min', color: 'text-emerald-400'  },
              { label: 'Variables analizadas', value: '5',      color: 'text-amber-400'    },
              { label: 'Consejero IA',          value: '24/7',  color: 'text-violet-400'   },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="bg-white/10 backdrop-blur border border-white/15 rounded-card p-4 text-center"
              >
                <p className={`text-2xl font-extrabold ${s.color}`} style={{ letterSpacing: '-0.016em' }}>{s.value}</p>
                <p className="text-[0.68rem] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.58)' }}>{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── White section (DESIGN.md rhythm: pg-warm hero → white body) */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="section-label block mb-2">¿Qué obtienes?</span>
            <h2 className="text-3xl font-extrabold text-sbucks-green" style={{ letterSpacing: '-0.016em' }}>
              Todo lo que necesitas para mejorar
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BarChart2,   title: 'Probabilidad de Riesgo',  desc: 'Velocímetro visual con tu % de riesgo académico calculado con regresión logística.', color: 'bg-sbucks-accent/10 text-sbucks-accent' },
              { icon: TrendingUp,  title: 'Gráficas Detalladas',     desc: 'Compara tus métricas vs el promedio de estudiantes que aprobaron.',                    color: 'bg-emerald-50 text-emerald-600' },
              { icon: Lightbulb,   title: 'Consejos IA',             desc: 'Análisis personalizado generado con IA basado en tu perfil académico.',                color: 'bg-amber-50 text-amber-600' },
              { icon: Calculator,  title: 'Detalles Matemáticos',    desc: 'Explora la ecuación logit y probabilidad exacta de tu predicción.',                    color: 'bg-violet-50 text-violet-600' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp(i * 0.08)}
                /* DESIGN.md §4 Card: pg-warm bg, 12px radius, 2-layer shadow */
                className="bg-pg-warm rounded-card shadow-card border border-usb-border hover:shadow-card-hover hover:-translate-y-1 transition-all"
              >
                <div className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                    <f.icon size={22} />
                  </div>
                  <h3 className="font-bold text-ink mb-1.5" style={{ letterSpacing: '-0.01em' }}>{f.title}</h3>
                  <p className="text-ink-soft text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── pg-warm section */}
      <section className="py-20 bg-pg-warm">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="section-label block mb-2">Proceso</span>
            <h2 className="text-3xl font-extrabold text-sbucks-green" style={{ letterSpacing: '-0.016em' }}>
              Tres pasos simples
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: ClipboardList, title: 'Ingresa tus datos',  desc: 'Asistencia, seguimiento, notas y uso de plataforma.' },
              { step: '02', icon: BarChart2,     title: 'Análisis IA',        desc: 'El modelo procesa tus 5 variables en menos de 1 segundo.' },
              { step: '03', icon: Lightbulb,     title: 'Recibe tu reporte',  desc: 'Gráficas, nivel de riesgo y consejos personalizados.' },
            ].map((p, i) => (
              <motion.div
                key={p.step}
                {...fadeUp(i * 0.1)}
                className="relative text-center"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-[calc(100%-16px)] w-8 border-t-2 border-dashed border-pg-ceramic z-10" />
                )}
                {/* Step circle — sbucks-accent fill, shadow-frap */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sbucks-accent text-white font-extrabold text-sm mb-4 shadow-frap"
                     style={{ letterSpacing: '-0.01em' }}>
                  {p.step}
                </div>
                <div className="w-10 h-10 rounded-xl bg-sbucks-house/10 flex items-center justify-center mx-auto mb-3">
                  <p.icon size={20} className="text-sbucks-house" />
                </div>
                <h3 className="font-bold text-ink mb-1" style={{ letterSpacing: '-0.01em' }}>{p.title}</h3>
                <p className="text-ink-soft text-sm">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Variables ── white section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="section-label block mb-2">Variables del modelo</span>
            <h2 className="text-3xl font-extrabold text-sbucks-green" style={{ letterSpacing: '-0.016em' }}>
              ¿Qué analiza el predictor?
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Users,        label: 'Asistencia a Clases',     desc: 'Porcentaje de clases a las que asistes',   color: 'text-sbucks-accent'  },
              { icon: ClipboardList, label: 'Nivel de Seguimiento',   desc: 'Calificación promedio en seguimientos',    color: 'text-emerald-600'    },
              { icon: BookOpen,     label: 'Nota del Primer Parcial', desc: 'Tu calificación en el primer examen',      color: 'text-amber-600'      },
              { icon: Monitor,      label: 'Uso de Plataforma',       desc: 'Inicios de sesión en el sistema LMS',      color: 'text-violet-600'     },
              { icon: CheckCircle,  label: 'Asistencia a Tutorías',   desc: '¿Usas el servicio de tutorías?',           color: 'text-rose-600'       },
              { icon: Layers,       label: 'Modelo de Regresión',     desc: 'Logistic Regression · 99k registros',      color: 'text-ink-soft'       },
            ].map((v, i) => (
              <motion.div
                key={v.label}
                {...fadeUp(i * 0.06)}
                className="flex items-start gap-3 p-4 bg-pg-warm rounded-card border border-usb-border hover:shadow-card transition-all"
              >
                <div className={`mt-0.5 flex-shrink-0 ${v.color}`}>
                  <v.icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm" style={{ letterSpacing: '-0.01em' }}>{v.label}</p>
                  <p className="text-ink-soft text-xs mt-0.5">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── dark-green feature band (DESIGN.md §4 Feature Band) */}
      <section className="py-16 bg-sbucks-house">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div {...fadeUp()}>
            <Clock size={32} className="text-sbucks-light mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-white mb-3" style={{ letterSpacing: '-0.016em' }}>
              Menos de 1 minuto
            </h2>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.70)', letterSpacing: '-0.01em' }}>
              Conoce tu nivel de riesgo académico ahora mismo y actúa a tiempo.
            </p>
            {/* White-filled (inverted) CTA on dark band */}
            <button
              onClick={() => navigate('/prediccion')}
              className="btn-inverted px-8 py-3.5 text-base font-bold shadow-frap"
              style={{ borderRadius: '50px' }}
            >
              Ir al predictor
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── DESIGN.md: House Green footer, white/white-soft text */}
      <footer className="bg-sbucks-house border-t border-white/10 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart2 size={16} className="text-sbucks-light" />
          <span className="text-white font-bold text-sm" style={{ letterSpacing: '-0.01em' }}>Academic Risk</span>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
          Plataforma académica multi-institucional · Período 2024-I
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap px-4">
          {['Python', 'FastAPI', 'scikit-learn', 'React', 'TypeScript'].map(t => (
            <span key={t}
              className="text-[0.62rem] font-bold uppercase text-white/20 bg-white/6 px-2 py-0.5 rounded-pill border border-white/10"
              style={{ letterSpacing: '0.1em' }}>
              {t}
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}
