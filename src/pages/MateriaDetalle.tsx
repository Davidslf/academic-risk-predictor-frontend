/**
 * MateriaDetalle — Course detail view for students.
 * Shows course info, grades table, and prediction in one page.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Hash, Calendar, Loader2, AlertCircle,
  AlertTriangle, CheckCircle2, Minus, Sparkles, BarChart2,
  RotateCcw, Info, Bot, Send, X, User,
} from 'lucide-react'
import {
  Chart as ChartJS,
  ArcElement, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { courseService, type BackendCourse } from '../services/courseService'
import { predictionService, type PredictionInput } from '../services/predictionService'
import { gradeColor } from '../utils/gradeCalculator'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// ─── Types ───────────────────────────────────────────────────────────────────

interface PredictionResult {
  probabilidad_riesgo?: number
  porcentaje_riesgo: number
  nivel_riesgo: 'BAJO' | 'MEDIO' | 'ALTO'
  analisis_ia: string
  datos_radar: { labels: string[]; estudiante: number[]; promedio_aprobado: number[] }
  detalles_matematicos: Record<string, unknown>
}

interface ChatMessage { role: 'bot' | 'user'; text: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function riskColor(nivel: string) {
  if (nivel === 'BAJO') return '#16a34a'
  if (nivel === 'ALTO') return '#dc2626'
  return '#d97706'
}
function riskBgClass(nivel: string) {
  if (nivel === 'BAJO') return 'bg-emerald-50 border-emerald-200 text-emerald-700'
  if (nivel === 'ALTO') return 'bg-red-50 border-red-200 text-red-700'
  return 'bg-amber-50 border-amber-200 text-amber-700'
}
function riskIcon(nivel: string) {
  if (nivel === 'BAJO') return <CheckCircle2 size={16} />
  if (nivel === 'ALTO') return <AlertTriangle size={16} />
  return <Info size={16} />
}
function fmt1(n: number) { return Math.round(n * 10) / 10 }

const PROMEDIOS = { asistencia: 88.5, seguimiento: 3.9, parcial: 3.8, logins: 56.2 }

// ─── Grade cell ──────────────────────────────────────────────────────────────

function GradeCell({ value }: { value: number | null }) {
  if (value === null) return (
    <span className="inline-flex items-center justify-center w-14 text-usb-faint font-mono text-xs">
      <Minus size={12} />
    </span>
  )
  return (
    <span className={`inline-block w-14 text-center font-mono font-bold text-sm ${gradeColor(value)}`}>
      {value.toFixed(1)}
    </span>
  )
}

// ─── Gauge ───────────────────────────────────────────────────────────────────

function GaugeChart({ pct, nivel }: { pct: number; nivel: string }) {
  const color = riskColor(nivel)
  const displayPct = fmt1(pct)
  return (
    <div className="relative">
      <Doughnut
        data={{
          datasets: [{
            data: [displayPct, 100 - displayPct],
            backgroundColor: [color, '#e5e7eb'],
            borderWidth: 0, circumference: 180, rotation: 270,
          }],
        }}
        options={{
          cutout: '70%',
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          responsive: true, maintainAspectRatio: true, aspectRatio: 2,
        } as never}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
        <span className="text-4xl font-black tabular-nums" style={{ color }}>{displayPct}%</span>
        <span className="text-xs text-usb-muted font-semibold tracking-wide">de riesgo</span>
      </div>
    </div>
  )
}

// ─── Compare bar chart ───────────────────────────────────────────────────────

function CompareBar({ title, labels, studentVals, avgVals, maxY, stepY }: {
  title: string; labels: string[]; studentVals: number[]; avgVals: number[]; maxY?: number; stepY?: number
}) {
  return (
    <div style={{ height: '220px' }}>
      <Bar
        data={{
          labels,
          datasets: [
            { label: 'Tus datos', data: studentVals, backgroundColor: 'rgba(0,180,216,0.85)', borderRadius: 8, borderSkipped: false },
            { label: 'Promedio aprobados', data: avgVals, backgroundColor: 'rgba(22,163,74,0.75)', borderRadius: 8, borderSkipped: false },
          ],
        }}
        options={{
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 } },
            title: { display: true, text: title, font: { size: 12, weight: 'bold' }, padding: { bottom: 8 } },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ...(maxY ? { max: maxY } : {}), ticks: { font: { size: 10 }, ...(stepY ? { stepSize: stepY } : {}) } },
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          },
        } as never}
      />
    </div>
  )
}

// ─── Markdown renderer ───────────────────────────────────────────────────────

function MarkdownText({ text }: { text: string }) {
  return (
    <div className="space-y-1 text-sm text-usb-subtle leading-relaxed">
      {text.split('\n').map((line, i) => {
        if (line.trim() === '---') return <hr key={i} className="border-usb-border my-2" />
        const parts = line.split(/\*\*(.*?)\*\*/g)
        const rendered = parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-semibold text-usb-text">{part}</strong> : <span key={j}>{part}</span>
        )
        if (!line.trim()) return <div key={i} className="h-2" />
        return <p key={i}>{rendered}</p>
      })}
    </div>
  )
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function ChatBot({ result, formData }: { result: PredictionResult | null; formData: PredictionInput }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: '¡Hola! Soy tu consejero académico virtual 🤖\nCalcula tu riesgo y luego pregúntame lo que quieras.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)
    try {
      const data = await predictionService.chat({
        message: text,
        context: { ...formData, nivel_riesgo: result?.nivel_riesgo, probabilidad_riesgo: result?.probabilidad_riesgo },
      })
      setMessages(prev => [...prev, { role: 'bot', text: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Lo siento, no pude conectarme al servidor.' }])
    } finally { setLoading(false) }
  }

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button key="toggle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-ar-cyan hover:bg-ar-cyan-dark text-white flex items-center justify-center shadow-glow z-50"
            title="Consejero Virtual IA"
          ><Bot size={24} /></motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div key="chat" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-modal border border-usb-border flex flex-col z-50" style={{ maxHeight: '70vh' }}
          >
            <div className="bg-ar-navy px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-ar-cyan/20 border border-ar-cyan/30 flex items-center justify-center"><Bot size={16} className="text-ar-cyan" /></div>
                <div><p className="text-white text-xs font-bold">Consejero Virtual</p><p className="text-white/40 text-[0.65rem]">Pregúntame sobre tu rendimiento</p></div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white p-1"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-usb-canvas">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'bot' ? 'bg-ar-cyan/20 border border-ar-cyan/30' : 'bg-ar-navy'}`}>
                    {m.role === 'bot' ? <Bot size={13} className="text-ar-cyan" /> : <User size={13} className="text-white" />}
                  </div>
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${m.role === 'bot' ? 'bg-white border border-usb-border text-usb-subtle rounded-bl-none' : 'bg-ar-navy text-white rounded-br-none'}`}>
                    {m.text.split(/\*\*(.*?)\*\*/g).map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j} className="whitespace-pre-wrap">{part}</span>)}
                  </div>
                </div>
              ))}
              {loading && <div className="flex items-end gap-2"><div className="w-7 h-7 rounded-full bg-ar-cyan/20 border border-ar-cyan/30 flex items-center justify-center"><Bot size={13} className="text-ar-cyan" /></div><div className="bg-white border border-usb-border rounded-2xl rounded-bl-none px-4 py-3"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-usb-faint animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div></div></div>}
              <div ref={endRef} />
            </div>
            <div className="border-t border-usb-border p-3 flex gap-2 bg-white rounded-b-2xl">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Escribe tu pregunta…"
                className="flex-1 bg-usb-canvas border border-usb-border rounded-full px-4 py-2 text-xs text-usb-text placeholder-usb-faint focus:outline-none focus:border-ar-cyan focus:ring-1 focus:ring-ar-cyan/30" />
              <button onClick={send} disabled={!input.trim() || loading} className="w-9 h-9 rounded-full bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-40 flex items-center justify-center"><Send size={14} className="text-white" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Logins slider ───────────────────────────────────────────────────────────

function LoginsSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = (value / 100) * 100
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-usb-subtle">Inicios de sesión plataforma</label>
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full min-w-[52px] text-center bg-ar-navy text-white">{value}</span>
      </div>
      <div className="relative h-2 rounded-full bg-usb-border">
        <div className="absolute h-2 rounded-full bg-ar-cyan transition-all" style={{ width: `${pct}%` }} />
        <input type="range" min={0} max={100} step={1} value={value} onChange={e => onChange(parseInt(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" />
        <div className="absolute w-4 h-4 rounded-full shadow-sm -translate-y-1 -translate-x-2 bg-white border-2 border-ar-cyan pointer-events-none transition-all" style={{ left: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-1"><span className="text-[0.65rem] text-usb-faint">0</span><span className="text-[0.65rem] text-usb-faint">100</span></div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MateriaDetalle() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [course, setCourse] = useState<BackendCourse | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [courseError, setCourseError] = useState<string | null>(null)

  // Prediction state
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [predicting, setPredicting] = useState(false)
  const [predError, setPredError] = useState('')
  const [logins, setLogins] = useState(42)
  const [tutorias, setTutorias] = useState(true)
  const [asistencia, setAsistencia] = useState(85)
  const [seguimiento, setSeguimiento] = useState(3.5)
  const [parcial, setParcial] = useState(3.2)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Load course
  const loadCourse = useCallback(async () => {
    if (!courseId) return
    setLoadingCourse(true)
    setCourseError(null)
    try {
      const c = await courseService.getById(courseId)
      setCourse(c)
    } catch {
      setCourseError('No se pudo cargar la información del curso.')
    } finally {
      setLoadingCourse(false)
    }
  }, [courseId])

  useEffect(() => { void loadCourse() }, [loadCourse])

  const formData: PredictionInput = {
    promedio_asistencia: asistencia,
    promedio_seguimiento: seguimiento,
    nota_parcial_1: parcial,
    inicios_sesion_plataforma: logins,
    uso_tutorias: tutorias ? 1 : 0,
  }

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault()
    setPredicting(true)
    setPredError('')
    try {
      const data = await predictionService.predict(formData, user?.studentId)
      setResult(data as unknown as PredictionResult)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setPredError('La petición tardó demasiado. Intenta de nuevo.')
      } else {
        setPredError('No se pudo conectar con el servidor de predicción.')
      }
    } finally {
      setPredicting(false)
    }
  }

  const resetPrediction = () => { setResult(null); setPredError('') }

  return (
    <div className="min-h-screen bg-usb-canvas flex flex-col">
      <Header />

      {/* Page header */}
      <div className="bg-ar-navy border-b border-white/10 px-5 py-5">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/mis-materias')}
            className="flex items-center gap-2 text-sm font-bold text-white/50 hover:text-ar-cyan transition-colors mb-3 group"
          >
            <ArrowLeft size={16} />
            Volver a Mis Materias
          </button>
          {course && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={18} className="text-ar-cyan" />
                <h1 className="text-white font-extrabold text-xl">{course.name}</h1>
              </div>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <span className="bg-ar-cyan/20 text-ar-cyan text-xs font-bold px-2.5 py-0.5 rounded-full">{course.code}</span>
                <span className="flex items-center gap-1"><Hash size={12} />{course.credits} créditos</span>
                <span className="flex items-center gap-1"><Calendar size={12} />{course.academic_period}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8">
        {/* Loading */}
        {loadingCourse && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="text-ar-cyan animate-spin mb-4" />
            <p className="text-usb-muted text-sm font-medium">Cargando curso…</p>
          </div>
        )}

        {/* Error */}
        {courseError && (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center">
            <AlertCircle size={32} className="text-rose-400 mx-auto mb-3" />
            <p className="font-bold text-usb-text mb-2">{courseError}</p>
            <button onClick={loadCourse} className="text-ar-cyan text-sm font-bold hover:underline">Reintentar</button>
          </div>
        )}

        {/* Course loaded */}
        {!loadingCourse && !courseError && course && (
          <div className="grid lg:grid-cols-5 gap-6">

            {/* ── Left: inputs ──────────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-card border border-usb-border p-6 sticky top-20">
                <h2 className="font-bold text-usb-text mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-ar-cyan text-white flex items-center justify-center text-xs font-bold">1</span>
                  Datos académicos
                </h2>

                <form onSubmit={handlePredict}>
                  {/* Asistencia */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-usb-subtle">Asistencia a clases (%)</label>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-ar-navy text-white">{asistencia}%</span>
                    </div>
                    <input type="range" min={0} max={100} step={1} value={asistencia} onChange={e => setAsistencia(parseInt(e.target.value))}
                      className="w-full accent-ar-cyan" />
                  </div>

                  {/* Seguimiento */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-usb-subtle">Promedio seguimiento (0-5)</label>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-ar-navy text-white">{seguimiento}</span>
                    </div>
                    <input type="range" min={0} max={5} step={0.1} value={seguimiento} onChange={e => setSeguimiento(parseFloat(e.target.value))}
                      className="w-full accent-ar-cyan" />
                  </div>

                  {/* Parcial */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-usb-subtle">Nota primer parcial (0-5)</label>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-ar-navy text-white">{parcial}</span>
                    </div>
                    <input type="range" min={0} max={5} step={0.1} value={parcial} onChange={e => setParcial(parseFloat(e.target.value))}
                      className="w-full accent-ar-cyan" />
                  </div>

                  {/* Logins */}
                  <LoginsSlider value={logins} onChange={setLogins} />

                  {/* Tutorías */}
                  <div className="mb-6">
                    <label className="text-sm font-semibold text-usb-subtle mb-2 block">Uso de tutorías</label>
                    <button type="button" onClick={() => setTutorias(t => !t)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${tutorias ? 'border-ar-cyan bg-ar-cyan/5 text-ar-navy' : 'border-usb-border bg-usb-canvas text-usb-muted'}`}
                    >
                      <span>{tutorias ? '✅ Sí, uso tutorías' : '❌ No uso tutorías'}</span>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${tutorias ? 'bg-ar-cyan' : 'bg-usb-border'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${tutorias ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </button>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {predError && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"
                      >
                        <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-red-600 text-xs leading-relaxed">{predError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit" disabled={predicting}
                    className="w-full flex items-center justify-center gap-2 bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-full transition-all shadow-glow hover:shadow-lg"
                  >
                    {predicting
                      ? <><Loader2 size={16} className="animate-spin" /> Calculando…</>
                      : <><Sparkles size={16} /> Calcular mi riesgo</>}
                  </button>

                  {result && (
                    <button type="button" onClick={resetPrediction}
                      className="w-full flex items-center justify-center gap-1.5 text-usb-muted hover:text-usb-text text-xs font-medium mt-2 py-2"
                    ><RotateCcw size={12} /> Reiniciar</button>
                  )}
                </form>
              </div>
            </div>

            {/* ── Right: results ─────────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-5" ref={resultsRef}>

              {/* Empty state */}
              {!result && !predicting && (
                <div className="bg-white rounded-2xl shadow-card border border-usb-border p-12 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-usb-canvas border border-usb-border flex items-center justify-center mb-4">
                    <BarChart2 size={28} className="text-usb-faint" />
                  </div>
                  <p className="font-bold text-usb-text mb-1">Esperando tu análisis</p>
                  <p className="text-usb-muted text-sm">
                    Ajusta tus datos académicos y presiona "Calcular mi riesgo" para obtener tu predicción.
                  </p>
                </div>
              )}

              {/* Loading */}
              {predicting && (
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
                    {/* Gauge */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-card border border-usb-border p-6"
                    >
                      <h3 className="font-bold text-usb-text mb-5 flex items-center gap-2 text-base">
                        <BarChart2 size={16} className="text-ar-cyan" />
                        Nivel de Riesgo — {course.name}
                      </h3>
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-full max-w-[240px]">
                          <GaugeChart pct={result.porcentaje_riesgo} nivel={result.nivel_riesgo} />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${riskBgClass(result.nivel_riesgo)}`}>
                            {riskIcon(result.nivel_riesgo)}
                            Riesgo {result.nivel_riesgo}
                          </div>
                          <div className="bg-usb-canvas rounded-xl p-4 border border-usb-border">
                            <p className="text-xs text-usb-muted mb-1 font-medium">Probabilidad de aprobar</p>
                            <p className="text-3xl font-black text-emerald-600 tabular-nums">{fmt1(100 - result.porcentaje_riesgo)}%</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Charts */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="grid sm:grid-cols-2 gap-4"
                    >
                      <div className="bg-white rounded-2xl shadow-card border border-usb-border p-5">
                        <CompareBar title="Asistencia y Plataforma" labels={['Asistencia (%)', 'Inicios Sesión']}
                          studentVals={[asistencia, logins]} avgVals={[PROMEDIOS.asistencia, PROMEDIOS.logins]} maxY={100} stepY={20} />
                      </div>
                      <div className="bg-white rounded-2xl shadow-card border border-usb-border p-5">
                        <CompareBar title="Seguimiento y Parcial" labels={['Seguimiento', 'Parcial 1']}
                          studentVals={[seguimiento, parcial]} avgVals={[PROMEDIOS.seguimiento, PROMEDIOS.parcial]} maxY={5} stepY={1} />
                      </div>
                    </motion.div>

                    {/* AI Analysis */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="bg-white rounded-2xl shadow-card border border-usb-border p-6"
                    >
                      <h3 className="font-bold text-usb-text mb-3 flex items-center gap-2">
                        <Bot size={16} className="text-ar-cyan" />
                        Análisis del Consejero IA
                      </h3>
                      <div className="bg-usb-canvas rounded-xl p-4 border border-usb-border">
                        <MarkdownText text={result.analisis_ia} />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-ar-navy border-t border-white/10 py-4 text-center">
        <p className="text-white/30 text-xs">Academic Risk · Detalle de Materia</p>
      </footer>

      {course && <ChatBot result={result} formData={formData} />}
    </div>
  )
}
