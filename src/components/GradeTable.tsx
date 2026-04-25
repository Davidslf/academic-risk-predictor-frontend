import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, History, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import type { Course, Grade, Referral, ReferralType, ReferralAttendance } from '../types'
import { students as allStudents } from '../data/mockData'
import { gradeColor, getRisk } from '../utils/gradeCalculator'
import { useGradeCalculation } from '../hooks/useGradeCalculation'
import { useAuth } from '../context/AuthContext'
import RiskBadge from './RiskBadge'

// ─── Risk bar ─────────────────────────────────────────────────────────────────

function riskPercent(grade: number | null): number | null {
  if (grade === null) return null
  return Math.max(0, Math.min(100, Math.round((1 - grade / 5) * 100)))
}

function RiskBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-usb-border text-xs font-mono">—</span>
  const color     = pct >= 60 ? 'bg-risk-high' : pct >= 35 ? 'bg-risk-med' : 'bg-risk-low'
  const textColor = pct >= 60 ? 'text-risk-high' : pct >= 35 ? 'text-risk-med' : 'text-risk-low'
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[64px]">
      <span className={`text-[0.75rem] font-extrabold ${textColor}`}>{pct}%</span>
      <div className="w-full h-1.5 bg-usb-canvas rounded-full overflow-hidden border border-usb-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

// ─── Editable cell ────────────────────────────────────────────────────────────

function EditableCell({ value, onSave }: { value: number | null; onSave: (v: number | null) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')

  const commit = () => {
    const n = parseFloat(draft.replace(',', '.'))
    onSave(draft === '' || isNaN(n) ? null : Math.min(5, Math.max(0, Math.round(n * 10) / 10)))
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus type="text" value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commit() } }}
        className="input-grade mx-auto block" maxLength={4}
      />
    )
  }
  return (
    <button
      onClick={() => { setDraft(value !== null ? String(value) : ''); setEditing(true) }}
      className={`w-full py-2 px-2 text-center grade-cell rounded-lg hover:bg-usb-canvas transition-colors ${
        value === null ? 'text-usb-border' : gradeColor(value)
      }`}
    >
      {value !== null ? value.toFixed(1) : '—'}
    </button>
  )
}

// ─── Referral constants ───────────────────────────────────────────────────────

const REFERRAL_TYPE_LABELS: Record<ReferralType, string> = {
  bajo_rendimiento:   'Bajo rendimiento académico',
  riesgo_desercion:   'Riesgo de deserción',
  inasistencia:       'Inasistencia reiterada',
  problemas_personales: 'Problemas personales',
  otro:               'Otro',
}

const ATTENDANCE_LABELS: Record<ReferralAttendance, string> = {
  si:             'Sí asistió',
  no:             'No asistió',
  sin_confirmar:  'Sin confirmar',
}

const ATTENDANCE_COLORS: Record<ReferralAttendance, string> = {
  si:            'bg-emerald-50 text-emerald-700',
  no:            'bg-rose-50 text-rose-600',
  sin_confirmar: 'bg-amber-50 text-amber-700',
}

// ─── Create referral modal ────────────────────────────────────────────────────

