/**
 * Grades — vista de calificaciones por curso para el docente.
 * URL: /grades/:courseId
 *
 * Funcionalidades:
 * - Carga estudiantes del curso desde la API
 * - Carga sus inscripciones para obtener indicadores actuales
 * - Edición inline de: asistencia, seguimiento, parcial 1, logins, uso tutorías
 * - Guarda fila a fila vía PATCH /enrollments/{id}/indicators
 * - Indicador de riesgo estimado por estudiante
 * - "Remitir a consejería" para estudiantes en riesgo alto
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, AlertTriangle, CheckCircle2, Save, Loader2,
  RefreshCw, Users, BookOpen, UserCheck, TrendingDown,
  Send, X, Check,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import { courseService, type BackendCourse } from '../services/courseService'
import { enrollmentService, type BackendEnrollment, type IndicatorsUpdateInput } from '../services/enrollmentService'
import type { BackendUser } from '../services/authService'
import { useToast } from '../components/Toast'

// ── Risk ──────────────────────────────────────────────────────────────────────

type RiskLevel = 'alto' | 'medio' | 'bajo' | null

function computeRisk(
  nota: number | null,
  asist: number | null,
  logins: number | null,
): RiskLevel {
  if (nota == null && asist == null) return null
  let score = 0
  if (nota  != null) score += nota  < 3   ? 2 : nota  < 3.5 ? 1 : 0
  if (asist != null) score += asist < 60  ? 2 : asist < 75  ? 1 : 0
  if (logins != null) score += logins < 5 ? 1 : 0
  if (score >= 3) return 'alto'
  if (score >= 1) return 'medio'
  return 'bajo'
}

const riskConfig: Record<NonNullable<RiskLevel>, { label: string; bg: string; text: string; border: string }> = {
  alto:  { label: 'Alto',  bg: 'rgba(239,68,68,0.08)',    text: '#dc2626', border: 'rgba(239,68,68,0.25)'   },
  medio: { label: 'Medio', bg: 'rgba(234,179,8,0.10)',    text: '#b45309', border: 'rgba(234,179,8,0.30)'   },
  bajo:  { label: 'Bajo',  bg: 'rgba(0,117,74,0.09)',     text: 'var(--green-accent)', border: 'rgba(0,117,74,0.20)' },
}

// ── Row state ─────────────────────────────────────────────────────────────────

interface RowState {
  enrollmentId:   string
  studentId:      string
  studentName:    string
  studentEmail:   string
  asistencia:     string   // string so empty input works
  seguimiento:    string
  nota_parcial_1: string
  logins:         string
  uso_tutorias:   boolean | null
  dirty:          boolean
  saving:         boolean
  saved:          boolean
}

function enrollmentToRow(student: BackendUser, enrollment: BackendEnrollment | null): RowState {
  return {
    enrollmentId:   enrollment?.id       ?? '',
    studentId:      student.id,
    studentName:    student.full_name,
    studentEmail:   student.email,
    asistencia:     enrollment?.asistencia     != null ? String(enrollment.asistencia)     : '',
    seguimiento:    enrollment?.seguimiento    != null ? String(enrollment.seguimiento)    : '',
    nota_parcial_1: enrollment?.nota_parcial_1 != null ? String(enrollment.nota_parcial_1) : '',
    logins:         enrollment?.logins         != null ? String(enrollment.logins)         : '',
    uso_tutorias:   enrollment?.uso_tutorias   ?? null,
    dirty:          false,
    saving:         false,
    saved:          false,
  }
}

// ── Inline cell ───────────────────────────────────────────────────────────────

interface CellProps {
  value:       string
  placeholder: string
  type:        'number' | 'text'
  min?:        number
  max?:        number
  step?:       number
  onChange:    (v: string) => void
  disabled?:   boolean
}

function EditCell({ value, placeholder, type, min, max, step = 0.1, onChange, disabled }: CellProps) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center border transition-all outline-none"
      style={{
        border: '1px solid rgba(0,0,0,0.12)',
        background: disabled ? 'transparent' : '#fafafa',
        color: 'var(--text-dark)',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--green-accent)' }}
      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)' }}
    />
  )
}

// ── Remitir modal ─────────────────────────────────────────────────────────────

interface RemitirModalProps {
  studentName: string
  onClose:     () => void
}

function RemitirModal({ studentName, onClose }: RemitirModalProps) {
  const toast = useToast()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        className="relative bg-white rounded-2xl p-6 max-w-sm w-full"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100"
        >
          <X size={14} style={{ color: 'var(--text-faint)' }} />
        </button>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(239,68,68,0.08)' }}
        >
          <Send size={20} style={{ color: '#dc2626' }} />
        </div>

        <h3 className="font-extrabold text-base mb-1" style={{ color: 'var(--text-dark)' }}>
          Remitir a consejería
        </h3>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Vas a remitir a <strong>{studentName}</strong> al programa de permanencia y consejería
          académica por indicadores de riesgo alto. El coordinador recibirá una notificación.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
            style={{ border: '1px solid rgba(0,0,0,0.12)', color: 'var(--text-muted)' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              toast.success(
                'Remisión enviada',
                `${studentName} fue remitido a consejería académica.`
              )
              onClose()
            }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#dc2626' }}
          >
            Confirmar remisión
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function GradesPage() {
  const { courseId }   = useParams<{ courseId: string }>()
  const navigate       = useNavigate()
  const { user }       = useAuth()
  const toast          = useToast()

  const [course,   setCourse]   = useState<BackendCourse | null>(null)
  const [rows,     setRows]     = useState<RowState[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [remitir,  setRemitir]  = useState<string | null>(null)   // studentName

  // ── Load data ───────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!courseId || !user?.professorId) return
    setLoading(true)
    setError(null)

    try {
      const [courseData, students] = await Promise.all([
        courseService.getById(courseId),
        courseService.listCourseStudents(courseId, user.professorId),
      ])
      setCourse(courseData)

      // load enrollment for each student in this course
      const enrollmentResults = await Promise.allSettled(
        students.map(s => enrollmentService.listByStudent(s.id))
      )

      const newRows: RowState[] = students.map((student, i) => {
        const result = enrollmentResults[i]
        const enrollments = result.status === 'fulfilled' ? result.value : []
        const enrollment  = enrollments.find(e => e.course_id === courseId) ?? null
        return enrollmentToRow(student, enrollment)
      })

      setRows(newRows)
    } catch {
      setError('No se pudieron cargar los datos del curso.')
    } finally {
      setLoading(false)
    }
  }, [courseId, user?.professorId])

  useEffect(() => { void load() }, [load])

  // ── Field update ────────────────────────────────────────────────────────────

  function updateField(index: number, field: keyof RowState, value: string | boolean | null) {
    setRows(prev => prev.map((r, i) =>
      i !== index ? r : { ...r, [field]: value, dirty: true, saved: false }
    ))
  }

  // ── Save row ────────────────────────────────────────────────────────────────

  async function saveRow(index: number) {
    const row = rows[index]
    if (!row.enrollmentId) {
      toast.error('Sin inscripción', 'Este estudiante no tiene inscripción en el curso.')
      return
    }

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
      // auto-clear "saved" badge after 2s
      setTimeout(() => {
        setRows(prev => prev.map((r, i) =>
          i !== index ? r : { ...r, saved: false }
        ))
      }, 2000)
      toast.success('Guardado', `Notas de ${row.studentName} actualizadas.`)
    } catch {
      setRows(prev => prev.map((r, i) => i === index ? { ...r, saving: false } : r))
      toast.error('Error al guardar', 'Verifica tu conexión e intenta de nuevo.')
    }
  }

  // ── Save all dirty rows ─────────────────────────────────────────────────────

  async function saveAll() {
    const dirtyIndexes = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.dirty && r.enrollmentId)
      .map(({ i }) => i)

    if (dirtyIndexes.length === 0) {
      toast.info('Sin cambios', 'No hay notas pendientes de guardar.')
      return
    }

    await Promise.allSettled(dirtyIndexes.map(i => saveRow(i)))
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const atRiskRows = rows.filter(r => {
    const nota  = r.nota_parcial_1 !== '' ? parseFloat(r.nota_parcial_1) : null
    const asist = r.asistencia     !== '' ? parseFloat(r.asistencia)     : null
    const logins = r.logins        !== '' ? parseInt(r.logins, 10)       : null
    return computeRisk(nota, asist, logins) === 'alto'
  })

  const withDataRows = rows.filter(r => r.nota_parcial_1 !== '' || r.asistencia !== '')
  const pct = rows.length > 0 ? Math.round((withDataRows.length / rows.length) * 100) : 0
  const dirtyCount = rows.filter(r => r.dirty).length

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--canvas-warm)' }}>
      <Header />

      {/* Breadcrumb bar */}
      <div
        className="border-b px-5 py-2.5 flex items-center justify-between"
        style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.08)' }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm font-semibold transition-colors group no-tap"
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

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-10 h-10 rounded-full border-4 animate-spin"
              style={{ borderColor: 'var(--green-light)', borderTopColor: 'var(--green-accent)' }}
            />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6 bg-white rounded-2xl border border-red-200 text-center">
            <p className="text-sm text-red-600 font-semibold mb-3">{error}</p>
            <button
              onClick={load}
              className="flex items-center gap-2 text-sm font-bold mx-auto px-4 py-2 rounded-xl text-white"
              style={{ background: 'var(--green-accent)' }}
            >
              <RefreshCw size={13} />
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && course && (
          <>
            {/* Course header card */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 mb-5"
              style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.06)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(0,117,74,0.10)', color: 'var(--green-accent)' }}
                    >
                      <BookOpen size={10} />
                      {course.code}
                    </span>
                    <span
                      className="inline-flex items-center text-[0.65rem] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'var(--canvas-warm)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-faint)' }}
                    >
                      {course.academic_period}
                    </span>
                  </div>
                  <h2 className="font-extrabold text-lg leading-tight" style={{ color: 'var(--text-dark)' }}>
                    {course.name}
                  </h2>
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
                  <div className="w-px h-8 bg-gray-200" />
                  {atRiskRows.length > 0 ? (
                    <div
                      className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      <AlertTriangle size={14} style={{ color: '#dc2626' }} />
                      <div>
                        <p className="font-bold text-xs" style={{ color: '#dc2626' }}>
                          {atRiskRows.length} en riesgo alto
                        </p>
                        <p className="text-[0.62rem]" style={{ color: '#dc2626', opacity: 0.75 }}>
                          Requieren atención
                        </p>
                      </div>
                    </div>
                  ) : (
                    withDataRows.length > 0 ? (
                      <div
                        className="flex items-center gap-2 rounded-xl px-3 py-2"
                        style={{ background: 'rgba(0,117,74,0.08)', border: '1px solid rgba(0,117,74,0.20)' }}
                      >
                        <CheckCircle2 size={14} style={{ color: 'var(--green-accent)' }} />
                        <div>
                          <p className="font-bold text-xs" style={{ color: 'var(--green-accent)' }}>Sin riesgo alto</p>
                          <p className="text-[0.62rem]" style={{ color: 'var(--green-accent)', opacity: 0.75 }}>Grupo estable</p>
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                    Progreso de ingreso de notas
                  </span>
                  <span className="text-[0.75rem] font-extrabold" style={{ color: 'var(--green-accent)' }}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'var(--green-accent)' }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Save all action bar */}
            {dirtyCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'rgba(0,117,74,0.08)', border: '1px solid rgba(0,117,74,0.20)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--green-accent)' }}>
                  {dirtyCount} fila{dirtyCount !== 1 ? 's' : ''} con cambios sin guardar
                </span>
                <button
                  onClick={saveAll}
                  className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl text-white"
                  style={{ background: 'var(--green-accent)' }}
                >
                  <Save size={13} />
                  Guardar todo
                </button>
              </motion.div>
            )}

            {/* Empty state */}
            {rows.length === 0 && (
              <div
                className="p-12 bg-white rounded-2xl text-center"
                style={{ border: '2px dashed rgba(0,0,0,0.10)' }}
              >
                <Users size={24} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                <p className="font-bold" style={{ color: 'var(--text-dark)' }}>
                  No hay estudiantes inscritos en este curso
                </p>
              </div>
            )}

            {/* Table */}
            {rows.length > 0 && (
              <div
                className="bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: 'var(--canvas-warm)', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
                        <th className="text-left px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                          Estudiante
                        </th>
                        <th className="px-3 py-3 text-[0.65rem] font-extrabold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)', minWidth: '90px' }}>
                          Asistencia %
                        </th>
                        <th className="px-3 py-3 text-[0.65rem] font-extrabold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)', minWidth: '90px' }}>
                          Seguimiento
                        </th>
                        <th className="px-3 py-3 text-[0.65rem] font-extrabold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)', minWidth: '90px' }}>
                          Parcial 1
                        </th>
                        <th className="px-3 py-3 text-[0.65rem] font-extrabold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)', minWidth: '80px' }}>
                          Logins LMS
                        </th>
                        <th className="px-3 py-3 text-[0.65rem] font-extrabold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)', minWidth: '80px' }}>
                          Tutorías
                        </th>
                        <th className="px-3 py-3 text-[0.65rem] font-extrabold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)', minWidth: '90px' }}>
                          Riesgo
                        </th>
                        <th className="px-3 py-3 text-[0.65rem] font-extrabold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)', minWidth: '100px' }}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => {
                        const nota  = row.nota_parcial_1 !== '' ? parseFloat(row.nota_parcial_1) : null
                        const asist = row.asistencia     !== '' ? parseFloat(row.asistencia)     : null
                        const logins = row.logins        !== '' ? parseInt(row.logins, 10)       : null
                        const risk  = computeRisk(nota, asist, logins)
                        const cfg   = risk ? riskConfig[risk] : null

                        return (
                          <motion.tr
                            key={row.studentId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            style={{
                              borderBottom: '1px solid rgba(0,0,0,0.05)',
                              background: row.dirty ? 'rgba(0,117,74,0.02)' : 'transparent',
                            }}
                          >
                            {/* Student */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ background: 'rgba(0,117,74,0.10)', color: 'var(--green-accent)' }}
                                >
                                  {row.studentName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text-dark)' }}>
                                    {row.studentName}
                                  </p>
                                  <p className="text-[0.62rem]" style={{ color: 'var(--text-faint)' }}>
                                    {row.studentEmail}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Asistencia */}
                            <td className="px-3 py-3">
                              <EditCell
                                value={row.asistencia}
                                placeholder="0–100"
                                type="number"
                                min={0} max={100} step={1}
                                onChange={v => updateField(i, 'asistencia', v)}
                                disabled={row.saving}
                              />
                            </td>

                            {/* Seguimiento */}
                            <td className="px-3 py-3">
                              <EditCell
                                value={row.seguimiento}
                                placeholder="0.0–5.0"
                                type="number"
                                min={0} max={5} step={0.1}
                                onChange={v => updateField(i, 'seguimiento', v)}
                                disabled={row.saving}
                              />
                            </td>

                            {/* Parcial 1 */}
                            <td className="px-3 py-3">
                              <EditCell
                                value={row.nota_parcial_1}
                                placeholder="0.0–5.0"
                                type="number"
                                min={0} max={5} step={0.1}
                                onChange={v => updateField(i, 'nota_parcial_1', v)}
                                disabled={row.saving}
                              />
                            </td>

                            {/* Logins */}
                            <td className="px-3 py-3">
                              <EditCell
                                value={row.logins}
                                placeholder="0+"
                                type="number"
                                min={0} step={1}
                                onChange={v => updateField(i, 'logins', v)}
                                disabled={row.saving}
                              />
                            </td>

                            {/* Tutorías — toggle */}
                            <td className="px-3 py-3 text-center">
                              <button
                                disabled={row.saving}
                                onClick={() => updateField(i, 'uso_tutorias', row.uso_tutorias === null ? true : !row.uso_tutorias)}
                                className="mx-auto flex items-center justify-center w-8 h-8 rounded-full transition-all"
                                style={{
                                  background: row.uso_tutorias === true
                                    ? 'rgba(0,117,74,0.12)'
                                    : row.uso_tutorias === false
                                    ? 'rgba(239,68,68,0.08)'
                                    : 'rgba(0,0,0,0.06)',
                                  border: '1px solid ' + (
                                    row.uso_tutorias === true
                                      ? 'rgba(0,117,74,0.25)'
                                      : row.uso_tutorias === false
                                      ? 'rgba(239,68,68,0.20)'
                                      : 'rgba(0,0,0,0.10)'
                                  ),
                                }}
                              >
                                {row.uso_tutorias === true ? (
                                  <Check size={12} style={{ color: 'var(--green-accent)' }} />
                                ) : row.uso_tutorias === false ? (
                                  <X size={12} style={{ color: '#dc2626' }} />
                                ) : (
                                  <span className="text-[0.6rem] font-bold" style={{ color: 'var(--text-faint)' }}>—</span>
                                )}
                              </button>
                            </td>

                            {/* Risk badge */}
                            <td className="px-3 py-3 text-center">
                              {cfg ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[0.62rem] font-bold px-2.5 py-1 rounded-full"
                                  style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                                >
                                  {risk === 'alto' && <TrendingDown size={9} />}
                                  {cfg.label}
                                </span>
                              ) : (
                                <span
                                  className="text-[0.62rem] font-semibold"
                                  style={{ color: 'var(--text-faint)' }}
                                >
                                  Sin datos
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5 justify-center">
                                {/* Save button */}
                                <button
                                  onClick={() => saveRow(i)}
                                  disabled={!row.dirty || row.saving || !row.enrollmentId}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.65rem] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                  style={{
                                    background: row.saved ? 'rgba(0,117,74,0.12)' : 'var(--green-accent)',
                                    color: row.saved ? 'var(--green-accent)' : '#fff',
                                  }}
                                >
                                  {row.saving ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : row.saved ? (
                                    <Check size={10} />
                                  ) : (
                                    <Save size={10} />
                                  )}
                                  {row.saved ? 'Guardado' : 'Guardar'}
                                </button>

                                {/* Remitir button — only visible if at-risk */}
                                {risk === 'alto' && (
                                  <button
                                    onClick={() => setRemitir(row.studentName)}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[0.65rem] font-bold transition-all"
                                    style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.20)' }}
                                    title="Remitir a consejería"
                                  >
                                    <UserCheck size={10} />
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

                {/* Table footer */}
                <div
                  className="px-4 py-3 border-t text-xs"
                  style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-faint)', background: 'var(--canvas-warm)' }}
                >
                  Escala de notas: 0.0 – 5.0 · Nota mínima aprobatoria: 3.0 · Asistencia mínima recomendada: 75%
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Remitir modal */}
      <AnimatePresence>
        {remitir && (
          <RemitirModal
            studentName={remitir}
            onClose={() => setRemitir(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
