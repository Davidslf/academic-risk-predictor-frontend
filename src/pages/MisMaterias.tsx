/**
 * MisMaterias — "Mi Progreso" student view.
 *
 * Data flow:
 *  1. GET /students/{id}/enrollments (no status filter → all statuses)
 *  2. GET /courses/{id} for each enrollment → course details
 *  3. GET /programs/{id} → program name
 *  4. GET /programs/{id}/courses → full pensum (all courses in program)
 *  5. Compare: enrolled (ACTIVE+COMPLETED) vs pensum → progress
 *
 * Counters:
 *  - Materias del programa  = pensum courses count
 *  - Materias cursando      = enrollments with status ACTIVE
 *  - Créditos cursando      = credits of ACTIVE enrollments
 *  - Créditos aprobados     = credits of COMPLETED enrollments
 *  - Créditos restantes     = total program credits − (ACTIVE + COMPLETED) credits
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, Loader2, AlertCircle,
  GraduationCap, Calendar, Hash, ChevronRight, TrendingUp,
  Layers, CheckSquare, ShieldAlert, CheckCircle2,
} from 'lucide-react'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { enrollmentService, type BackendEnrollment } from '../services/enrollmentService'
import { courseService, type BackendCourse } from '../services/courseService'
import { programService, type BackendProgram } from '../services/programService'
import { ApiError } from '../services/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EnrolledCourse {
  course:           BackendCourse
  enrollmentStatus: BackendEnrollment['status']
}

interface ProgramGroup {
  programId:        string
  program:          BackendProgram | null
  activeCourses:    EnrolledCourse[]   // ACTIVE enrollments
  completedCourses: EnrolledCourse[]   // COMPLETED enrollments
  pensumCourses:    BackendCourse[]    // ALL courses in the program
  activeCredits:    number
  completedCredits: number
  totalCredits:     number
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function MisMaterias() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const studentId = user?.studentId ?? user?.id ?? ''

  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [noAccess, setNoAccess] = useState(false)
  const [groups, setGroups]     = useState<ProgramGroup[]>([])

  const fetchData = useCallback(async () => {
    if (!studentId) {
      setError('No se encontró tu ID de estudiante. Intenta cerrar sesión y volver a ingresar.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setNoAccess(false)

    try {
      // ── 1. Get ALL enrollments (no status filter) ────────────────────
      let enrollments: BackendEnrollment[]
      try {
        enrollments = await enrollmentService.listByStudent(studentId)
      } catch (err) {
        if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
          setNoAccess(true)
          setLoading(false)
          return
        }
        throw err
      }

      // Only care about ACTIVE and COMPLETED
      const relevant = enrollments.filter(
        e => e.status === 'ACTIVE' || e.status === 'COMPLETED',
      )

      if (relevant.length === 0) {
        setGroups([])
        setLoading(false)
        return
      }

      // ── 2. Resolve course details ────────────────────────────────────
      const settled = await Promise.allSettled(
        relevant.map(async (e) => {
          const course = await courseService.getById(e.course_id)
          return { course, enrollmentStatus: e.status } as EnrolledCourse
        }),
      )
      const allEnrolled = settled
        .filter((r): r is PromiseFulfilledResult<EnrolledCourse> => r.status === 'fulfilled')
        .map(r => r.value)

      // ── 3. Group by program_id ───────────────────────────────────────
      const byProgram = allEnrolled.reduce((acc, ec) => {
        const pid = ec.course.program_id ?? 'sin-programa'
        if (!acc[pid]) acc[pid] = []
        acc[pid].push(ec)
        return acc
      }, {} as Record<string, EnrolledCourse[]>)

      // ── 4. Enrich each program ───────────────────────────────────────
      const groupPromises = Object.entries(byProgram).map(
        async ([programId, courses]): Promise<ProgramGroup> => {
          let program: BackendProgram | null = null
          let pensumCourses: BackendCourse[] = []

          if (programId !== 'sin-programa') {
            const [progRes, pensumRes] = await Promise.allSettled([
              programService.getProgram(programId),
              courseService.listByProgram(programId),
            ])
            if (progRes.status === 'fulfilled') program = progRes.value
            if (pensumRes.status === 'fulfilled') pensumCourses = pensumRes.value
          }

          const activeCourses    = courses.filter(c => c.enrollmentStatus === 'ACTIVE')
          const completedCourses = courses.filter(c => c.enrollmentStatus === 'COMPLETED')

          const activeCredits    = activeCourses.reduce((s, c) => s + c.course.credits, 0)
          const completedCredits = completedCourses.reduce((s, c) => s + c.course.credits, 0)
          const totalCredits     = pensumCourses.length > 0
            ? pensumCourses.reduce((s, c) => s + c.credits, 0)
            : activeCredits + completedCredits

          return {
            programId, program,
            activeCourses, completedCourses, pensumCourses,
            activeCredits, completedCredits, totalCredits,
          }
        },
      )

      const groupSettled = await Promise.allSettled(groupPromises)
      setGroups(
        groupSettled
          .filter((r): r is PromiseFulfilledResult<ProgramGroup> => r.status === 'fulfilled')
          .map(r => r.value),
      )
    } catch (err) {
      console.error('[MisMaterias] Error:', err)
      setError(err instanceof ApiError
        ? `Error del servidor (${err.status}): ${err.message}`
        : 'No se pudieron cargar tus materias. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  useEffect(() => { void fetchData() }, [fetchData])

  // ── Derived totals ─────────────────────────────────────────────────────────

  const totalPensumCourses  = groups.reduce((s, g) => s + g.pensumCourses.length, 0)
  const totalActive         = groups.reduce((s, g) => s + g.activeCourses.length, 0)
  const totalCompleted      = groups.reduce((s, g) => s + g.completedCourses.length, 0)
  const totalActiveCredits  = groups.reduce((s, g) => s + g.activeCredits, 0)
  const totalCompCredits    = groups.reduce((s, g) => s + g.completedCredits, 0)
  const totalCreditsProgram = groups.reduce((s, g) => s + g.totalCredits, 0)
  const totalCreditsRemain  = Math.max(0, totalCreditsProgram - totalActiveCredits - totalCompCredits)

  const mainProgram = groups[0]?.program
  const pageTitle   = mainProgram?.program_name ?? 'Mi Progreso'

  // Progress = (completed + active) / total
  const advancedCredits   = totalActiveCredits + totalCompCredits
  const globalProgressPct = totalCreditsProgram > 0
    ? Math.min(100, Math.round((advancedCredits / totalCreditsProgram) * 100))
    : 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--canvas-warm)' }}>
      <Header />

      {/* Page header — slightly lighter band so it separates from the nav */}
      <div
        className="px-5 py-6"
        style={{
          background:  'var(--green-mid)',
          borderTop:   '1px solid rgba(255,255,255,0.10)',
          borderBottom: '1px solid rgba(0,0,0,0.20)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          {!loading && mainProgram && (
            <div className="flex items-center gap-2 mb-2">
              {mainProgram.program_code && (
                <span
                  className="text-[0.65rem] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(212,233,226,0.18)', color: 'var(--green-light)' }}
                >
                  {mainProgram.program_code}
                </span>
              )}
              {mainProgram.degree_type && (
                <span className="bg-white/10 text-white/55 text-[0.65rem] font-bold px-2.5 py-0.5 rounded-full">
                  {mainProgram.degree_type}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mb-1">
            <GraduationCap size={20} style={{ color: 'var(--green-light)' }} />
            <h1 className="text-white font-extrabold text-2xl" style={{ letterSpacing: '-0.02em' }}>{pageTitle}</h1>
          </div>

          {!loading && mainProgram?.institution && (
            <p className="text-white/38 text-sm">{mainProgram.institution}</p>
          )}

          {/* Global progress bar */}
          {!loading && !error && !noAccess && groups.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/45 text-xs font-medium">
                  {advancedCredits} de {totalCreditsProgram} créditos
                </span>
                <span className="text-sm font-extrabold" style={{ color: 'var(--green-light)' }}>
                  {globalProgressPct}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${globalProgressPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'var(--green-light)' }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-white/35 text-[0.65rem] font-medium">
                  {totalActive + totalCompleted} de {totalPensumCourses} materias
                </span>
                <span className="text-white/35 text-[0.65rem] font-medium">
                  {totalCreditsRemain} créditos restantes
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={30} className="animate-spin mb-4" style={{ color: 'var(--green-accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Cargando tu progreso…</p>
          </div>
        )}

        {/* No access */}
        {noAccess && (
          <div className="bg-white rounded-2xl border border-amber-200 p-10 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={24} className="text-amber-500" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-dark)' }}>Acceso pendiente</h3>
            <p className="text-sm max-w-md mx-auto mb-4" style={{ color: 'var(--text-muted)' }}>
              Tu cuenta aún no tiene permisos para consultar tus inscripciones.
              Contacta al administrador.
            </p>
            <button onClick={fetchData} className="text-sm font-bold hover:underline" style={{ color: 'var(--green-accent)' }}>Reintentar</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
            <AlertCircle size={30} className="text-rose-400 mx-auto mb-3" />
            <p className="font-bold mb-2" style={{ color: 'var(--text-dark)' }}>{error}</p>
            <button onClick={fetchData} className="text-sm font-bold hover:underline" style={{ color: 'var(--green-accent)' }}>Reintentar</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && !noAccess && groups.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed p-12 text-center" style={{ borderColor: 'rgba(0,0,0,0.10)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'var(--canvas-warm)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <BookOpen size={24} style={{ color: 'var(--text-faint)' }} />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-dark)' }}>No tienes materias inscritas</h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
              Tus materias aparecerán aquí una vez que estés inscrito en cursos del período académico actual.
            </p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && !noAccess && groups.length > 0 && (
          <>
            {/* 5 stat boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
              {[
                { icon: Layers,      label: 'Materias del programa', value: totalPensumCourses, iconBg: 'rgba(0,117,74,0.08)', iconColor: 'var(--green-brand)'  },
                { icon: BookOpen,    label: 'Materias cursando',     value: totalActive,        iconBg: 'rgba(0,117,74,0.09)', iconColor: 'var(--green-accent)' },
                { icon: TrendingUp,  label: 'Créditos cursando',     value: totalActiveCredits, iconBg: 'rgba(0,98,65,0.07)',  iconColor: 'var(--green-brand)'  },
                { icon: CheckSquare, label: 'Créditos aprobados',    value: totalCompCredits,   iconBg: 'rgba(0,117,74,0.08)', iconColor: 'var(--green-accent)' },
                { icon: Hash,        label: 'Créditos restantes',    value: totalCreditsRemain, iconBg: 'var(--gold-lightest)','iconColor': 'var(--gold)'       },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: stat.iconBg }}>
                    <stat.icon size={17} style={{ color: stat.iconColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.60rem] font-extrabold uppercase tracking-wider leading-tight" style={{ color: 'var(--text-faint)' }}>{stat.label}</p>
                    <p className="text-lg font-extrabold leading-tight" style={{ color: 'var(--text-dark)' }}>{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Course cards per program */}
            <div className="space-y-8">
              {groups.map((group, gi) => (
                <motion.div
                  key={group.programId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.1 }}
                >
                  {groups.length > 1 && (
                    <div className="mb-3 flex items-center gap-2">
                      <Layers size={14} style={{ color: 'var(--green-accent)' }} />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                        {group.program?.program_name ?? 'Programa'}
                      </h3>
                    </div>
                  )}

                  {/* Active courses */}
                  {group.activeCourses.length > 0 && (
                    <>
                      <p className="text-[0.68rem] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                        Cursando actualmente
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 mb-6">
                        {group.activeCourses.map((ec, i) => (
                          <CourseCard key={ec.course.id} ec={ec} index={i} gi={gi} navigate={navigate} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Completed courses */}
                  {group.completedCourses.length > 0 && (
                    <>
                      <p className="text-[0.68rem] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                        Materias aprobadas
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {group.completedCourses.map((ec, i) => (
                          <CourseCard key={ec.course.id} ec={ec} index={i} gi={gi} navigate={navigate} />
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      <footer
        className="py-4 text-center"
        style={{ background: 'var(--green-deep)', borderTop: '1px solid rgba(255,255,255,0.14)' }}
      >
        <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Academic Risk · Mi Progreso</p>
      </footer>
    </div>
  )
}

// ─── Course card component ───────────────────────────────────────────────────

function CourseCard({ ec, index, gi, navigate }: {
  ec: EnrolledCourse; index: number; gi: number
  navigate: ReturnType<typeof useNavigate>
}) {
  const isCompleted = ec.enrollmentStatus === 'COMPLETED'

  const accentColor = isCompleted ? '#16a34a' : 'var(--green-accent)'

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: gi * 0.1 + index * 0.05 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/materia/${ec.course.id}`)}
      className="bg-white rounded-2xl p-5 text-left transition-shadow duration-200 group no-tap"
      style={{ boxShadow: 'var(--shadow-card)', border: `1px solid ${isCompleted ? 'rgba(22,163,74,0.20)' : 'rgba(0,0,0,0.07)'}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span
            className="inline-block text-[0.65rem] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2"
            style={{ background: isCompleted ? 'rgba(22,163,74,0.09)' : 'rgba(0,117,74,0.09)', color: accentColor }}
          >
            {ec.course.code}
          </span>
          <h3
            className="font-bold text-[0.95rem] leading-snug transition-colors"
            style={{ color: 'var(--text-dark)' }}
          >
            {ec.course.name}
          </h3>
        </div>
        <ChevronRight size={15} className="mt-0.5 flex-shrink-0 ml-2 transition-transform group-hover:translate-x-0.5"
                      style={{ color: 'var(--text-faint)' }} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1.5">
          <Hash size={11} />
          <span>{ec.course.credits} créditos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={11} />
          <span>{ec.course.academic_period}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-1.5">
          {isCompleted ? (
            <>
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600">Aprobada</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green-accent)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--green-accent)' }}>Cursando</span>
            </>
          )}
        </div>
      </div>
    </motion.button>
  )
}