function ReferralModal({
  studentName, courseId, professorId, onClose, onSave,
}: {
  studentName: string
  courseId:    string
  professorId: string
  onClose:     () => void
  onSave:      (r: Omit<Referral, 'id' | 'studentId' | 'createdAt'>) => void
}) {
  const [type,         setType]         = useState<ReferralType>('bajo_rendimiento')
  const [obs,          setObs]          = useState('')
  const [referralObs,  setReferralObs]  = useState('')
  const [date,         setDate]         = useState(() => new Date().toISOString().split('T')[0])
  const [saving,       setSaving]       = useState(false)

  const canSave = obs.trim().length > 0

  const handleSubmit = () => {
    if (!canSave) return
    setSaving(true)
    setTimeout(() => {
      onSave({ type, observations: obs.trim(), referralObservations: referralObs.trim(), date, attended: 'sin_confirmar', courseId, professorId })
      setSaving(false)
      onClose()
    }, 400)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{   opacity: 0, y: 20,  scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-modal w-full max-w-md flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: 'var(--green-deep)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,233,226,0.18)', border: '1px solid rgba(212,233,226,0.30)' }}>
              <Send size={16} style={{ color: 'var(--green-light)' }} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">Remitir a Permanencia</h2>
              <p className="text-white/50 text-xs">{studentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-1.5">
              Tipo de remisión <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={e => setType(e.target.value as ReferralType)}
                className="w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-accent focus:ring-2 focus:ring-green-accent/20 transition-all appearance-none"
              >
                {(Object.keys(REFERRAL_TYPE_LABELS) as ReferralType[]).map(k => (
                  <option key={k} value={k}>{REFERRAL_TYPE_LABELS[k]}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-usb-faint" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-1.5">
              Observaciones <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              rows={3}
              placeholder="Describe el motivo de la remisión…"
              className="w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-accent focus:ring-2 focus:ring-green-accent/20 transition-all resize-none"
            />
            {obs.trim().length === 0 && (
              <p className="flex items-center gap-1.5 text-rose-500 text-xs mt-1">
                <AlertCircle size={12} /> Campo requerido.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-1.5">
              Observaciones de remisión <span className="text-usb-faint font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              value={referralObs}
              onChange={e => setReferralObs(e.target.value)}
              rows={2}
              placeholder="Instrucciones o contexto para el área de permanencia…"
              className="w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-accent focus:ring-2 focus:ring-green-accent/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-1.5">
              Fecha de remisión
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-accent focus:ring-2 focus:ring-green-accent/20 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-usb-border bg-white flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={canSave ? handleSubmit : undefined}
            style={{ background: canSave ? '#00754A' : '#d1d5db', cursor: canSave ? 'pointer' : 'not-allowed' }}
            className="flex-1 py-3 rounded-full text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={13} />
            }
            Remitir
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Referral history modal ───────────────────────────────────────────────────

function ReferralHistoryModal({
  studentName, referrals, onClose, onUpdateAttendance,
}: {
  studentName:        string
  referrals:          Referral[]
  onClose:            () => void
  onUpdateAttendance: (id: string, attended: ReferralAttendance) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{   opacity: 0, y: 20,  scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-modal w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: 'var(--green-deep)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,233,226,0.18)', border: '1px solid rgba(212,233,226,0.30)' }}>
              <History size={16} style={{ color: 'var(--green-light)' }} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">Historial de remisiones</h2>
              <p className="text-white/50 text-xs">{studentName} · {referrals.length} remisión{referrals.length !== 1 ? 'es' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          {referrals.map(r => (
            <div key={r.id} className="bg-usb-canvas rounded-2xl border border-usb-border p-4 space-y-3">
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.68rem] font-bold" style={{ background: 'rgba(0,117,74,0.1)', color: 'var(--green-accent)' }}>
                    {REFERRAL_TYPE_LABELS[r.type]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-usb-faint text-xs whitespace-nowrap">
                  <Clock size={11} />
                  {new Date(r.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Observations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-wider text-usb-muted mb-0.5">Observaciones</p>
                  <p className="text-sm text-usb-text">{r.observations || '—'}</p>
                </div>
                {r.referralObservations && (
                  <div>
                    <p className="text-[0.62rem] font-bold uppercase tracking-wider text-usb-muted mb-0.5">Obs. de remisión</p>
                    <p className="text-sm text-usb-text">{r.referralObservations}</p>
                  </div>
                )}
              </div>

              {/* Attendance */}
              <div className="flex items-center gap-2 pt-1 border-t border-usb-border">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">¿Asistió?</p>
                <div className="flex gap-1.5 ml-1">
                  {(['si', 'no', 'sin_confirmar'] as ReferralAttendance[]).map(att => (
                    <button
                      key={att}
                      onClick={() => onUpdateAttendance(r.id, att)}
                      className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold transition-all border ${
                        r.attended === att
                          ? ATTENDANCE_COLORS[att] + ' border-transparent'
                          : 'border-usb-border text-usb-muted hover:text-usb-text'
                      }`}
                    >
                      {ATTENDANCE_LABELS[att]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-usb-border bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main GradeTable ──────────────────────────────────────────────────────────

interface Props {
  course:         Course
  grades:         Grade[]
  onUpdateGrade:  (studentId: string, componentId: string, value: number | null) => void
}

export default function GradeTable({ course, grades, onUpdateGrade }: Props) {
  const { user }   = useAuth()
  const { courseStudents, gradeMap, totals, componentAvg } = useGradeCalculation(course, grades, allStudents)

  // Referral state (local — ready for backend integration)
  const [referrals,       setReferrals]       = useState<Referral[]>([])
  const [referralTarget,  setReferralTarget]  = useState<{ studentId: string; name: string } | null>(null)
  const [historyTarget,   setHistoryTarget]   = useState<{ studentId: string; name: string } | null>(null)

  const handleCreateReferral = (
    studentId: string,
    data: Omit<Referral, 'id' | 'studentId' | 'createdAt'>
  ) => {
    const newRef: Referral = {
      ...data,
      id:        crypto.randomUUID(),
      studentId,
      createdAt: new Date().toISOString(),
    }
    setReferrals(prev => [...prev, newRef])
  }

  const handleUpdateAttendance = (id: string, attended: ReferralAttendance) => {
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, attended } : r))
  }

  const studentReferrals = (studentId: string) =>
    referrals.filter(r => r.studentId === studentId && r.courseId === course.id)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-usb-border bg-usb-canvas">
              <th className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted w-28">Código</th>
              <th className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">Estudiante</th>
              {course.components.map(comp => (
                <th key={comp.id} className="text-center px-3 py-3 min-w-[90px]">
                  <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">{comp.name}</span>
                  <span className="block text-[0.7rem] font-bold mt-0.5" style={{ color: 'var(--green-accent)' }}>{comp.percentage}%</span>
                </th>
              ))}
              <th className="text-center px-3 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted min-w-[70px]">Total</th>
              <th className="text-center px-3 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted min-w-[80px]">
                <span className="block">% Riesgo</span>
                <span className="block text-[0.58rem] font-normal text-usb-faint normal-case">Academic Risk</span>
              </th>
              <th className="text-center px-3 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted min-w-[90px]">Estado</th>
              <th className="text-center px-3 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted min-w-[140px]">Permanencia</th>
            </tr>
          </thead>

          <tbody>
            {courseStudents.map((student, idx) => {
              const total     = totals[student.id]
              const risk      = getRisk(total)
              const riskPct   = riskPercent(total)
              const refs      = studentReferrals(student.id)
              const hasRef    = refs.length > 0

              return (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`border-b border-usb-border transition-colors ${
                    risk === 'high' ? 'bg-risk-high-bg/40 hover:bg-risk-high-bg/60' : 'hover:bg-usb-canvas'
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[0.7rem] text-usb-muted">{student.studentCode}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-[0.82rem] text-usb-subtle whitespace-nowrap">{student.name}</span>
                  </td>
                  {course.components.map(comp => (
                    <td key={comp.id} className="px-1 py-1">
                      <EditableCell
                        value={gradeMap[student.id]?.[comp.id] ?? null}
                        onSave={val => onUpdateGrade(student.id, comp.id, val)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center">
                    {total !== null ? (
                      <span className={`grade-cell font-bold text-[0.88rem] ${gradeColor(total)}`}>{total.toFixed(1)}</span>
                    ) : (
                      <span className="text-usb-border font-mono text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <RiskBar pct={riskPct} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <RiskBadge level={risk} />
                  </td>

                  {/* Permanencia column */}
                  <td className="px-3 py-2 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      {hasRef && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.62rem] font-bold"
                          style={{ background: 'rgba(0,117,74,0.10)', color: 'var(--green-accent)' }}>
                          <CheckCircle2 size={9} />
                          Remitido ({refs.length})
                        </span>
                      )}
                      {hasRef && (
                        <button
                          onClick={() => setHistoryTarget({ studentId: student.id, name: student.name })}
                          className="text-[0.68rem] font-semibold underline underline-offset-2 transition-colors"
                          style={{ color: 'var(--green-accent)' }}
                        >
                          Ver remisiones
                        </button>
                      )}
                      <button
                        onClick={() => setReferralTarget({ studentId: student.id, name: student.name })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[0.68rem] font-bold transition-all hover:text-white"
                        style={{
                          borderColor: 'var(--green-accent)',
                          color: 'var(--green-accent)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#00754A'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--green-accent)' }}
                      >
                        <Send size={10} />
                        {hasRef ? 'Nueva remisión' : 'Remitir'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>

          <tfoot>
            <tr className="bg-usb-canvas border-t-2 border-usb-border">
              <td colSpan={2} className="px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">
                Promedio grupo
              </td>
              {course.components.map(comp => (
                <td key={comp.id} className="px-3 py-2.5 text-center">
                  {componentAvg[comp.id] !== null ? (
                    <span className={`grade-cell font-semibold ${gradeColor(componentAvg[comp.id])}`}>
                      {componentAvg[comp.id]!.toFixed(1)}
                    </span>
                  ) : <span className="text-usb-border text-xs font-mono">—</span>}
                </td>
              ))}
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Referral modals */}
      <AnimatePresence>
        {referralTarget && (
          <ReferralModal
            studentName={referralTarget.name}
            courseId={course.id}
            professorId={user?.id ?? ''}
            onClose={() => setReferralTarget(null)}
            onSave={data => handleCreateReferral(referralTarget.studentId, data)}
          />
        )}
        {historyTarget && (
          <ReferralHistoryModal
            studentName={historyTarget.name}
            referrals={studentReferrals(historyTarget.studentId)}
            onClose={() => setHistoryTarget(null)}
            onUpdateAttendance={handleUpdateAttendance}
          />
        )}
      </AnimatePresence>
    </>
  )
}
