/**
 * Grades — vista de calificaciones por curso (docente).
 * URL: /grades/:courseId
 *
 * Tabs:
 *  1. Calificaciones — tabla de estudiantes con indicadores inline
 *  2. Porcentajes    — configuración de cortes y fechas de evaluación
 *  3. Remisiones     — acceso rápido al historial del curso
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, AlertTriangle, CheckCircle2, Save, Loader2,
  RefreshCw, Users, BookOpen, Pencil, Check, X, Send,
  FileText, Calendar, TrendingDown, TrendingUp, Minus,
  Plus, Trash2, ChevronDown, Clock, Filter,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import { courseService, type BackendCourse } from '../services/courseService'
import { enrollmentService, type BackendEnrollment, type IndicatorsUpdateInput } from '../services/enrollmentService'
import {
  referralService,
  type CutConfig,
  type CutActivity,
  type ReferralCreateInput,
  type BackendReferral,
  REFERRAL_TYPE_OPTIONS,
  type ReferralType,
  type ReferralStatus,
  type AsistioValue,
} from '../services/referralService'
import type { BackendUser } from '../services/authService'
import { useToast } from '../components/Toast'

// ── Colores por umbral ────────────────────────────────────────────────────────
// Notas (0–5): ≥ 3.4 verde | 3.0–3.39 naranja | < 3.0 rojo
// Asistencia (0–100): ≥ 75 verde | 60–74 naranja | < 60 rojo

type Threshold = 'green' | 'orange' | 'red' | 'none'

function gradeThreshold(value: number | null): Threshold {
  if (value == null) return 'none'
  if (value >= 3.4) return 'green'
  if (value >= 3.0) return 'orange'
  return 'red'
}

function asistenciaThreshold(value: number | null): Threshold {
  if (value == null) return 'none'
  if (value >= 75) return 'green'
  if (value >= 60) return 'orange'
  return 'red'
}

const THRESHOLD_STYLES: Record<Threshold, { bg: string; text: string; border: string }> = {
  green:  { bg: 'rgba(0,117,74,0.09)',    text: 'var(--green-accent)', border: 'rgba(0,117,74,0.22)'  },
  orange: { bg: 'rgba(234,88,12,0.08)',   text: '#c2410c',             border: 'rgba(234,88,12,0.22)' },
  red:    { bg: 'rgba(220,38,38,0.08)',   text: '#dc2626',             border: 'rgba(220,38,38,0.22)' },
  none:   { bg: 'transparent',            text: 'var(--text-faint)',   border: 'transparent'          },
}

function ThresholdBadge({ value, format = 'note' }: { value: number | null; format?: 'note' | 'pct' }) {
  const t = format === 'pct' ? asistenciaThreshold(value) : gradeThreshold(value)
  const s = THRESHOLD_STYLES[t]
  if (value == null) return <span style={{ color: 'var(--text-faint)', fontSize: '0.72rem' }}>—</span>
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-xs font-bold tabular-nums"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {format === 'pct' ? `${value}%` : value.toFixed(2)}
    </span>
  )
}

// ── Referral status / asistió styles ─────────────────────────────────────────

const STATUS_STYLE: Record<ReferralStatus, { label: string; bg: string; text: string; border: string }> = {
  PENDIENTE: { label: 'Pendiente', bg: 'rgba(234,88,12,0.08)',  text: '#c2410c',             border: 'rgba(234,88,12,0.22)'  },
  ATENDIDA:  { label: 'Atendida',  bg: 'rgba(0,117,74,0.09)',   text: 'var(--green-accent)', border: 'rgba(0,117,74,0.22)'   },
  CANCELADA: { label: 'Cancelada', bg: 'rgba(0,0,0,0.05)',      text: 'var(--text-faint)',   border: 'rgba(0,0,0,0.12)'      },
}

const ASISTIO_ICON: Record<AsistioValue, typeof Clock> = {
  'Sin confirmar': Clock,
  'Sí':            Check,
  'No':            X,
}
const ASISTIO_COLOR: Record<AsistioValue, string> = {
  'Sin confirmar': 'var(--text-faint)',
  'Sí':            'var(--green-accent)',
  'No':            '#dc2626',
}

// ── Risk ──────────────────────────────────────────────────────────────────────

type RiskLevel = 'alto' | 'medio' | 'bajo' | null

function computeRisk(nota: number | null, asist: number | null, logins: number | null): RiskLevel {
  if (nota == null && asist == null) return null
  let score = 0
  if (nota  != null) score += nota  < 3   ? 2 : nota  < 3.4 ? 1 : 0
  if (asist != null) score += asist < 60  ? 2 : asist < 75  ? 1 : 0
  if (logins != null) score += logins < 5 ? 1 : 0
  if (score >= 3) return 'alto'
  if (score >= 1) return 'medio'
  return 'bajo'
}

const RISK_STYLE: Record<NonNullable<RiskLevel>, { label: string; bg: string; text: string; border: string }> = {
  alto:  { label: 'Alto',  bg: 'rgba(220,38,38,0.08)',   text: '#dc2626',             border: 'rgba(220,38,38,0.22)'  },
  medio: { label: 'Medio', bg: 'rgba(234,88,12,0.08)',   text: '#c2410c',             border: 'rgba(234,88,12,0.22)'  },
  bajo:  { label: 'Bajo',  bg: 'rgba(0,117,74,0.09)',    text: 'var(--green-accent)', border: 'rgba(0,117,74,0.22)'   },
}

// ── Row state ─────────────────────────────────────────────────────────────────

interface RowState {
  enrollmentId:   string
  studentId:      string
  studentName:    string
  studentEmail:   string
  asistencia:     string
  seguimiento:    string
  nota_parcial_1: string
  logins:         string
  uso_tutorias:   boolean | null
  dirty:          boolean
  saving:         boolean
  saved:          boolean
  referrals:      BackendReferral[]
}

function enrollmentToRow(student: BackendUser, e: BackendEnrollment | null): RowState {
  return {
    enrollmentId:   e?.id       ?? '',
    studentId:      student.id,
    studentName:    student.full_name,
    studentEmail:   student.email,
    asistencia:     e?.asistencia     != null ? String(e.asistencia)     : '',
    seguimiento:    e?.seguimiento    != null ? String(e.seguimiento)    : '',
    nota_parcial_1: e?.nota_parcial_1 != null ? String(e.nota_parcial_1) : '',
    logins:         e?.logins         != null ? String(e.logins)         : '',
    uso_tutorias:   e?.uso_tutorias   ?? null,
    dirty:          false,
    saving:         false,
    saved:          false,
    referrals:      [],
  }
}

// ── Editable cell (only shown in edit mode) ───────────────────────────────────

function EditCell({
  value, placeholder, min, max, step = 0.1, onChange, disabled,
}: {
  value: string; placeholder: string; min?: number; max?: number; step?: number
  onChange: (v: string) => void; disabled?: boolean
}) {
  return (
    <input
      type="number"
      value={value}
      placeholder={placeholder}
      min={min} max={max} step={step}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-center outline-none transition-all"
      style={{
        border: '1.5px solid rgba(0,117,74,0.35)',
        background: '#f0faf5',
        color: 'var(--text-dark)',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--green-accent)' }}
      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,117,74,0.35)' }}
    />
  )
}

// ── Remitir modal ─────────────────────────────────────────────────────────────

interface RemitirModalProps {
  studentName:  string
  enrollmentId: string
  onClose:      () => void
  onCreated:    (r: BackendReferral) => void
}

function RemitirModal({ studentName, enrollmentId, onClose, onCreated }: RemitirModalProps) {
  const toast = useToast()
  const today = new Date().toISOString().split('T')[0]

  const [tipo,      setTipo]      = useState<ReferralType>('Bajo rendimiento académico')
  const [otroDesc,  setOtroDesc]  = useState('')
  const [obs,       setObs]       = useState('')
  const [fecha,     setFecha]     = useState(today)
  const [saving,    setSaving]    = useState(false)

  async function handleSubmit() {
    if (obs.trim().length < 5) {
      toast.error('Observaciones muy cortas', 'Escribe al menos 5 caracteres.')
      return
    }
    if (tipo === 'Otros' && !otroDesc.trim()) {
      toast.error('Describe el motivo', 'Especifica el tipo de remisión.')
      return
    }
    setSaving(true)
    try {
      const body: ReferralCreateInput = {
        tipo_remision:      tipo,
        tipo_remision_otro: tipo === 'Otros' ? otroDesc : null,
        observaciones:      obs,
        fecha_remision:     fecha,
      }
      const created = await referralService.create(enrollmentId, body)
      toast.success('Remisión creada', `${studentName} fue remitido a consejería.`)
      onCreated(created)
      onClose()
    } catch {
      toast.error('Error al crear remisión', 'Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="relative bg-white rounded-2xl p-6 max-w-md w-full"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100">
          <X size={14} style={{ color: 'var(--text-faint)' }} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.08)' }}>
            <Send size={18} style={{ color: '#dc2626' }} />
          </div>
          <div>
            <h3 className="font-extrabold text-base" style={{ color: 'var(--text-dark)' }}>Remitir a consejería</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{studentName}</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
              Tipo de remisión *
            </label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value as ReferralType)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ border: '1px solid rgba(0,0,0,0.12)', color: 'var(--text-dark)' }}
            >
              {REFERRAL_TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {tipo === 'Otros' && (
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
                Especifica el motivo *
              </label>
              <input
                type="text"
                value={otroDesc}
                onChange={e => setOtroDesc(e.target.value)}
                placeholder="Describe el motivo de la remisión"
                className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                style={{ border: '1px solid rgba(0,0,0,0.12)' }}
              />
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
              Observaciones del docente *
            </label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Describe la situación del estudiante..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none resize-none"
              style={{ border: '1px solid rgba(0,0,0,0.12)' }}
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
              Fecha de remisión *
            </label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ border: '1px solid rgba(0,0,0,0.12)' }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ border: '1px solid rgba(0,0,0,0.12)', color: 'var(--text-muted)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: '#dc2626' }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Remitir
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Porcentajes tab ───────────────────────────────────────────────────────────

const DEFAULT_CUTS: CutConfig[] = [
  { id: 'first_cohort',  name: 'Corte 1',    percentage: 30, evaluation_date: null, activities: [] },
  { id: 'second_cohort', name: 'Corte 2',    percentage: 30, evaluation_date: null, activities: [] },
  { id: 'third_cohort',  name: 'Corte Final', percentage: 40, evaluation_date: null, activities: [] },
]

// Helper: numeric input that lets you clear and retype freely
function PctInput({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  return (
    <input
      type="text" inputMode="numeric" value={draft}
      className="w-14 text-center font-bold text-sm rounded-lg py-1.5 outline-none transition-all"
      style={{ border: '1.5px solid rgba(0,0,0,0.12)', color: 'var(--text-dark)' }}
      onChange={e => {
        const raw = e.target.value.replace(/\D/g, '')
        setDraft(raw)
        if (raw !== '') onChange(Math.min(max, parseInt(raw, 10)))
      }}
      onBlur={() => {
        const n = parseInt(draft, 10)
        const v = isNaN(n) ? 0 : Math.max(0, Math.min(max, n))
        setDraft(String(v)); onChange(v)
      }}
      onFocus={e => e.currentTarget.style.borderColor = 'var(--green-accent)'}
    />
  )
}

function PorcentajesTab({ courseId }: { courseId: string }) {
  const toast = useToast()
  const [cuts,     setCuts]     = useState<CutConfig[]>(DEFAULT_CUTS)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['first_cohort', 'second_cohort', 'third_cohort']))

  useEffect(() => {
    referralService.getEvaluationConfig(courseId)
      .then(cfg => { if (cfg.cuts.length > 0) setCuts(cfg.cuts.map(c => ({ ...c, activities: c.activities ?? [] }))) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [courseId])

  // ── Derived validation ────────────────────────────────────────────────────
  const cutsTotal = cuts.reduce((s, c) => s + c.percentage, 0)
  const cutsValid = cutsTotal === 100
  const allValid  = cutsValid && cuts.every(cut => {
    if (cut.activities.length === 0) return false
    const actTotal = cut.activities.reduce((s, a) => s + a.percentage, 0)
    return actTotal === cut.percentage
  })

  // ── Cut operations ────────────────────────────────────────────────────────
  function updateCutField(id: string, field: keyof CutConfig, value: unknown) {
    setCuts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }
  function toggleExpand(id: string) {
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  // ── Activity operations ───────────────────────────────────────────────────
  function addActivity(cutId: string) {
    setCuts(prev => prev.map(cut => {
      if (cut.id !== cutId) return cut
      const used = cut.activities.reduce((s, a) => s + a.percentage, 0)
      const remaining = Math.max(0, cut.percentage - used)
      const newAct: CutActivity = {
        id:         `act_${Date.now()}`,
        name:       'Nueva actividad',
        percentage: remaining,
      }
      return { ...cut, activities: [...cut.activities, newAct] }
    }))
  }

  function updateActivity(cutId: string, actId: string, field: 'name' | 'percentage', value: string | number) {
    setCuts(prev => prev.map(cut => {
      if (cut.id !== cutId) return cut
      return { ...cut, activities: cut.activities.map(a => a.id === actId ? { ...a, [field]: value } : a) }
    }))
  }

  function removeActivity(cutId: string, actId: string) {
    setCuts(prev => prev.map(cut => {
      if (cut.id !== cutId) return cut
      return { ...cut, activities: cut.activities.filter(a => a.id !== actId) }
    }))
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function save() {
    if (!cutsValid) {
      toast.error('Cortes inválidos', `Los cortes suman ${cutsTotal}%. Deben sumar 100%.`)
      return
    }
    if (!allValid) {
      toast.error('Actividades incompletas', 'Las actividades de cada corte deben sumar exactamente el % del corte.')
      return
    }
    setSaving(true)
    try {
      await referralService.setEvaluationConfig(courseId, cuts)
      toast.success('Configuración guardada', 'Los porcentajes de evaluación fueron actualizados.')
    } catch {
      toast.error('Error al guardar', 'Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--green-accent)' }} />
    </div>
  )

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h3 className="font-extrabold text-base" style={{ color: 'var(--text-dark)' }}>Porcentajes de evaluación</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Define el peso de cada corte y las actividades que lo componen. Las actividades de cada corte deben sumar exactamente su porcentaje.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || !allValid}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex-shrink-0"
          style={{ background: 'var(--green-accent)' }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Guardar
        </button>
      </div>

      {/* Status banner */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold mb-4"
        style={{
          background: allValid ? 'rgba(0,117,74,0.08)' : 'rgba(234,88,12,0.07)',
          border: `1px solid ${allValid ? 'rgba(0,117,74,0.22)' : 'rgba(234,88,12,0.22)'}`,
          color: allValid ? 'var(--green-accent)' : '#c2410c',
        }}
      >
        {allValid ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
        {allValid
          ? 'Distribución válida — todos los cortes están completos'
          : !cutsValid
            ? `Los cortes suman ${cutsTotal}% — deben sumar 100%`
            : 'Completa la distribución interna de cada corte'}
      </div>

      {/* Cuts summary chips */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {cuts.map(cut => {
          const actTotal = cut.activities.reduce((s, a) => s + a.percentage, 0)
          const valid    = actTotal === cut.percentage && cut.activities.length > 0
          const over     = actTotal > cut.percentage
          return (
            <div key={cut.id} className="rounded-xl px-3 py-2.5 border text-center"
              style={{
                background: valid ? 'rgba(0,117,74,0.07)' : over ? 'rgba(220,38,38,0.07)' : 'rgba(234,88,12,0.06)',
                borderColor: valid ? 'rgba(0,117,74,0.22)' : over ? 'rgba(220,38,38,0.22)' : 'rgba(234,88,12,0.20)',
              }}>
              <p className="text-[0.62rem] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-faint)' }}>{cut.name}</p>
              <p className="text-2xl font-extrabold leading-none" style={{ color: valid ? 'var(--green-accent)' : over ? '#dc2626' : '#c2410c' }}>
                {cut.percentage}%
              </p>
              <p className="text-[0.62rem] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {actTotal}/{cut.percentage} asignado
              </p>
            </div>
          )
        })}
      </div>

      {/* Cut sections */}
      <div className="space-y-3">
        {cuts.map((cut, ci) => {
          const actTotal   = cut.activities.reduce((s, a) => s + a.percentage, 0)
          const cutValid   = actTotal === cut.percentage && cut.activities.length > 0
          const cutOver    = actTotal > cut.percentage
          const fillPct    = cut.percentage > 0 ? Math.min(100, (actTotal / cut.percentage) * 100) : 0
          const isOpen     = expanded.has(cut.id)
          const remaining  = cut.percentage - actTotal

          return (
            <div key={cut.id} className="rounded-2xl overflow-hidden border bg-white"
              style={{ borderColor: 'rgba(0,0,0,0.08)', boxShadow: 'var(--shadow-card)' }}>

              {/* Cut header — click to expand */}
              <button
                onClick={() => toggleExpand(cut.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                style={{ background: isOpen ? 'rgba(0,117,74,0.02)' : 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  {/* Badge */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                    style={{
                      background: cutValid ? 'rgba(0,117,74,0.12)' : cutOver ? 'rgba(220,38,38,0.10)' : 'rgba(234,88,12,0.10)',
                      color:      cutValid ? 'var(--green-accent)'  : cutOver ? '#dc2626'               : '#c2410c',
                    }}>
                    {ci + 1 === cuts.length ? 'F' : ci + 1}
                  </div>
                  <div>
                    {/* Editable name — stop propagation so click on name doesn't toggle */}
                    <input
                      type="text"
                      value={cut.name}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateCutField(cut.id, 'name', e.target.value)}
                      className="font-extrabold text-sm bg-transparent outline-none border-b border-transparent transition-all"
                      style={{ color: 'var(--text-dark)' }}
                      onFocus={e => { e.stopPropagation(); e.currentTarget.style.borderColor = 'var(--green-accent)' }}
                      onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                    />
                    <p className="text-[0.68rem]" style={{ color: 'var(--text-muted)' }}>
                      {cut.activities.length} actividad{cut.activities.length !== 1 ? 'es' : ''}
                      {cut.evaluation_date && ` · ${cut.evaluation_date}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  {/* Cut total weight */}
                  <div className="flex items-center gap-1">
                    <PctInput
                      value={cut.percentage} max={100}
                      onChange={n => updateCutField(cut.id, 'percentage', n)}
                    />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>%</span>
                  </div>

                  {/* Fill bar */}
                  <div className="hidden sm:flex items-center gap-1.5 w-28">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                      <motion.div
                        animate={{ width: `${fillPct}%` }}
                        transition={{ duration: 0.4 }}
                        className="h-full rounded-full"
                        style={{ background: cutValid ? 'var(--green-accent)' : cutOver ? '#dc2626' : '#f97316' }}
                      />
                    </div>
                    <span className="text-[0.65rem] font-bold w-12 text-right"
                      style={{ color: cutValid ? 'var(--green-accent)' : cutOver ? '#dc2626' : '#f97316' }}>
                      {actTotal}/{cut.percentage}
                    </span>
                  </div>

                  <ChevronDown size={15} className="transition-transform duration-200 flex-shrink-0"
                    style={{ color: 'var(--text-faint)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    onClick={() => toggleExpand(cut.id)}
                  />
                </div>
              </button>

              {/* Expanded body */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t"
                    style={{ borderColor: 'rgba(0,0,0,0.07)' }}
                  >
                    <div className="p-4 space-y-2" style={{ background: 'var(--canvas-warm)' }}>
                      {/* Date field */}
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar size={12} style={{ color: 'var(--text-faint)' }} />
                        <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Fecha de evaluación:</label>
                        <input
                          type="date"
                          value={cut.evaluation_date ?? ''}
                          onChange={e => updateCutField(cut.id, 'evaluation_date', e.target.value || null)}
                          className="px-2 py-1 rounded-lg text-xs border outline-none"
                          style={{ border: '1px solid rgba(0,0,0,0.12)', color: 'var(--text-dark)' }}
                        />
                      </div>

                      {/* Activities */}
                      <AnimatePresence>
                        {cut.activities.map(act => (
                          <motion.div key={act.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border"
                            style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                          >
                            <div className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ background: 'var(--green-accent)', opacity: 0.35 }} />
                            <input
                              type="text"
                              value={act.name}
                              onChange={e => updateActivity(cut.id, act.id, 'name', e.target.value)}
                              className="flex-1 bg-transparent text-sm font-medium outline-none"
                              style={{ color: 'var(--text-dark)' }}
                            />
                            <div className="flex items-center gap-1">
                              <PctInput
                                value={act.percentage}
                                max={cut.percentage}
                                onChange={n => updateActivity(cut.id, act.id, 'percentage', n)}
                              />
                              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>%</span>
                            </div>
                            <button
                              onClick={() => removeActivity(cut.id, act.id)}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--text-faint)' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.07)' }}
                              onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.background = '' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {cut.activities.length === 0 && (
                        <p className="text-center text-xs py-2" style={{ color: 'var(--text-faint)' }}>
                          Sin actividades — agrega al menos una para definir la distribución del corte
                        </p>
                      )}

                      {/* Add activity button */}
                      <button
                        onClick={() => addActivity(cut.id)}
                        disabled={remaining <= 0}
                        className="flex items-center gap-2 text-sm font-semibold border-2 border-dashed rounded-xl px-4 py-2.5 w-full justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          color:       remaining <= 0 ? 'var(--text-faint)'  : 'var(--green-accent)',
                          borderColor: remaining <= 0 ? 'rgba(0,0,0,0.10)'  : 'rgba(0,117,74,0.35)',
                        }}
                      >
                        <Plus size={14} />
                        {remaining <= 0
                          ? `${cut.name} completo (${cut.percentage}%)`
                          : `Agregar actividad · quedan ${remaining}%`}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Note */}
      <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-faint)' }}>
        Recuerda ingresar las evaluaciones de acuerdo a la programación realizada con el grupo.
      </p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Tab = 'grades' | 'porcentajes' | 'remisiones'

export default function GradesPage() {
  const { courseId }      = useParams<{ courseId: string }>()
  const navigate          = useNavigate()
  const [searchParams]    = useSearchParams()
  const { user }          = useAuth()
  const toast             = useToast()

  const [course,      setCourse]      = useState<BackendCourse | null>(null)
  const [rows,        setRows]        = useState<RowState[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [activeTab,   setActiveTab]   = useState<Tab>(() => {
    const t = searchParams.get('tab')
    return (t === 'remisiones' || t === 'porcentajes') ? t : 'grades'
  })
  const [editMode,    setEditMode]    = useState(false)
  const [remitirRow,  setRemitirRow]  = useState<RowState | null>(null)

  // ── Remisiones tab state ───────────────────────────────────────────────────
  const [refFilter,       setRefFilter]       = useState<ReferralStatus | 'TODAS'>('TODAS')
  const [refSaving,       setRefSaving]       = useState<Set<string>>(new Set())
  const [obsEditing,      setObsEditing]      = useState<string | null>(null)
  const [obsValue,        setObsValue]        = useState('')
  // Modal "Marcar como atendida" — requiere mensaje obligatorio
  const [atenderRef,      setAtenderRef]      = useState<BackendReferral | null>(null)
  const [atenderStudent,  setAtenderStudent]  = useState('')
  const [atenderObs,      setAtenderObs]      = useState('')
  const [atenderSaving,   setAtenderSaving]   = useState(false)
  // Confirmación inline de cancelación
  const [confirmCancel,   setConfirmCancel]   = useState<string | null>(null) // referral id

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!courseId || !user?.professorId) return
    setLoading(true); setError(null)
    try {
      const [courseData, students] = await Promise.all([
        courseService.getById(courseId),
        courseService.listCourseStudents(courseId, user.professorId),
      ])
      setCourse(courseData)

      const [enrollResults, referralResults] = await Promise.all([
        Promise.allSettled(students.map(s => enrollmentService.listByStudent(s.id))),
        Promise.allSettled(students.map(async s => {
          // get enrollment then referrals
          const enrollments = await enrollmentService.listByStudent(s.id)
          const e = enrollments.find(en => en.course_id === courseId)
          if (!e) return { studentId: s.id, referrals: [] }
          const refs = await referralService.listByEnrollment(e.id).catch(() => [])
          return { studentId: s.id, referrals: refs }
        })),
      ])

      const newRows: RowState[] = students.map((student, i) => {
        const er = enrollResults[i]
        const enrollments = er.status === 'fulfilled' ? er.value : []
        const enrollment  = enrollments.find(e => e.course_id === courseId) ?? null

        const rr = referralResults[i]
        const refs = rr.status === 'fulfilled' ? rr.value.referrals : []

        return { ...enrollmentToRow(student, enrollment), referrals: refs }
      })

      setRows(newRows)
    } catch {
      setError('No se pudieron cargar los datos del curso.')
    } finally {
      setLoading(false)
    }
  }, [courseId, user?.professorId])

  useEffect(() => { void load() }, [load])

  // ── Field update ───────────────────────────────────────────────────────────

  function updateField(index: number, field: keyof RowState, value: string | boolean | null) {
    setRows(prev => prev.map((r, i) =>
      i !== index ? r : { ...r, [field]: value, dirty: true, saved: false }
    ))
  }

  // ── Save row ───────────────────────────────────────────────────────────────

  async function saveRow(index: number) {
    const row = rows[index]
    if (!row.enrollmentId) { toast.error('Sin inscripción', 'Estudiante sin inscripción activa.'); return }
    setRows(prev => prev.map((r, i) => i === index ? { ...r, saving: true } : r))

    const payload: IndicatorsUpdateInput = {}
    if (row.asistencia     !== '') payload.asistencia     = parseFloat(row.asistencia)
    if (row.seguimiento    !== '') payload.seguimiento    = parseFloat(row.seguimiento)
    if (row.nota_parcial_1 !== '') payload.nota_parcial_1 = parseFloat(row.nota_parcial_1)
    if (row.logins         !== '') payload.logins         = parseInt(row.logins, 10)
    if (row.uso_tutorias   !== null) payload.uso_tutorias = row.uso_tutorias

    try {
      await enrollmentService.updateIndicators(row.enrollmentId, payload)
      setRows(prev => prev.map((r, i) =>
        i !== index ? r : { ...r, saving: false, dirty: false, saved: true }
      ))
      setTimeout(() => {
        setRows(prev => prev.map((r, i) => i !== index ? r : { ...r, saved: false }))
      }, 2000)
      toast.success('Guardado', `Notas de ${row.studentName} actualizadas.`)
    } catch {
      setRows(prev => prev.map((r, i) => i === index ? { ...r, saving: false } : r))
      toast.error('Error al guardar', 'Intenta de nuevo.')
    }
  }

  async function saveAll() {
    const dirty = rows.map((r, i) => i).filter(i => rows[i].dirty && rows[i].enrollmentId)
    if (!dirty.length) { toast.info('Sin cambios', 'No hay notas pendientes.'); return }
    await Promise.allSettled(dirty.map(saveRow))
  }

  // ── Referral helpers ───────────────────────────────────────────────────────

  function patchReferralInRows(updated: BackendReferral) {
    setRows(prev => prev.map(row => ({
      ...row,
      referrals: row.referrals.map(r => r.id === updated.id ? updated : r),
    })))
  }

  async function updateRefStatus(refId: string, status: ReferralStatus) {
    setRefSaving(prev => new Set([...prev, refId]))
    try {
      const updated = await referralService.update(refId, { status })
      patchReferralInRows(updated)
      toast.success('Estado actualizado', `Remisión marcada como ${STATUS_STYLE[status].label.toLowerCase()}.`)
    } catch { toast.error('Error', 'No se pudo actualizar el estado.') }
    finally { setRefSaving(prev => { const s = new Set(prev); s.delete(refId); return s }) }
  }

  async function updateRefAsistio(refId: string, asistio: AsistioValue) {
    setRefSaving(prev => new Set([...prev, refId]))
    try {
      const updated = await referralService.update(refId, { asistio })
      patchReferralInRows(updated)
    } catch { toast.error('Error', 'No se pudo actualizar.') }
    finally { setRefSaving(prev => { const s = new Set(prev); s.delete(refId); return s }) }
  }

  async function saveRefObs(refId: string) {
    try {
      const updated = await referralService.update(refId, { observaciones_remision: obsValue })
      patchReferralInRows(updated)
      setObsEditing(null)
      toast.success('Guardado', 'Observaciones de consejería actualizadas.')
    } catch { toast.error('Error', 'No se pudo guardar.') }
  }

  async function confirmAtender() {
    if (!atenderRef || !atenderObs.trim()) return
    setAtenderSaving(true)
    try {
      const updated = await referralService.update(atenderRef.id, {
        status: 'ATENDIDA',
        observaciones_remision: atenderObs.trim(),
      })
      patchReferralInRows(updated)
      toast.success('Remisión atendida', `La remisión de ${atenderStudent} fue marcada como atendida.`)
      setAtenderRef(null)
      setAtenderObs('')
    } catch { toast.error('Error', 'No se pudo marcar como atendida.') }
    finally { setAtenderSaving(false) }
  }

  async function doCancel(refId: string, studentName: string) {
    setRefSaving(prev => new Set([...prev, refId]))
    try {
      const updated = await referralService.update(refId, { status: 'CANCELADA' })
      patchReferralInRows(updated)
      setConfirmCancel(null)
      toast.success('Remisión cancelada', `La remisión de ${studentName} fue cancelada.`)
    } catch { toast.error('Error', 'No se pudo cancelar.') }
    finally { setRefSaving(prev => { const s = new Set(prev); s.delete(refId); return s }) }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const atRiskRows    = rows.filter(r => {
    const nota  = r.nota_parcial_1 !== '' ? parseFloat(r.nota_parcial_1) : null
    const asist = r.asistencia     !== '' ? parseFloat(r.asistencia)     : null
    const logs  = r.logins         !== '' ? parseInt(r.logins, 10)       : null
    return computeRisk(nota, asist, logs) === 'alto'
  })
  const withData      = rows.filter(r => r.nota_parcial_1 !== '' || r.asistencia !== '')
  const pct           = rows.length > 0 ? Math.round((withData.length / rows.length) * 100) : 0
  const dirtyCount    = rows.filter(r => r.dirty).length
  const referralCount = rows.reduce((s, r) => s + r.referrals.length, 0)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--canvas-warm)' }}>
      <Header />

      {/* Breadcrumb */}
      <div className="border-b px-5 py-2.5 flex items-center justify-between" style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.08)' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors no-tap"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--green-accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = '')}
        >
          <ChevronLeft size={14} />
          Mis materias
        </button>
        {course && (
          <span className="text-xs font-bold" style={{ color: 'var(--green-accent)' }}>
            {course.code} · {course.name}
          </span>
        )}
      </div>

      <main className="flex-1 px-5 py-6 max-w-7xl mx-auto w-full">

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--green-light)', borderTopColor: 'var(--green-accent)' }} />
          </div>
        )}

        {!loading && error && (
          <div className="p-6 bg-white rounded-2xl border border-red-200 text-center">
            <p className="text-sm text-red-600 font-semibold mb-3">{error}</p>
            <button onClick={load} className="flex items-center gap-2 text-sm font-bold mx-auto px-4 py-2 rounded-xl text-white" style={{ background: 'var(--green-accent)' }}>
              <RefreshCw size={13} /> Reintentar
            </button>
          </div>
        )}

        {!loading && !error && course && (
          <>
            {/* Course header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 mb-5"
              style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,117,74,0.10)', color: 'var(--green-accent)' }}>
                      <BookOpen size={10} />{course.code}
                    </span>
                    <span className="text-[0.65rem] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--canvas-warm)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-faint)' }}>
                      {course.academic_period}
                    </span>
                  </div>
                  <h2 className="font-extrabold text-lg leading-tight" style={{ color: 'var(--text-dark)' }}>{course.name}</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.name}</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-center">
                    <p className="text-xl font-extrabold" style={{ color: 'var(--text-dark)' }}>{rows.length}</p>
                    <p className="text-[0.62rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Estudiantes</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="text-center">
                    <p className="text-xl font-extrabold" style={{ color: 'var(--green-accent)' }}>{pct}%</p>
                    <p className="text-[0.62rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Con notas</p>
                  </div>
                  {referralCount > 0 && (
                    <>
                      <div className="w-px h-8 bg-gray-200" />
                      <div className="text-center">
                        <p className="text-xl font-extrabold" style={{ color: '#dc2626' }}>{referralCount}</p>
                        <p className="text-[0.62rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Remisiones</p>
                      </div>
                    </>
                  )}
                  <div className="w-px h-8 bg-gray-200" />
                  {atRiskRows.length > 0 ? (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.20)' }}>
                      <AlertTriangle size={14} style={{ color: '#dc2626' }} />
                      <div>
                        <p className="font-bold text-xs" style={{ color: '#dc2626' }}>{atRiskRows.length} en riesgo alto</p>
                        <p className="text-[0.62rem]" style={{ color: '#dc2626', opacity: 0.75 }}>Requieren atención</p>
                      </div>
                    </div>
                  ) : withData.length > 0 ? (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(0,117,74,0.07)', border: '1px solid rgba(0,117,74,0.20)' }}>
                      <CheckCircle2 size={14} style={{ color: 'var(--green-accent)' }} />
                      <div>
                        <p className="font-bold text-xs" style={{ color: 'var(--green-accent)' }}>Sin riesgo alto</p>
                        <p className="text-[0.62rem]" style={{ color: 'var(--green-accent)', opacity: 0.75 }}>Grupo estable</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Progreso de ingreso de notas</span>
                  <span className="text-[0.75rem] font-extrabold" style={{ color: 'var(--green-accent)' }}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full" style={{ background: 'var(--green-accent)' }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 w-fit mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              {([
                { key: 'grades',      label: 'Calificaciones',            icon: Users },
                { key: 'porcentajes', label: 'Porcentajes de evaluación', icon: FileText },
                { key: 'remisiones',  label: `Remisiones${referralCount > 0 ? ` (${referralCount})` : ''}`, icon: Send },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={activeTab === tab.key
                    ? { background: 'var(--green-accent)', color: '#fff' }
                    : { color: 'var(--text-muted)' }}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Calificaciones ── */}
            {activeTab === 'grades' && (
              <motion.div key="grades" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

                {/* Edit mode bar */}
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {/* Pencil toggle */}
                    <button
                      onClick={() => setEditMode(v => !v)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all"
                      style={editMode
                        ? { background: 'var(--green-accent)', color: '#fff', boxShadow: 'var(--shadow-card)' }
                        : { background: '#fff', color: 'var(--text-muted)', border: '1px solid rgba(0,0,0,0.12)' }}
                    >
                      <Pencil size={13} />
                      {editMode ? 'Editando' : 'Editar notas'}
                    </button>

                    {editMode && (
                      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                        Modifica los valores y guarda fila a fila o todo a la vez
                      </span>
                    )}
                  </div>

                  {dirtyCount > 0 && (
                    <button
                      onClick={saveAll}
                      className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl text-white"
                      style={{ background: 'var(--green-accent)' }}
                    >
                      <Save size={13} />
                      Guardar todo ({dirtyCount})
                    </button>
                  )}
                </div>

                {/* Leyenda colores */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  {[
                    { t: 'green',  label: '≥ 3.4 / ≥ 75%' },
                    { t: 'orange', label: '3.0–3.3 / 60–74%' },
                    { t: 'red',    label: '< 3.0 / < 60%' },
                  ].map(({ t, label }) => {
                    const s = THRESHOLD_STYLES[t as Threshold]
                    return (
                      <span key={t} className="flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: 'var(--text-muted)' }}>
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: s.bg, border: `1px solid ${s.border}` }} />
                        {label}
                      </span>
                    )
                  })}
                </div>

                {rows.length === 0 ? (
                  <div className="p-12 bg-white rounded-2xl text-center" style={{ border: '2px dashed rgba(0,0,0,0.10)' }}>
                    <Users size={24} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                    <p className="font-bold" style={{ color: 'var(--text-dark)' }}>No hay estudiantes en este curso</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr style={{ background: 'var(--canvas-warm)', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
                            <th className="text-left px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Estudiante</th>
                            {['Asistencia %', 'Seguimiento', 'Parcial 1', 'Logins LMS', 'Tutorías', 'Riesgo', 'Acciones'].map(h => (
                              <th key={h} className="px-3 py-3 text-[0.65rem] font-extrabold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)', minWidth: h === 'Acciones' ? 110 : 80 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => {
                            const nota  = row.nota_parcial_1 !== '' ? parseFloat(row.nota_parcial_1) : null
                            const asist = row.asistencia     !== '' ? parseFloat(row.asistencia)     : null
                            const logs  = row.logins         !== '' ? parseInt(row.logins, 10)       : null
                            const seg   = row.seguimiento    !== '' ? parseFloat(row.seguimiento)    : null
                            const risk  = computeRisk(nota, asist, logs)
                            const rc    = risk ? RISK_STYLE[risk] : null
                            const hasPendingRef = row.referrals.some(r => r.status === 'PENDIENTE')

                            return (
                              <motion.tr key={row.studentId}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.025 }}
                                style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: row.dirty ? 'rgba(0,117,74,0.015)' : 'transparent' }}>

                                {/* Student */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                      style={{ background: 'rgba(0,117,74,0.10)', color: 'var(--green-accent)' }}>
                                      {row.studentName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text-dark)' }}>{row.studentName}</p>
                                      <p className="text-[0.6rem]" style={{ color: 'var(--text-faint)' }}>{row.studentEmail}</p>
                                      {hasPendingRef && (
                                        <span className="inline-flex items-center gap-0.5 text-[0.58rem] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                                          style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
                                          <Send size={8} /> Remitido
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Asistencia */}
                                <td className="px-3 py-3 text-center">
                                  {editMode
                                    ? <EditCell value={row.asistencia} placeholder="0–100" min={0} max={100} step={1} onChange={v => updateField(i, 'asistencia', v)} disabled={row.saving} />
                                    : <ThresholdBadge value={asist} format="pct" />
                                  }
                                </td>

                                {/* Seguimiento */}
                                <td className="px-3 py-3 text-center">
                                  {editMode
                                    ? <EditCell value={row.seguimiento} placeholder="0–5" min={0} max={5} onChange={v => updateField(i, 'seguimiento', v)} disabled={row.saving} />
                                    : <ThresholdBadge value={seg} format="note" />
                                  }
                                </td>

                                {/* Parcial 1 */}
                                <td className="px-3 py-3 text-center">
                                  {editMode
                                    ? <EditCell value={row.nota_parcial_1} placeholder="0–5" min={0} max={5} onChange={v => updateField(i, 'nota_parcial_1', v)} disabled={row.saving} />
                                    : <ThresholdBadge value={nota} format="note" />
                                  }
                                </td>

                                {/* Logins */}
                                <td className="px-3 py-3 text-center">
                                  {editMode
                                    ? <EditCell value={row.logins} placeholder="0+" min={0} step={1} onChange={v => updateField(i, 'logins', v)} disabled={row.saving} />
                                    : logs != null
                                      ? <span className="text-xs font-bold tabular-nums" style={{ color: logs < 5 ? '#dc2626' : 'var(--text-dark)' }}>{logs}</span>
                                      : <span style={{ color: 'var(--text-faint)', fontSize: '0.72rem' }}>—</span>
                                  }
                                </td>

                                {/* Tutorías */}
                                <td className="px-3 py-3 text-center">
                                  {editMode ? (
                                    <button
                                      disabled={row.saving}
                                      onClick={() => updateField(i, 'uso_tutorias', row.uso_tutorias === null ? true : !row.uso_tutorias)}
                                      className="mx-auto flex items-center justify-center w-8 h-8 rounded-full transition-all"
                                      style={{
                                        background: row.uso_tutorias === true ? 'rgba(0,117,74,0.12)' : row.uso_tutorias === false ? 'rgba(220,38,38,0.08)' : 'rgba(0,0,0,0.06)',
                                        border: '1px solid ' + (row.uso_tutorias === true ? 'rgba(0,117,74,0.25)' : row.uso_tutorias === false ? 'rgba(220,38,38,0.20)' : 'rgba(0,0,0,0.10)'),
                                      }}
                                    >
                                      {row.uso_tutorias === true ? <Check size={12} style={{ color: 'var(--green-accent)' }} /> : row.uso_tutorias === false ? <X size={12} style={{ color: '#dc2626' }} /> : <Minus size={10} style={{ color: 'var(--text-faint)' }} />}
                                    </button>
                                  ) : (
                                    row.uso_tutorias === null
                                      ? <span style={{ color: 'var(--text-faint)', fontSize: '0.72rem' }}>—</span>
                                      : row.uso_tutorias
                                        ? <Check size={14} style={{ color: 'var(--green-accent)' }} />
                                        : <X size={14} style={{ color: '#dc2626' }} />
                                  )}
                                </td>

                                {/* Riesgo */}
                                <td className="px-3 py-3 text-center">
                                  {rc ? (
                                    <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold px-2.5 py-1 rounded-full"
                                      style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
                                      {risk === 'alto' && <TrendingDown size={9} />}
                                      {risk === 'bajo' && <TrendingUp size={9} />}
                                      {rc.label}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-faint)', fontSize: '0.68rem' }}>Sin datos</span>
                                  )}
                                </td>

                                {/* Acciones */}
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-1.5 justify-center flex-wrap">
                                    {editMode && (
                                      <button
                                        onClick={() => saveRow(i)}
                                        disabled={!row.dirty || row.saving || !row.enrollmentId}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.65rem] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{ background: row.saved ? 'rgba(0,117,74,0.12)' : 'var(--green-accent)', color: row.saved ? 'var(--green-accent)' : '#fff' }}
                                      >
                                        {row.saving ? <Loader2 size={10} className="animate-spin" /> : row.saved ? <Check size={10} /> : <Save size={10} />}
                                        {row.saved ? 'OK' : 'Guardar'}
                                      </button>
                                    )}
                                    {hasPendingRef ? (
                                      <span
                                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[0.65rem] font-bold"
                                        style={{ background: 'rgba(220,38,38,0.05)', color: 'rgba(220,38,38,0.45)', border: '1px solid rgba(220,38,38,0.12)', cursor: 'default' }}
                                        title="Ya tiene una remisión pendiente"
                                      >
                                        <Send size={10} />
                                        Remitido
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => setRemitirRow(row)}
                                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[0.65rem] font-bold transition-all"
                                        style={{ background: 'rgba(220,38,38,0.07)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.18)' }}
                                        title="Remitir a consejería"
                                      >
                                        <Send size={10} />
                                        Remitir
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-faint)', background: 'var(--canvas-warm)' }}>
                      Escala: 0.0–5.0 · Mínimo aprobatorio: 3.0 · Verde ≥ 3.4 · Naranja 3.0–3.39 · Rojo &lt; 3.0
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Tab: Porcentajes ── */}
            {activeTab === 'porcentajes' && (
              <motion.div key="porcentajes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                className="bg-white rounded-2xl" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <PorcentajesTab courseId={courseId!} />
              </motion.div>
            )}

            {/* ── Tab: Remisiones ── */}
            {activeTab === 'remisiones' && (() => {
              // Flatten all referrals keeping student context, sorted newest first
              const allRefs = rows
                .flatMap(row => row.referrals.map(ref => ({ row, ref })))
                .sort((a, b) => new Date(b.ref.created_at).getTime() - new Date(a.ref.created_at).getTime())

              const refCounts = {
                TODAS:     allRefs.length,
                PENDIENTE: allRefs.filter(x => x.ref.status === 'PENDIENTE').length,
                ATENDIDA:  allRefs.filter(x => x.ref.status === 'ATENDIDA').length,
                CANCELADA: allRefs.filter(x => x.ref.status === 'CANCELADA').length,
              }
              const filteredRefs = refFilter === 'TODAS'
                ? allRefs
                : allRefs.filter(x => x.ref.status === refFilter)

              return (
                <motion.div key="remisiones" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div>
                      <h3 className="font-extrabold text-base" style={{ color: 'var(--text-dark)' }}>Remisiones</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Gestiona el seguimiento de estudiantes remitidos a consejería.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/referrals/${courseId}`)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold flex-shrink-0"
                      style={{ background: '#fff', color: 'var(--text-muted)', border: '1px solid rgba(0,0,0,0.12)' }}
                    >
                      <FileText size={12} />
                      Ver historial
                    </button>
                  </div>

                  {/* Filter chips */}
                  {allRefs.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {(['TODAS', 'PENDIENTE', 'ATENDIDA', 'CANCELADA'] as const).map(f => {
                        const sc = f === 'TODAS' ? null : STATUS_STYLE[f]
                        const active = refFilter === f
                        return (
                          <button
                            key={f}
                            onClick={() => setRefFilter(f)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                            style={active
                              ? { background: sc ? sc.bg : 'rgba(0,117,74,0.09)', color: sc ? sc.text : 'var(--green-accent)', border: `1px solid ${sc ? sc.border : 'rgba(0,117,74,0.22)'}` }
                              : { background: '#fff', color: 'var(--text-muted)', border: '1px solid rgba(0,0,0,0.10)' }
                            }
                          >
                            <Filter size={9} />
                            {f === 'TODAS' ? 'Todas' : STATUS_STYLE[f].label}
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[0.58rem] font-extrabold" style={{ background: 'rgba(0,0,0,0.08)' }}>
                              {refCounts[f]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Empty state */}
                  {allRefs.length === 0 && (
                    <div className="p-10 bg-white rounded-2xl text-center" style={{ border: '2px dashed rgba(0,0,0,0.10)' }}>
                      <Send size={22} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                      <p className="font-bold" style={{ color: 'var(--text-dark)' }}>No hay remisiones en este curso</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Usa el botón "Remitir" en la tabla de calificaciones para crear una.
                      </p>
                    </div>
                  )}

                  {/* Referral cards */}
                  <div className="space-y-3">
                    {filteredRefs.map(({ row, ref }, i) => {
                      const sc          = STATUS_STYLE[ref.status]
                      const AsistioIcon = ASISTIO_ICON[ref.asistio]
                      const isSaving    = refSaving.has(ref.id)
                      const isEditObs   = obsEditing === ref.id

                      return (
                        <motion.div
                          key={ref.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="bg-white rounded-2xl p-5"
                          style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.06)' }}
                        >
                          {/* Student + tipo + fecha */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                style={{ background: 'rgba(0,117,74,0.10)', color: 'var(--green-accent)' }}>
                                {row.studentName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-extrabold text-sm leading-tight" style={{ color: 'var(--text-dark)' }}>
                                  {row.studentName}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  {ref.tipo_remision === 'Otros' ? ref.tipo_remision_otro : ref.tipo_remision}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Calendar size={10} style={{ color: 'var(--text-faint)' }} />
                                  <span className="text-[0.65rem]" style={{ color: 'var(--text-faint)' }}>{ref.fecha_remision}</span>
                                </div>
                              </div>
                            </div>
                            {/* Current status badge + asistió */}
                            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                              <span className="text-[0.65rem] font-bold px-2.5 py-1 rounded-full"
                                style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                                {sc.label}
                              </span>
                              <span className="flex items-center gap-1 text-[0.65rem] font-semibold"
                                style={{ color: ASISTIO_COLOR[ref.asistio] }}>
                                <AsistioIcon size={11} />
                                {ref.asistio}
                              </span>
                            </div>
                          </div>

                          {/* Observaciones del docente */}
                          <div className="bg-gray-50 rounded-xl px-4 py-2.5 mb-3" style={{ borderLeft: '3px solid rgba(0,0,0,0.10)' }}>
                            <p className="text-[0.62rem] font-extrabold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-faint)' }}>
                              Observaciones del docente
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ref.observaciones}</p>
                          </div>

                          {/* ── Acciones — máquina de estados ── */}
                          {isSaving ? (
                            <div className="flex items-center gap-2 py-2">
                              <Loader2 size={13} className="animate-spin" style={{ color: 'var(--green-accent)' }} />
                              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Guardando...</span>
                            </div>
                          ) : ref.status === 'PENDIENTE' ? (
                            /* ── Estado PENDIENTE: se puede atender o cancelar ── */
                            <div className="space-y-2.5">
                              {/* Asistió (editable solo en pendiente) */}
                              <div>
                                <p className="text-[0.62rem] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                                  ¿Asistió a consejería?
                                </p>
                                <div className="flex gap-1.5 flex-wrap">
                                  {(['Sin confirmar', 'Sí', 'No'] as AsistioValue[]).map(a => (
                                    <button
                                      key={a}
                                      onClick={() => updateRefAsistio(ref.id, a)}
                                      className="flex items-center gap-1 text-[0.65rem] font-bold px-3 py-1.5 rounded-full transition-all"
                                      style={{
                                        background: ref.asistio === a ? (a === 'Sí' ? 'rgba(0,117,74,0.09)' : a === 'No' ? 'rgba(220,38,38,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                        color: ref.asistio === a ? ASISTIO_COLOR[a] : 'var(--text-faint)',
                                        border: `1px solid ${ref.asistio === a ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.08)'}`,
                                      }}
                                    >
                                      {React.createElement(ASISTIO_ICON[a], { size: 10 })}
                                      {a}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Acciones de transición */}
                              {confirmCancel === ref.id ? (
                                /* Confirmación de cancelación inline */
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                  style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)' }}>
                                  <span className="text-xs font-semibold flex-1" style={{ color: '#dc2626' }}>
                                    ¿Confirmar cancelación de esta remisión?
                                  </span>
                                  <button
                                    onClick={() => doCancel(ref.id, row.studentName)}
                                    className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                                    style={{ background: '#dc2626' }}
                                  >Sí, cancelar</button>
                                  <button
                                    onClick={() => setConfirmCancel(null)}
                                    className="px-3 py-1 rounded-lg text-xs font-bold"
                                    style={{ border: '1px solid rgba(0,0,0,0.12)', color: 'var(--text-muted)' }}
                                  >No</button>
                                </div>
                              ) : (
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => { setAtenderRef(ref); setAtenderStudent(row.studentName); setAtenderObs('') }}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                                    style={{ background: 'var(--green-accent)' }}
                                  >
                                    <Check size={12} /> Marcar como atendida
                                  </button>
                                  <button
                                    onClick={() => setConfirmCancel(ref.id)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                                    style={{ background: 'rgba(220,38,38,0.07)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.18)' }}
                                  >
                                    <X size={12} /> Cancelar remisión
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* ── Estado ATENDIDA o CANCELADA: solo lectura ── */
                            <div className="space-y-2">
                              {/* Observaciones de consejería (read-only o editable si atendida) */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[0.62rem] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                                    Observaciones de consejería
                                  </p>
                                  {ref.status === 'ATENDIDA' && !isEditObs && (
                                    <button
                                      onClick={() => { setObsEditing(ref.id); setObsValue(ref.observaciones_remision ?? '') }}
                                      className="text-[0.62rem] font-bold px-2 py-0.5 rounded-full"
                                      style={{ background: 'rgba(0,117,74,0.08)', color: 'var(--green-accent)' }}
                                    >Editar</button>
                                  )}
                                </div>
                                {isEditObs && ref.status === 'ATENDIDA' ? (
                                  <div>
                                    <textarea
                                      value={obsValue}
                                      onChange={e => setObsValue(e.target.value)}
                                      rows={2}
                                      placeholder="Observaciones del consejero..."
                                      className="w-full px-3 py-2 rounded-xl text-xs border outline-none resize-none"
                                      style={{ border: '1px solid rgba(0,117,74,0.35)', background: '#f0faf5' }}
                                    />
                                    <div className="flex gap-2 mt-1.5">
                                      <button onClick={() => saveRefObs(ref.id)} className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ background: 'var(--green-accent)' }}>Guardar</button>
                                      <button onClick={() => setObsEditing(null)} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ border: '1px solid rgba(0,0,0,0.12)', color: 'var(--text-muted)' }}>Cancelar</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs italic" style={{ color: ref.observaciones_remision ? 'var(--text-muted)' : 'var(--text-faint)' }}>
                                    {ref.observaciones_remision ?? 'Sin observaciones de consejería.'}
                                  </p>
                                )}
                              </div>
                              <p className="text-[0.62rem]" style={{ color: 'var(--text-faint)' }}>
                                {ref.status === 'ATENDIDA' ? '✅ Remisión atendida — estado final.' : '🚫 Remisión cancelada — estado final.'}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })()}
          </>
        )}
      </main>

      {/* Remitir modal */}
      <AnimatePresence>
        {remitirRow && (
          <RemitirModal
            studentName={remitirRow.studentName}
            enrollmentId={remitirRow.enrollmentId}
            onClose={() => setRemitirRow(null)}
            onCreated={newRef => {
              setRows(prev => prev.map(r =>
                r.studentId === remitirRow.studentId
                  ? { ...r, referrals: [newRef, ...r.referrals] }
                  : r
              ))
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal: Marcar como atendida (requiere mensaje obligatorio) */}
      <AnimatePresence>
        {atenderRef && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => { if (!atenderSaving) { setAtenderRef(null); setAtenderObs('') } }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative bg-white rounded-2xl p-6 max-w-md w-full"
              style={{ boxShadow: 'var(--shadow-modal)' }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,117,74,0.10)' }}>
                  <Check size={18} style={{ color: 'var(--green-accent)' }} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base" style={{ color: 'var(--text-dark)' }}>
                    Marcar como atendida
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{atenderStudent}</p>
                </div>
              </div>

              {/* Mensaje obligatorio */}
              <div className="mb-4">
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  ¿Cómo se atendió esta novedad? <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  value={atenderObs}
                  onChange={e => setAtenderObs(e.target.value)}
                  rows={4}
                  placeholder="Ej: El estudiante asistió a consejería y se llegó a un acuerdo de entregar un taller compensatorio para la semana siguiente..."
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
                  style={{
                    border: '1.5px solid rgba(0,0,0,0.12)',
                    color: 'var(--text-dark)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--green-accent)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)' }}
                />
                <p className="text-[0.65rem] mt-1" style={{ color: 'var(--text-faint)' }}>
                  Este mensaje quedará registrado como observación de consejería.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { if (!atenderSaving) { setAtenderRef(null); setAtenderObs('') } }}
                  disabled={atenderSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ border: '1px solid rgba(0,0,0,0.12)', color: 'var(--text-muted)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAtender}
                  disabled={atenderSaving || !atenderObs.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'var(--green-accent)' }}
                >
                  {atenderSaving
                    ? <><Loader2 size={13} className="animate-spin" /> Guardando...</>
                    : <><Check size={13} /> Confirmar atención</>
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
