/**
 * MateriaDetalle — Course detail view for students.
 * Shows course info and notes (grades). No prediction here.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Hash, Calendar, Loader2, AlertCircle,
  GraduationCap, BarChart2, User, Award, ChevronDown,
} from 'lucide-react'
import Header from '../components/Header'
import { courseService, type BackendCourse } from '../services/courseService'
import { enrollmentService, type BackendGradesRead } from '../services/enrollmentService'
import { useAuth } from '../context/AuthContext'

// ─── Main page ───────────────────────────────────────────────────────────────

function gradeColor(value: number | null): string {
  if (value === null) return 'var(--text-faint)'
  if (value >= 4.0)   return '#16a34a'  // alta  — verde
  if (value >= 3.0)   return '#d97706'  // media — amarillo
  return '#dc2626'                       // bajo  — rojo
}

export default function MateriaDetalle() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate     = useNavigate()
  const { user }     = useAuth()

  const [course, setCourse]               = useState<BackendCourse | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [courseError, setCourseError]     = useState<string | null>(null)

  const [gradesData, setGradesData]       = useState<BackendGradesRead | null>(null)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState<'first_cohort' | 'second_cohort' | 'third_cohort' | null>(null)

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

  const loadGrades = useCallback(async () => {
    if (!user?.studentId || !courseId) return
    setLoadingGrades(true)
    try {
      const enrollments = await enrollmentService.listByStudent(user.studentId)
      const enrollment  = enrollments.find(e => e.course_id === courseId)
      if (!enrollment || enrollment.nota_parcial_1 == null) return

      // Build GradesRead shape from the flat fields already on the enrollment.
      // Corte 1 = nota_parcial_1 + seguimiento; Cortes 2 & 3 not yet recorded.
      setGradesData({
        id:         enrollment.id,
        student_id: enrollment.student_id,
        course_id:  enrollment.course_id,
        grades: {
          first_cohort: {
            parcial:      { note: Number(enrollment.nota_parcial_1), weight: '70%' },
            seguimiento:  { seguimiento_clase: { note: Number(enrollment.seguimiento), weight: '30%' } },
          },
        },
        first_cohort_grade:  enrollment.nota_parcial_1,
        second_cohort_grade: null,
        third_cohort_grade:  null,
        final_grade:         null,
        // Extra indicators stored for the details panel
        _asistencia:  enrollment.asistencia,
        _logins:      enrollment.logins,
        _uso_tutorias: enrollment.uso_tutorias,
      } as BackendGradesRead & { _asistencia: number|null; _logins: number|null; _uso_tutorias: boolean|null })
    } catch {
      // Silently fail — placeholder is shown instead
    } finally {
      setLoadingGrades(false)
    }
  }, [user?.studentId, courseId])

  useEffect(() => { void loadCourse() }, [loadCourse])
  useEffect(() => { void loadGrades() }, [loadGrades])

  return (
    <div className="min-h-screen bg-usb-canvas flex flex-col">
      <Header />

      {/* Page header */}
      <div className="relative overflow-hidden"
           style={{ background: 'var(--green-deep)', borderBottom: '1px solid rgba(0,0,0,0.25)' }}>
        <div className="max-w-4xl mx-auto px-5 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-bold mb-4 transition-colors"
            style={{ color: 'rgba(212,233,226,0.55)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#d4e9e2')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,233,226,0.55)')}
          >
            <ArrowLeft size={15} />
            Volver a Mi Progreso
          </button>
          {course && (
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <BookOpen size={18} style={{ color: 'var(--green-light, #d4e9e2)' }} />
                <h1 className="text-white font-extrabold text-xl leading-tight" style={{ letterSpacing: '-0.02em' }}>
                  {course.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                <span className="text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(212,233,226,0.12)', color: 'rgba(212,233,226,0.80)' }}>
                  {course.code}
                </span>
                <span className="flex items-center gap-1" style={{ color: 'rgba(212,233,226,0.55)' }}>
                  <Hash size={11} />{course.credits} créditos
                </span>
                <span className="flex items-center gap-1" style={{ color: 'rgba(212,233,226,0.55)' }}>
                  <Calendar size={11} />{course.academic_period}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-5">

        {/* Loading */}
        {loadingCourse && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={30} className="animate-spin mb-4" style={{ color: 'var(--green-accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Cargando curso…</p>
          </div>
        )}

        {/* Error */}
        {courseError && (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center"
               style={{ boxShadow: 'var(--shadow-card)' }}>
            <AlertCircle size={30} className="text-rose-400 mx-auto mb-3" />
            <p className="font-bold mb-2" style={{ color: 'var(--text-dark)' }}>{courseError}</p>
            <button onClick={loadCourse} className="text-sm font-bold hover:underline"
                    style={{ color: 'var(--green-accent)' }}>Reintentar</button>
          </div>
        )}

        {/* Content */}
        {!loadingCourse && !courseError && course && (
          <div className="space-y-3">

            {/* Info cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid sm:grid-cols-3 gap-2"
            >
              {[
                { icon: <BookOpen size={15} />, label: 'Nombre', value: course.name, color: 'var(--green-accent)' },
                { icon: <Hash size={15} />,     label: 'Créditos', value: `${course.credits} créditos`, color: '#7c3aed' },
                { icon: <Calendar size={15} />, label: 'Período', value: course.academic_period, color: '#d97706' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="bg-white rounded-xl p-3 flex items-center gap-3"
                     style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ background: `${color}12`, color }}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.58rem] font-extrabold uppercase tracking-wider"
                       style={{ color: 'var(--text-faint)' }}>{label}</p>
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text-dark)' }}>{value}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Professor info + Status — same row */}
            <div className="grid grid-cols-2 gap-2">
              {course.professor_id && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="bg-white rounded-xl p-3 flex items-center gap-3"
                  style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8' }}>
                    <User size={15} />
                  </div>
                  <div>
                    <p className="text-[0.58rem] font-extrabold uppercase tracking-wider"
                       style={{ color: 'var(--text-faint)' }}>Docente</p>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>
                      Asignado — Carlos Mendoza
                    </p>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="bg-white rounded-xl p-3 flex items-center gap-3"
                style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(22,163,74,0.10)', color: '#16a34a' }}>
                  <GraduationCap size={15} />
                </div>
                <div>
                  <p className="text-[0.58rem] font-extrabold uppercase tracking-wider"
                     style={{ color: 'var(--text-faint)' }}>Estado de inscripción</p>
                  <span className="inline-flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sm text-emerald-700">Activo</span>
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Calificaciones */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-white rounded-2xl p-6"
              style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Award size={16} style={{ color: 'var(--green-accent)' }} />
                  <h2 className="font-bold" style={{ color: 'var(--text-dark)' }}>Calificaciones</h2>
                </div>
                <button
                  onClick={() => navigate(`/prediccion?courseId=${course.id}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm flex-shrink-0 transition-all"
                  style={{
                    background: 'var(--green-accent)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,117,74,0.25)',
                  }}
                >
                  <BarChart2 size={15} />
                  Predecir riesgo
                </button>
              </div>

              {loadingGrades ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={22} className="animate-spin" style={{ color: 'var(--green-accent)' }} />
                </div>
              ) : gradesData?.grades !== null && gradesData !== null ? (
                <div className="space-y-3">
                  {/* Cohort cards — clickable */}
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label: 'Corte 1', key: 'first_cohort',  value: gradesData.first_cohort_grade },
                      { label: 'Corte 2', key: 'second_cohort', value: gradesData.second_cohort_grade },
                      { label: 'Corte 3', key: 'third_cohort',  value: gradesData.third_cohort_grade },
                    ] as const).map(({ label, key, value }) => {
                      const isOpen = selectedCohort === key
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedCohort(isOpen ? null : key)}
                          className="rounded-xl p-4 text-center transition-all"
                          style={{
                            background: isOpen ? 'var(--green-accent)' : 'var(--canvas-warm)',
                            border: isOpen ? '1px solid var(--green-accent)' : '1px solid rgba(0,0,0,0.06)',
                          }}
                        >
                          <p className="text-[0.62rem] font-extrabold uppercase tracking-wider mb-1"
                             style={{ color: isOpen ? 'rgba(255,255,255,0.7)' : 'var(--text-faint)' }}>{label}</p>
                          <p className="text-2xl font-extrabold leading-none"
                             style={{ color: isOpen ? 'white' : gradeColor(value) }}>
                            {value !== null ? Number(value).toFixed(1) : '—'}
                          </p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <p className="text-[0.6rem]" style={{ color: isOpen ? 'rgba(255,255,255,0.55)' : 'var(--text-faint)' }}>
                              / 5.00
                            </p>
                            <ChevronDown
                              size={11}
                              style={{
                                color: isOpen ? 'rgba(255,255,255,0.55)' : 'var(--text-faint)',
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                              }}
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Expandable detail panel */}
                  <AnimatePresence>
                    {selectedCohort && gradesData.grades && (
                      <motion.div
                        key={selectedCohort}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div
                          className="rounded-xl p-4 space-y-2"
                          style={{ background: 'var(--canvas-warm)', border: '1px solid rgba(0,0,0,0.06)' }}
                        >
                          {/* Parcial */}
                          {(() => {
                            const cohort = (gradesData.grades as Record<string, unknown>)[selectedCohort] as Record<string, unknown> | undefined
                            if (!cohort) return null
                            const parcial = cohort.parcial as { note?: number; weight?: string } | undefined
                            const seguimiento = cohort.seguimiento as Record<string, { note?: number; weight?: string }> | undefined

                            return (
                              <>
                                <p className="text-[0.62rem] font-extrabold uppercase tracking-wider mb-2"
                                   style={{ color: 'var(--text-faint)' }}>
                                  Detalle — {selectedCohort === 'first_cohort' ? 'Corte 1' : selectedCohort === 'second_cohort' ? 'Corte 2' : 'Corte 3'}
                                </p>

                                {/* Parcial row */}
                                {parcial && (
                                  <div className="flex items-center justify-between py-2 border-b"
                                       style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                                    <div>
                                      <p className="font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>Parcial</p>
                                      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Peso: {parcial.weight ?? '—'}</p>
                                    </div>
                                    <p className="text-lg font-extrabold"
                                       style={{ color: gradeColor(parcial.note ?? null) }}>
                                      {parcial.note !== undefined ? Number(parcial.note).toFixed(1) : '—'}
                                    </p>
                                  </div>
                                )}

                                {/* Seguimiento rows */}
                                {seguimiento && Object.entries(seguimiento).map(([actKey, act]) => (
                                  <div key={actKey}
                                       className="flex items-center justify-between py-2 border-b last:border-0"
                                       style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                                    <div>
                                      <p className="font-semibold text-sm capitalize" style={{ color: 'var(--text-dark)' }}>
                                        {actKey.replace(/_/g, ' ')}
                                      </p>
                                      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Peso: {act.weight ?? '—'}</p>
                                    </div>
                                    <p className="text-lg font-extrabold"
                                       style={{ color: gradeColor(act.note ?? null) }}>
                                      {act.note !== undefined ? Number(act.note).toFixed(1) : '—'}
                                    </p>
                                  </div>
                                ))}
                              </>
                            )
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Indicadores de seguimiento */}
                  {(() => {
                    const g = gradesData as BackendGradesRead & { _asistencia?: number|null; _logins?: number|null; _uso_tutorias?: boolean|null }
                    const indicators = [
                      { label: 'Asistencia',   value: g._asistencia   != null ? `${Number(g._asistencia).toFixed(1)} %`  : '—', color: 'var(--green-accent)' },
                      { label: 'Sesiones LMS', value: g._logins       != null ? String(g._logins)                         : '—', color: '#d97706' },
                      { label: 'Tutorías',     value: g._uso_tutorias != null ? (g._uso_tutorias ? '✅ Sí' : '❌ No')     : '—', color: g._uso_tutorias ? '#16a34a' : 'var(--text-muted)' },
                    ]
                    return (
                      <div className="rounded-xl p-3" style={{ background: 'var(--canvas-warm)', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <p className="text-[0.58rem] font-extrabold uppercase tracking-wider mb-2.5"
                           style={{ color: 'var(--text-faint)' }}>Indicadores de seguimiento</p>
                        <div className="grid grid-cols-3 gap-2">
                          {indicators.map(({ label, value, color }) => (
                            <div key={label} className="bg-white rounded-lg p-2.5 text-center"
                                 style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                              <p className="text-[0.58rem] font-bold uppercase tracking-wider mb-1"
                                 style={{ color: 'var(--text-faint)' }}>{label}</p>
                              <p className="text-sm font-extrabold" style={{ color }}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Final grade */}
                  <div
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{ background: 'var(--canvas-warm)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>Nota definitiva</p>
                    <p className="text-2xl font-extrabold"
                       style={{ color: gradeColor(gradesData.final_grade) }}>
                      {gradesData.final_grade !== null ? Number(gradesData.final_grade).toFixed(1) : '—'}
                      <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-faint)' }}>/ 5.00</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 rounded-xl"
                     style={{ background: 'var(--canvas-warm)', border: '1.5px dashed rgba(0,0,0,0.10)' }}>
                  <Award size={28} className="mb-3" style={{ color: 'var(--text-faint)' }} />
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-subtle)' }}>
                    Las calificaciones las registra tu docente
                  </p>
                  <p className="text-xs mt-1 max-w-xs text-center" style={{ color: 'var(--text-faint)' }}>
                    Aparecerán aquí una vez que el profesor las ingrese en el sistema.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center"
              style={{ background: 'var(--green-deep)', borderTop: '1px solid rgba(255,255,255,0.14)' }}>
        <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Academic Risk · Detalle de Materia · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
