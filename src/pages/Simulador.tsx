/**
 * Simulador — Simulador dinámico de riesgo académico
 * Route: /materia/:courseId/simulador
 *
 * Modo A "Simular notas":  sliders → riesgo en tiempo real vs notas reales
 * Modo B "¿Cuánto necesito?": meta de nota → calcula qué necesitas en Corte 3
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Loader2, BarChart2, AlertTriangle, CheckCircle2,
  TrendingDown, TrendingUp, RotateCcw, Target, Sliders,
} from 'lucide-react'
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import Header from '../components/Header'
import RiskoAnalysis from '../components/RiskoAnalysis'
import { useAuth } from '../context/AuthContext'
import { enrollmentService } from '../services/enrollmentService'
import { courseService, type BackendCourse } from '../services/courseService'
import { predictionService, type PredictionOutput } from '../services/predictionService'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

// ─── Pesos del modelo (30 · 30 · 40) ─────────────────────────────────────────
const W = { c1: 0.3, c2: 0.3, c3: 0.4 }
function calcTotal(c1: number, c2: number, c3: number) {
  return Math.round((W.c1 * c1 + W.c2 * c2 + W.c3 * c3) * 100) / 100
}
function neededC3(c1: number, c2: number, target: number) {
  return Math.round(((target - W.c1 * c1 - W.c2 * c2) / W.c3) * 100) / 100
}

// ─── Colores ──────────────────────────────────────────────────────────────────
function riskColor(nivel?: string) {
  if (nivel === 'BAJO') return '#16a34a'
  if (nivel === 'ALTO') return '#dc2626'
  return '#d97706'
}
function riskBg(nivel?: string) {
  if (nivel === 'BAJO') return '#dcfce7'
  if (nivel === 'ALTO') return '#fee2e2'
  return '#fef3c7'
}
function riskLabel(nivel?: string) {
  if (nivel === 'BAJO') return 'Riesgo Bajo'
  if (nivel === 'ALTO') return 'Riesgo Alto'
  return 'Riesgo Medio'
}
function gradeClr(v: number) {
  if (v >= 4.0) return '#16a34a'
  if (v >= 3.0) return '#d97706'
  return '#dc2626'
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function GradeSlider({
  label, value, onChange, realValue, disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  realValue?: number | null
  disabled?: boolean
}) {
  const pct = (value / 5) * 100
  const color = disabled ? '#9ca3af' : gradeClr(value)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.72rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
          {label}
          {realValue != null && (
            <span className="ml-2 font-normal normal-case tracking-normal text-[0.68rem]" style={{ color: 'var(--text-muted)' }}>
              (actual: {Number(realValue).toFixed(1)})
            </span>
          )}
        </span>
        <span className="text-base font-extrabold tabular-nums" style={{ color }}>
          {value.toFixed(1)}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-3 rounded-full" style={{ background: '#e5e7eb' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-75"
          style={{ width: `${pct}%`, background: color }}
        />
        <input
          type="range" min={0} max={5} step={0.1} value={value}
          disabled={disabled}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 disabled:cursor-not-allowed"
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
      </div>

      <div className="flex justify-between text-[0.58rem]" style={{ color: 'var(--text-faint)' }}>
        <span>0.0</span><span>2.5</span><span>5.0</span>
      </div>
    </div>
  )
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
function RiskBadge({ nivel, pct, label }: { nivel: string; pct: number; label: string }) {
  const color = riskColor(nivel)
  return (
    <div
      className="flex flex-col items-center justify-center p-4 rounded-2xl"
      style={{ background: riskBg(nivel), border: `1.5px solid ${color}44` }}
    >
      <p className="text-[0.60rem] font-bold uppercase tracking-wider mb-1" style={{ color: `${color}99` }}>{label}</p>
      <span className="text-3xl font-black tabular-nums leading-none" style={{ color }}>
        {Math.round(pct)}%
      </span>
      <span className="text-xs font-bold mt-1" style={{ color }}>
        {riskLabel(nivel)}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Simulador() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate      = useNavigate()
  const { user }      = useAuth()

  const [course, setCourse]   = useState<BackendCourse | null>(null)
  const [loading, setLoading] = useState(true)

  // Notas reales del DB
  const [realC1, setRealC1] = useState<number | null>(null)
  const [realC2, setRealC2] = useState<number | null>(null)
  const [realC3, setRealC3] = useState<number | null>(null)
  const [studentId, setStudentId] = useState<string | undefined>(undefined)

  // Notas simuladas (sliders)
  const [simC1, setSimC1] = useState(3.0)
  const [simC2, setSimC2] = useState(3.0)
  const [simC3, setSimC3] = useState(3.0)
  const simTotal = calcTotal(simC1, simC2, simC3)

  // Modo
  const [mode, setMode] = useState<'scenario' | 'goal'>('scenario')
  const [targetGrade, setTargetGrade] = useState(3.0)

  // Predicciones
  const [predicting, setPredicting]   = useState(false)
  const [simResult, setSimResult]     = useState<PredictionOutput | null>(null)
  const [realResult, setRealResult]   = useState<PredictionOutput | null>(null)
  const [predError, setPredError]     = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Cargar datos del curso y matrícula ────────────────────────────────────
  useEffect(() => {
    if (!courseId || !user?.studentId) return
    setLoading(true)
    ;(async () => {
      try {
        const [c, enrollments] = await Promise.all([
          courseService.getById(courseId),
          enrollmentService.listByStudent(user.studentId!),
        ])
        setCourse(c)
        const enrollment = enrollments.find(e => e.course_id === courseId)
        if (!enrollment) return
        setStudentId(enrollment.student_id)
        const grades = await enrollmentService.getGrades(enrollment.id)
        // La API puede devolver las notas como strings ("4.20") — forzar a number
        const c1 = grades.first_cohort_grade  != null ? Number(grades.first_cohort_grade)  : null
        const c2 = grades.second_cohort_grade != null ? Number(grades.second_cohort_grade) : null
        const c3 = grades.third_cohort_grade  != null ? Number(grades.third_cohort_grade)  : null
        setRealC1(c1); setRealC2(c2); setRealC3(c3)
        // Pre-fill sliders con notas reales (o 3.0 si no hay nota)
        setSimC1(c1 ?? 3.0)
        setSimC2(c2 ?? 3.0)
        setSimC3(c3 ?? 3.0)
        // Predicción inicial con notas reales si existen los 3 cortes
        if (c1 != null && c2 != null && c3 != null) {
          const total = calcTotal(c1, c2, c3)
          try {
            const r = await predictionService.predict(
              { nota_corte_1: c1, nota_corte_2: c2, nota_corte_final: c3, nota_total: total },
              enrollment.student_id,
            )
            setRealResult(r)
            setSimResult(r)
          } catch { /* sin predicción inicial */ }
        }
      } catch { /* silencioso */ }
      finally { setLoading(false) }
    })()
  }, [courseId, user?.studentId])

  // ── Predicción con debounce ───────────────────────────────────────────────
  const triggerPredict = useCallback((c1: number, c2: number, c3: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setPredicting(true)
      setPredError(null)
      try {
        const total = calcTotal(c1, c2, c3)
        const r = await predictionService.predict(
          { nota_corte_1: c1, nota_corte_2: c2, nota_corte_final: c3, nota_total: total },
          studentId,
        )
        setSimResult(r)
      } catch (e) {
        setPredError(e instanceof Error ? e.message : 'Error al calcular')
      } finally { setPredicting(false) }
    }, 380)
  }, [studentId])

  // Modo escenario: disparar al mover sliders
  useEffect(() => {
    if (mode === 'scenario') triggerPredict(simC1, simC2, simC3)
  }, [simC1, simC2, simC3, mode, triggerPredict])

  // ── Modo meta ─────────────────────────────────────────────────────────────
  const needed       = neededC3(simC1, simC2, targetGrade)
  const goalImpossible = needed > 5.0
  const goalTrivial    = needed < 0
  const maxAchievable  = calcTotal(simC1, simC2, 5.0)

  // Predicción cuando cambia la meta o las notas conocidas
  useEffect(() => {
    if (mode !== 'goal') return
    if (goalImpossible) { setPredError(null); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setPredicting(true)
      setPredError(null)
      const c3Used = Math.max(0, Math.min(5, needed))
      try {
        const total = calcTotal(simC1, simC2, c3Used)
        const r = await predictionService.predict(
          { nota_corte_1: simC1, nota_corte_2: simC2, nota_corte_final: c3Used, nota_total: total },
          studentId,
        )
        setSimResult(r)
      } catch { /* silencioso */ }
      finally { setPredicting(false) }
    }, 380)
  }, [targetGrade, simC1, simC2, mode, needed, goalImpossible, studentId])

  // ── Delta de riesgo ───────────────────────────────────────────────────────
  const riskDelta = realResult && simResult
    ? simResult.porcentaje_riesgo - realResult.porcentaje_riesgo
    : null

  // ── Radar data ────────────────────────────────────────────────────────────
  const radarData = simResult ? (() => {
    const simValues = mode === 'goal' && !goalImpossible
      ? [simC1, simC2, Math.max(0, Math.min(5, needed)), calcTotal(simC1, simC2, Math.max(0, Math.min(5, needed)))]
      : [simC1, simC2, simC3, simTotal]

    const datasets = [
      {
        label: 'Simulado',
        data: simValues,
        backgroundColor: 'rgba(0,180,216,0.15)',
        borderColor: 'rgba(0,180,216,0.85)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(0,180,216,0.85)',
        pointRadius: 4,
      },
      {
        label: 'Promedio aprobados',
        data: simResult.datos_radar.promedio_aprobado,
        backgroundColor: 'rgba(22,163,74,0.10)',
        borderColor: 'rgba(22,163,74,0.65)',
        borderWidth: 2,
        borderDash: [4, 4] as number[],
        pointBackgroundColor: 'rgba(22,163,74,0.65)',
        pointRadius: 3,
      },
    ]

    // Agregar notas reales como tercer dataset si difieren de lo simulado
    if (realResult) {
      const real = realResult.datos_radar.estudiante
      const diff = real.some((v, i) => Math.abs(v - simValues[i]) > 0.05)
      if (diff) {
        datasets.push({
          label: 'Tus notas reales',
          data: real,
          backgroundColor: 'rgba(124,58,237,0.07)',
          borderColor: 'rgba(124,58,237,0.55)',
          borderWidth: 1.5,
          borderDash: [3, 4] as number[],
          pointBackgroundColor: 'rgba(124,58,237,0.55)',
          pointRadius: 3,
        })
      }
    }

    return { labels: simResult.datos_radar.labels, datasets }
  })() : null

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-usb-canvas flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--green-accent)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-usb-canvas flex flex-col">
      <Header />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'var(--green-deep)', borderBottom: '1px solid rgba(0,0,0,0.25)' }}
      >
        <div className="max-w-5xl mx-auto w-full px-5 py-6">
          <button
            onClick={() => navigate(`/materia/${courseId}`)}
            className="flex items-center gap-2 text-sm font-bold mb-4 transition-colors"
            style={{ color: 'rgba(212,233,226,0.55)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#d4e9e2')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,233,226,0.55)')}
          >
            <ArrowLeft size={15} />
            Volver a {course?.name ?? 'la materia'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(212,233,226,0.12)' }}
            >
              <BarChart2 size={20} style={{ color: '#d4e9e2' }} />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-xl leading-tight" style={{ letterSpacing: '-0.02em' }}>
                Simulador de Riesgo
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(212,233,226,0.60)' }}>
                {course?.name} · Explora escenarios en tiempo real
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {([
              { key: 'scenario', icon: <Sliders size={13} />,  label: 'Simular notas' },
              { key: 'goal',     icon: <Target  size={13} />,   label: '¿Cuánto necesito?' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={{
                  background: mode === tab.key ? 'white' : 'rgba(212,233,226,0.14)',
                  color:      mode === tab.key ? 'var(--green-deep)' : 'rgba(212,233,226,0.80)',
                  boxShadow:  mode === tab.key ? '0 1px 6px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] items-start">

          {/* ── Controles (izquierda) ── */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">

              {/* MODO A: Sliders */}
              {mode === 'scenario' && (
                <motion.div
                  key="scenario"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="bg-white rounded-2xl p-5 space-y-5"
                  style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold" style={{ color: 'var(--text-dark)' }}>Ajusta tus notas</h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Mueve los sliders — el riesgo se recalcula al instante
                      </p>
                    </div>
                    {(realC1 != null || realC2 != null || realC3 != null) && (
                      <button
                        onClick={() => { setSimC1(realC1 ?? 3.0); setSimC2(realC2 ?? 3.0); setSimC3(realC3 ?? 3.0) }}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
                        style={{ background: 'var(--canvas-warm)', color: 'var(--green-accent)' }}
                      >
                        <RotateCcw size={11} /> Restaurar
                      </button>
                    )}
                  </div>

                  <GradeSlider label="Corte 1"        value={simC1} onChange={setSimC1} realValue={realC1} />
                  <GradeSlider label="Corte 2"        value={simC2} onChange={setSimC2} realValue={realC2} />
                  <GradeSlider label="Corte 3 (Final)" value={simC3} onChange={setSimC3} realValue={realC3} />

                  {/* Total auto */}
                  <div
                    className="flex items-center justify-between pt-4 border-t"
                    style={{ borderColor: 'rgba(0,0,0,0.07)' }}
                  >
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>Nota total definitiva</p>
                      <p className="text-[0.62rem] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        30% C1 + 30% C2 + 40% C3
                      </p>
                    </div>
                    <span className="text-2xl font-extrabold tabular-nums" style={{ color: gradeClr(simTotal) }}>
                      {simTotal.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* MODO B: Meta */}
              {mode === 'goal' && (
                <motion.div
                  key="goal"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  {/* Notas conocidas */}
                  <div
                    className="bg-white rounded-2xl p-5 space-y-5"
                    style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
                  >
                    <div>
                      <h2 className="font-bold" style={{ color: 'var(--text-dark)' }}>Notas conocidas</h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Ajusta Corte 1 y Corte 2 para calcular lo que necesitas en Corte 3
                      </p>
                    </div>
                    <GradeSlider label="Corte 1" value={simC1} onChange={setSimC1} realValue={realC1} />
                    <GradeSlider label="Corte 2" value={simC2} onChange={setSimC2} realValue={realC2} />
                  </div>

                  {/* Selector de meta */}
                  <div
                    className="bg-white rounded-2xl p-5 space-y-4"
                    style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
                  >
                    <div>
                      <h2 className="font-bold" style={{ color: 'var(--text-dark)' }}>¿Qué nota quieres obtener?</h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Selecciona tu meta de nota final definitiva
                      </p>
                    </div>

                    {/* Botones rápidos */}
                    <div className="grid grid-cols-4 gap-2">
                      {[3.0, 3.5, 4.0, 4.5].map(t => (
                        <button
                          key={t}
                          onClick={() => setTargetGrade(t)}
                          className="py-2.5 rounded-xl font-bold text-sm transition-all"
                          style={{
                            background:   targetGrade === t ? 'var(--green-accent)' : 'var(--canvas-warm)',
                            color:        targetGrade === t ? 'white' : 'var(--text-dark)',
                            border:       `1.5px solid ${targetGrade === t ? 'var(--green-accent)' : 'rgba(0,0,0,0.08)'}`,
                            boxShadow:    targetGrade === t ? '0 2px 8px rgba(0,117,74,0.25)' : 'none',
                          }}
                        >
                          {t.toFixed(1)}
                        </button>
                      ))}
                    </div>

                    {/* Input personalizado */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-faint)' }}>
                        Personalizar:
                      </span>
                      <input
                        type="number" min={0} max={5} step={0.1} value={targetGrade}
                        onChange={e => {
                          const v = parseFloat(e.target.value)
                          if (Number.isFinite(v)) setTargetGrade(Math.min(5, Math.max(0, v)))
                        }}
                        className="w-24 text-center font-bold rounded-xl px-3 py-2 text-sm border focus:outline-none focus:ring-2"
                        style={{
                          border: '1.5px solid rgba(0,0,0,0.12)',
                          color: 'var(--text-dark)',
                          background: 'var(--canvas-warm)',
                        }}
                      />
                    </div>

                    {/* Resultado del cálculo */}
                    <motion.div
                      key={`${needed}-${goalImpossible}`}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-xl p-4"
                      style={{
                        background: goalImpossible ? '#fee2e2' : '#f0fdf4',
                        border: `1.5px solid ${goalImpossible ? '#fca5a5' : '#86efac'}`,
                      }}
                    >
                      {goalImpossible ? (
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-red-700 text-sm">
                              No es posible llegar a {targetGrade.toFixed(1)}
                            </p>
                            <p className="text-xs text-red-600 mt-1 leading-relaxed">
                              Con Corte 1 = {simC1.toFixed(1)} y Corte 2 = {simC2.toFixed(1)},
                              la nota máxima posible (sacando 5.0 en Corte 3) es{' '}
                              <strong>{maxAchievable.toFixed(2)}</strong>.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: '#15803d' }}>
                              Para obtener {targetGrade.toFixed(1)} como nota final necesitas:
                            </p>
                            <p className="text-3xl font-black tabular-nums mt-1 leading-none" style={{ color: gradeClr(needed) }}>
                              {Math.max(0, needed).toFixed(2)}
                              <span className="text-sm font-bold ml-2" style={{ color: '#15803d' }}>en Corte 3</span>
                            </p>
                            {needed <= 1.5 && (
                              <p className="text-xs mt-1.5 font-medium" style={{ color: '#15803d' }}>
                                ¡Está muy al alcance! 💪
                              </p>
                            )}
                            {needed > 4.5 && needed <= 5.0 && (
                              <p className="text-xs mt-1.5 font-medium text-amber-700">
                                Será exigente, pero posible. ¡A prepararse!
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Resultados (derecha) ── */}
          <div className="space-y-4">

            {/* Comparación de riesgo */}
            <div
              className="bg-white rounded-2xl p-5 space-y-4"
              style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold" style={{ color: 'var(--text-dark)' }}>
                  {mode === 'scenario' ? 'Riesgo simulado' : 'Riesgo con tu meta'}
                </h2>
                {predicting && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--green-accent)' }}>
                    <Loader2 size={12} className="animate-spin" /> Calculando…
                  </div>
                )}
              </div>

              {simResult ? (
                <>
                  <div className={`grid gap-3 ${realResult ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <RiskBadge nivel={simResult.nivel_riesgo} pct={simResult.porcentaje_riesgo} label="Simulado" />
                    {realResult && (
                      <RiskBadge nivel={realResult.nivel_riesgo} pct={realResult.porcentaje_riesgo} label="Tu riesgo real" />
                    )}
                  </div>

                  {/* Delta */}
                  {riskDelta !== null && Math.abs(riskDelta) > 0.4 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                      style={{
                        background: riskDelta < 0 ? '#f0fdf4' : '#fff7ed',
                        border:     `1px solid ${riskDelta < 0 ? '#86efac' : '#fed7aa'}`,
                      }}
                    >
                      {riskDelta < 0
                        ? <TrendingDown size={15} className="text-emerald-600 flex-shrink-0" />
                        : <TrendingUp   size={15} className="text-orange-500 flex-shrink-0" />
                      }
                      <span className="text-xs font-bold leading-snug"
                        style={{ color: riskDelta < 0 ? '#15803d' : '#c2410c' }}>
                        {riskDelta < 0
                          ? `Con estas notas tu riesgo bajaría ${Math.abs(riskDelta).toFixed(1)} puntos`
                          : `Con estas notas tu riesgo subiría ${riskDelta.toFixed(1)} puntos`
                        }
                      </span>
                    </motion.div>
                  )}

                  {/* Analysis */}
                  {simResult.analisis_ia && (
                    <RiskoAnalysis
                      analisis={simResult.analisis_ia}
                      nivel={simResult.nivel_riesgo}
                      compact
                    />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 rounded-xl"
                  style={{ background: 'var(--canvas-warm)', border: '1.5px dashed rgba(0,0,0,0.10)' }}>
                  {predicting
                    ? <Loader2 size={24} className="animate-spin mb-2" style={{ color: 'var(--green-accent)' }} />
                    : <BarChart2 size={24} className="mb-2" style={{ color: 'var(--text-faint)' }} />
                  }
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    {predicting ? 'Calculando…' : 'Ajusta las notas para ver el resultado'}
                  </p>
                </div>
              )}

              {predError && (
                <p className="text-xs font-medium text-red-600 rounded-lg px-3 py-2" style={{ background: '#fee2e2' }}>
                  {predError}
                </p>
              )}
            </div>

            {/* Radar */}
            {radarData && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5"
                style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                <p className="text-[0.65rem] font-bold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--text-faint)' }}>
                  Tu perfil vs. estudiantes que aprobaron
                </p>
                <Radar
                  data={radarData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { font: { size: 10 }, padding: 10, usePointStyle: true },
                      },
                    },
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 5,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        pointLabels: { font: { size: 10 } },
                        ticks: { stepSize: 1, font: { size: 9 }, display: false },
                      },
                    },
                  } as Parameters<typeof Radar>[0]['options']}
                />
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
