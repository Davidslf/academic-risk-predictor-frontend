import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, Send, X, Bot, User, ChevronDown,
  AlertTriangle, CheckCircle2, Loader2, Calculator,
  RotateCcw, Info, Sparkles
} from 'lucide-react'
import {
  Chart as ChartJS,
  ArcElement, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useGrades } from '../context/GradesContext'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE = 'https://academic-risk-api-1763919371.azurewebsites.net'

const PROMEDIOS_APROBADOS = {
  asistencia:   88.5,
  seguimiento:  3.9,
  parcial:      3.8,
  logins:       56.2,
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormData {
  asistencia:   number
  seguimiento:  number
  parcial:      number
  logins:       number
  tutorias:     boolean
}

interface PredictionResult {
  porcentaje_riesgo: number
  nivel_riesgo: 'BAJO' | 'MEDIO' | 'ALTO'
  analisis_ia: string
  datos_radar: {
    labels: string[]
    estudiante: number[]
    promedio_aprobado: number[]
  }
  detalles_matematicos: {
    intercepto: number
    coeficientes: number[]
    features_scaled: number[]
    formula_logit: string
    formula_sigmoide: string
    calculo_logit_texto: string
    calculo_probabilidad_texto: string
  }
}

interface ChatMessage {
  role: 'bot' | 'user'
  text: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function riskColor(nivel: string) {
  if (nivel === 'BAJO')  return '#10b981'
  if (nivel === 'ALTO')  return '#ef4444'
  return '#f59e0b'
}
function riskBgClass(nivel: string) {
  if (nivel === 'BAJO')  return 'bg-emerald-50 border-emerald-200 text-emerald-700'
  if (nivel === 'ALTO')  return 'bg-red-50 border-red-200 text-red-700'
  return 'bg-amber-50 border-amber-200 text-amber-700'
}
function riskIcon(nivel: string) {
  if (nivel === 'BAJO')  return <CheckCircle2 size={16} />
  if (nivel === 'ALTO')  return <AlertTriangle size={16} />
  return <Info size={16} />
}

function avg(arr: number[]) {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null
}

// ─── Derive predictor inputs from student grades ──────────────────────────────
function deriveFormData(studentId: string, courseList: ReturnType<typeof useGrades>['courseList'], grades: ReturnType<typeof useGrades>['grades']): FormData {
  const myCourses = courseList.filter(c => c.studentIds.includes(studentId))

  const parcialVals: number[] = []
  const quizVals:    number[] = []
  const asistVals:   number[] = []

  for (const course of myCourses) {
    for (const comp of course.components) {
      const g = grades.find(gr => gr.studentId === studentId && gr.componentId === comp.id)
      if (g?.value == null) continue
      const name = comp.name.toLowerCase()
      if (name.includes('parcial') || name.includes('examen')) parcialVals.push(g.value)
      else if (name.includes('quiz') || name.includes('seguimiento') || name.includes('taller')) quizVals.push(g.value)
      else if (name.includes('asist')) asistVals.push(g.value)
    }
  }

  return {
    asistencia:  asistVals.length  > 0 ? Math.min(100, Math.round((avg(asistVals)!  * 20) * 10) / 10) : 85,
    seguimiento: quizVals.length   > 0 ? Math.round(avg(quizVals)!   * 10) / 10 : 3.5,
    parcial:     parcialVals.length > 0 ? Math.round(avg(parcialVals)! * 10) / 10 : 3.2,
    logins:      42,   // not stored in grades — kept as manual
    tutorias:    true,
  }
}

// ─── Slider ──────────────────────────────────────────────────────────────────
function Slider({
  label, value, min, max, step, unit, onChange, locked
}: {
  label: string; value: number; min: number; max: number
  step: number; unit?: string; onChange: (v: number) => void; locked?: boolean
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={`mb-5 ${locked ? 'opacity-75' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="text-sm font-semibold text-usb-subtle">{label}</label>
          {locked && (
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-ar-cyan bg-ar-cyan/10 px-1.5 py-0.5 rounded-full border border-ar-cyan/20">
              Desde tus notas · solo lectura
            </span>
          )}
        </div>
        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full min-w-[52px] text-center ${
          locked ? 'bg-usb-canvas border border-usb-border text-usb-subtle' : 'bg-ar-navy text-white'
        }`}>
          {value}{unit ?? ''}
        </span>
      </div>
      <div className={`relative h-2 rounded-full ${locked ? 'bg-usb-border/60' : 'bg-usb-border'}`}>
        <div
          className={`absolute h-2 rounded-full transition-all ${locked ? 'bg-ar-cyan/40' : 'bg-ar-cyan'}`}
          style={{ width: `${pct}%` }}
        />
        {/* Only render interactive input when NOT locked */}
        {!locked && (
          <input
            type="range"
            min={min} max={max} step={step} value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
          />
        )}
        <div
          className={`absolute w-4 h-4 rounded-full shadow-sm -translate-y-1 -translate-x-2 pointer-events-none transition-all ${
            locked
              ? 'bg-usb-canvas border-2 border-usb-border'
              : 'bg-white border-2 border-ar-cyan'
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[0.65rem] text-usb-faint">{min}{unit ?? ''}</span>
        <span className="text-[0.65rem] text-usb-faint">{max}{unit ?? ''}</span>
      </div>
    </div>
  )
}

// ─── Gauge ───────────────────────────────────────────────────────────────────
function GaugeChart({ pct, nivel }: { pct: number; nivel: string }) {
  const color = riskColor(nivel)
  return (
    <div className="relative">
      <Doughnut
        data={{
          datasets: [{
            data: [pct, 100 - pct],
            backgroundColor: [color, '#e5e7eb'],
            borderWidth: 0,
            circumference: 180,
            rotation: 270,
          }],
        }}
        options={{
          cutout: '72%',
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
        } as any}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-2">
        <span className="text-3xl font-extrabold" style={{ color }}>{pct}%</span>
        <span className="text-xs text-usb-muted font-medium">de riesgo</span>
      </div>
    </div>
  )
}

// ─── Bar chart ───────────────────────────────────────────────────────────────
function CompareBar({ title, labels, studentVals, avgVals, maxY, stepY }: {
  title: string; labels: string[]; studentVals: number[]
  avgVals: number[]; maxY?: number; stepY?: number
}) {
  return (
    <Bar
      data={{
        labels,
        datasets: [
          { label: 'Tus datos',           data: studentVals, backgroundColor: 'rgba(0,180,216,0.8)', borderRadius: 6 },
          { label: 'Promedio aprobados',   data: avgVals,     backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          title: { display: true, text: title, font: { size: 12, weight: 'bold' } },
        },
        scales: {
          y: {
            beginAtZero: true,
            ...(maxY  ? { max: maxY }           : {}),
            ...(stepY ? { ticks: { stepSize: stepY } } : {}),
          },
        },
      } as any}
    />
  )
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────
function ChatBot({ result, formData }: { result: PredictionResult | null; formData: FormData }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: '¡Hola! Soy tu consejero académico virtual 🤖\nPresiona "Calcular mi riesgo" para obtener tu predicción y luego pregúntame lo que quieras.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)

    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 30000)
      const res = await fetch(`${API_BASE}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          pregunta: text,
          datos_estudiante: {
            promedio_asistencia:       formData.asistencia,
            promedio_seguimiento:      formData.seguimiento,
            nota_parcial_1:            formData.parcial,
            inicios_sesion_plataforma: formData.logins,
            uso_tutorias:              formData.tutorias ? 1 : 0,
          },
          prediccion_actual: result,
        }),
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.respuesta }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Lo siento, no pude conectarme al servidor. Intenta de nuevo más tarde.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating toggle button — ALWAYS visible */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="toggle"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-ar-cyan hover:bg-ar-cyan-dark text-white flex items-center justify-center shadow-glow hover:shadow-lg transition-colors z-50"
            title="Consejero Virtual IA"
          >
            <Bot size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-modal border border-usb-border flex flex-col z-50"
            style={{ maxHeight: '70vh' }}
          >
            {/* Header */}
            <div className="bg-ar-navy px-4 py-3 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-ar-cyan/20 border border-ar-cyan/30 flex items-center justify-center">
                  <Bot size={16} className="text-ar-cyan" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">Consejero Virtual</p>
                  <p className="text-white/40 text-[0.65rem]">Pregúntame sobre tu rendimiento</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors p-1">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-usb-canvas">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.role === 'bot' ? 'bg-ar-cyan/20 border border-ar-cyan/30' : 'bg-ar-navy'
                  }`}>
                    {m.role === 'bot'
                      ? <Bot size={13} className="text-ar-cyan" />
                      : <User size={13} className="text-white" />}
                  </div>
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'bot'
                      ? 'bg-white border border-usb-border text-usb-subtle rounded-bl-none'
                      : 'bg-ar-navy text-white rounded-br-none'
                  }`}>
                    {m.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-ar-cyan/20 border border-ar-cyan/30 flex items-center justify-center">
                    <Bot size={13} className="text-ar-cyan" />
                  </div>
                  <div className="bg-white border border-usb-border rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-usb-faint animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="border-t border-usb-border p-3 flex gap-2 bg-white flex-shrink-0 rounded-b-2xl">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Escribe tu pregunta…"
                className="flex-1 bg-usb-canvas border border-usb-border rounded-full px-4 py-2 text-xs text-usb-text placeholder-usb-faint focus:outline-none focus:border-ar-cyan focus:ring-1 focus:ring-ar-cyan/30 transition-all"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-full bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-40 flex items-center justify-center transition-all"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Math modal ───────────────────────────────────────────────────────────────
function MathModal({ result, onClose }: { result: PredictionResult; onClose: () => void }) {
  const d = result.detalles_matematicos
  const featureNames = ['Asistencia', 'Seguimiento', 'Parcial 1', 'Inicios Sesión', 'Tutorías']
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="bg-ar-navy px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-ar-cyan" />
            <h3 className="text-white font-bold">Detalles Matemáticos</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-usb-canvas border-b-2 border-usb-border">
                  {['Variable','Valor Escalado','Coeficiente','Impacto'].map(h => (
                    <th key={h} className="px-3 py-2 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted text-center first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureNames.map((name, i) => {
                  const impact = (d.features_scaled[i] ?? 0) * (d.coeficientes[i] ?? 0)
                  return (
                    <tr key={name} className="border-b border-usb-border">
                      <td className="px-3 py-2 font-medium text-usb-subtle">{name}</td>
                      <td className="px-3 py-2 text-center font-mono text-usb-muted">{(d.features_scaled[i] ?? 0).toFixed(4)}</td>
                      <td className="px-3 py-2 text-center font-mono text-ar-cyan font-semibold">{(d.coeficientes[i] ?? 0).toFixed(4)}</td>
                      <td className={`px-3 py-2 text-center font-mono font-bold ${impact < 0 ? 'text-emerald-600' : 'text-red-500'}`}>{impact.toFixed(4)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {[
            { label: 'Intercepto', val: d.intercepto.toFixed(6) },
            { label: 'Cálculo z (logit)', val: d.calculo_logit_texto },
            { label: 'Probabilidad σ(z)', val: d.calculo_probabilidad_texto },
          ].map(({ label, val }) => (
            <div key={label} className="bg-usb-canvas rounded-xl p-4 border border-usb-border">
              <p className="text-xs font-bold uppercase tracking-wider text-usb-muted mb-2">{label}</p>
              <p className="font-mono text-xs text-usb-subtle leading-relaxed break-all">{val}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Prediccion() {
  const { user } = useAuth()
  const { courseList, grades } = useGrades()

  // Derive initial form values from student's actual grades
  const derivedForm = useMemo(
    () => deriveFormData(user?.studentId ?? '', courseList, grades),
    [user?.studentId, courseList, grades]
  )

  const [form, setForm] = useState<FormData>(derivedForm)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [showMath, setShowMath] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Check how many values were auto-filled vs defaulted
  const hasGradesData = useMemo(() => {
    const myCourses = courseList.filter(c => c.studentIds.includes(user?.studentId ?? ''))
    return myCourses.some(course =>
      course.components.some(comp => {
        const g = grades.find(gr => gr.studentId === user?.studentId && gr.componentId === comp.id)
        return g?.value != null
      })
    )
  }, [courseList, grades, user?.studentId])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 30000)

    try {
      const res = await fetch(`${API_BASE}/api/v1/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          promedio_asistencia:        form.asistencia,
          promedio_seguimiento:       form.seguimiento,
          nota_parcial_1:             form.parcial,
          inicios_sesion_plataforma:  form.logins,
          uso_tutorias:               form.tutorias ? 1 : 0,
        }),
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data: PredictionResult = await res.json()
      setResult(data)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('La petición tardó demasiado. El servidor puede estar iniciando (30–50 s). Intenta de nuevo.')
      } else {
        setError('No se pudo conectar con el servidor. Verifica tu conexión.')
      }
    } finally {
      setLoading(false)
    }
  }, [form])

  const reset = () => {
    setForm(derivedForm)
    setResult(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-usb-canvas flex flex-col">
      <Header />

      {/* Page title */}
      <div className="bg-ar-navy border-b border-white/10 px-5 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={18} className="text-ar-cyan" />
            <h1 className="text-white font-extrabold text-xl">Predicción Académica</h1>
          </div>
          <p className="text-white/50 text-sm">
            {hasGradesData
              ? 'Tus datos académicos fueron cargados automáticamente desde tus notas registradas.'
              : 'Ajusta tus variables y calcula tu nivel de riesgo académico.'}
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8">
        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Form column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-card border border-usb-border p-6 sticky top-20">

              {/* Auto-fill banner */}
              {hasGradesData && (
                <div className="flex items-start gap-2 bg-ar-cyan/10 border border-ar-cyan/20 rounded-xl px-3 py-2.5 mb-5">
                  <Sparkles size={14} className="text-ar-cyan mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-ar-navy font-medium leading-relaxed">
                    Variables completadas automáticamente desde tus notas. Solo ajusta los datos que faltan.
                  </p>
                </div>
              )}

              <h2 className="font-bold text-usb-text mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-ar-cyan/20 text-ar-cyan flex items-center justify-center text-xs font-bold">1</span>
                Tus variables académicas
              </h2>

              <form onSubmit={handleSubmit}>
                <Slider
                  label="Asistencia a clases"
                  value={form.asistencia}
                  min={0} max={100} step={0.1} unit="%"
                  locked={hasGradesData}
                  onChange={v => setForm(f => ({ ...f, asistencia: v }))}
                />
                <Slider
                  label="Promedio de seguimiento"
                  value={form.seguimiento}
                  min={0} max={5} step={0.1}
                  locked={hasGradesData}
                  onChange={v => setForm(f => ({ ...f, seguimiento: v }))}
                />
                <Slider
                  label="Nota parcial 1"
                  value={form.parcial}
                  min={0} max={5} step={0.1}
                  locked={hasGradesData}
                  onChange={v => setForm(f => ({ ...f, parcial: v }))}
                />
                <Slider
                  label="Inicios de sesión plataforma"
                  value={form.logins}
                  min={0} max={100} step={1}
                  onChange={v => setForm(f => ({ ...f, logins: v }))}
                />

                {/* Tutorías toggle */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-usb-subtle mb-2 block">Uso de tutorías</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, tutorias: !f.tutorias }))}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      form.tutorias
                        ? 'border-ar-cyan bg-ar-cyan/5 text-ar-navy'
                        : 'border-usb-border bg-usb-canvas text-usb-muted'
                    }`}
                  >
                    <span>{form.tutorias ? '✅ Sí, uso tutorías' : '❌ No uso tutorías'}</span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${form.tutorias ? 'bg-ar-cyan' : 'bg-usb-border'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.tutorias ? 'left-5' : 'left-0.5'}`} />
                    </div>
                  </button>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"
                    >
                      <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-red-600 text-xs leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-full transition-all shadow-glow hover:shadow-lg"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Calculando…</>
                    : <><Sparkles size={16} /> Calcular mi riesgo</>
                  }
                </button>

                {result && (
                  <button type="button" onClick={reset}
                    className="w-full flex items-center justify-center gap-1.5 text-usb-muted hover:text-usb-text text-xs font-medium mt-2 py-2 transition-colors"
                  >
                    <RotateCcw size={12} /> Reiniciar
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* ── Results column ──────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-5" ref={resultsRef}>

            {/* Empty state */}
            {!result && !loading && (
              <div className="bg-white rounded-2xl shadow-card border border-usb-border p-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-usb-canvas border border-usb-border flex items-center justify-center mb-4">
                  <BarChart2 size={28} className="text-usb-faint" />
                </div>
                <p className="font-bold text-usb-text mb-1">Esperando tu análisis</p>
                <p className="text-usb-muted text-sm">Presiona "Calcular mi riesgo" para obtener tu predicción</p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="bg-white rounded-2xl shadow-card border border-usb-border p-12 flex flex-col items-center">
                <Loader2 size={36} className="text-ar-cyan animate-spin mb-4" />
                <p className="font-bold text-usb-text">Calculando predicción…</p>
                <p className="text-usb-muted text-sm mt-1">El servidor puede tardar 30–50 s si estuvo inactivo</p>
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {result && (
                <>
                  {/* Gauge + risk level */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-card border border-usb-border p-6"
                  >
                    <h3 className="font-bold text-usb-text mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-ar-cyan/20 text-ar-cyan flex items-center justify-center text-xs font-bold">2</span>
                      Nivel de Riesgo
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-full max-w-[200px]">
                        <GaugeChart pct={result.porcentaje_riesgo} nivel={result.nivel_riesgo} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${riskBgClass(result.nivel_riesgo)}`}>
                          {riskIcon(result.nivel_riesgo)}
                          Riesgo {result.nivel_riesgo}
                        </div>
                        <div className="bg-usb-canvas rounded-xl p-3 border border-usb-border">
                          <p className="text-xs text-usb-muted mb-0.5 font-medium">Probabilidad de aprobar</p>
                          <p className="text-2xl font-extrabold text-emerald-600">{100 - result.porcentaje_riesgo}%</p>
                        </div>
                        <button
                          onClick={() => setShowMath(true)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-ar-cyan hover:text-ar-cyan-dark transition-colors"
                        >
                          <Calculator size={13} /> Ver detalles matemáticos <ChevronDown size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Charts */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid sm:grid-cols-2 gap-4"
                  >
                    <div className="bg-white rounded-2xl shadow-card border border-usb-border p-4">
                      <CompareBar
                        title="Asistencia y Plataforma"
                        labels={['Asistencia (%)', 'Inicios Sesión']}
                        studentVals={[form.asistencia, form.logins]}
                        avgVals={[PROMEDIOS_APROBADOS.asistencia, PROMEDIOS_APROBADOS.logins]}
                        maxY={100} stepY={10}
                      />
                    </div>
                    <div className="bg-white rounded-2xl shadow-card border border-usb-border p-4">
                      <CompareBar
                        title="Seguimiento y Parcial"
                        labels={['Seguimiento', 'Parcial 1']}
                        studentVals={[form.seguimiento, form.parcial]}
                        avgVals={[PROMEDIOS_APROBADOS.seguimiento, PROMEDIOS_APROBADOS.parcial]}
                        maxY={5} stepY={0.5}
                      />
                    </div>
                  </motion.div>

                  {/* AI Analysis */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-card border border-usb-border p-6"
                  >
                    <h3 className="font-bold text-usb-text mb-3 flex items-center gap-2">
                      <Bot size={16} className="text-ar-cyan" />
                      Análisis del Consejero IA
                    </h3>
                    <div className="bg-usb-canvas rounded-xl p-4 border border-usb-border text-sm text-usb-subtle leading-relaxed whitespace-pre-wrap">
                      {result.analisis_ia}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="bg-ar-navy border-t border-white/10 py-4 text-center">
        <p className="text-white/30 text-xs">Academic Risk · Predictor Académico IA · Período 2024-I</p>
      </footer>

      {/* Chat bubble — always visible on this page */}
      <ChatBot result={result} formData={form} />

      {/* Math modal */}
      <AnimatePresence>
        {showMath && result && <MathModal result={result} onClose={() => setShowMath(false)} />}
      </AnimatePresence>
    </div>
  )
}
