/**
 * MateriaDetalle — Course detail view for students.
 * Shows course info and notes (grades). No prediction here.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Hash, Calendar, Loader2, AlertCircle,
  GraduationCap, BarChart2, User, Award,
} from 'lucide-react'
import Header from '../components/Header'
import { courseService, type BackendCourse } from '../services/courseService'

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MateriaDetalle() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate     = useNavigate()

  const [course, setCourse]             = useState<BackendCourse | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [courseError, setCourseError]   = useState<string | null>(null)

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

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-8">

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
          <div className="space-y-5">

            {/* Info cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid sm:grid-cols-3 gap-4"
            >
              {[
                { icon: <BookOpen size={18} />, label: 'Nombre', value: course.name, color: 'var(--green-accent)' },
                { icon: <Hash size={18} />,     label: 'Créditos', value: `${course.credits} créditos`, color: '#7c3aed' },
                { icon: <Calendar size={18} />, label: 'Período', value: course.academic_period, color: '#d97706' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4"
                     style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: `${color}12`, color }}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.62rem] font-extrabold uppercase tracking-wider"
                       style={{ color: 'var(--text-faint)' }}>{label}</p>
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text-dark)' }}>{value}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Professor info */}
            {course.professor_id && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="bg-white rounded-2xl p-5 flex items-center gap-4"
                style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8' }}>
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[0.62rem] font-extrabold uppercase tracking-wider"
                     style={{ color: 'var(--text-faint)' }}>Docente</p>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>
                    Asignado — Carlos Mendoza
                  </p>
                </div>
              </motion.div>
            )}

            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-white rounded-2xl p-5 flex items-center gap-4"
              style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(22,163,74,0.10)', color: '#16a34a' }}>
                <GraduationCap size={18} />
              </div>
              <div>
                <p className="text-[0.62rem] font-extrabold uppercase tracking-wider"
                   style={{ color: 'var(--text-faint)' }}>Estado de inscripción</p>
                <span className="inline-flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-sm text-emerald-700">Activo</span>
                </span>
              </div>
            </motion.div>

            {/* Notas — placeholder section */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-white rounded-2xl p-6"
              style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Award size={16} style={{ color: 'var(--green-accent)' }} />
                <h2 className="font-bold" style={{ color: 'var(--text-dark)' }}>Calificaciones</h2>
              </div>
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
            </motion.div>

            {/* CTA → predicción */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="bg-white rounded-2xl p-6 flex items-center justify-between gap-4"
              style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              <div>
                <p className="font-bold" style={{ color: 'var(--text-dark)' }}>¿Quieres predecir tu riesgo?</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  El predictor IA analiza tus indicadores y estima tu probabilidad de aprobar.
                </p>
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
