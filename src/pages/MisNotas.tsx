import { motion } from 'framer-motion'
import { BookOpen, AlertTriangle, CheckCircle2, Minus } from 'lucide-react'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useGrades } from '../context/GradesContext'
import { students } from '../data/mockData'
import { calcWeightedTotal, getRisk, gradeColor } from '../utils/gradeCalculator'

function GradeCell({ value }: { value: number | null }) {
  if (value === null) return (
    <span className="inline-flex items-center justify-center w-14 text-ink-faint font-mono text-xs">
      <Minus size={12} />
    </span>
  )
  return (
    <span className={`inline-block w-14 text-center font-mono font-bold text-sm ${gradeColor(value)}`}>
      {value.toFixed(1)}
    </span>
  )
}

export default function MisNotas() {
  const { user } = useAuth()
  const { courseList, grades } = useGrades()

  const studentId = user?.studentId ?? ''
  const student = students.find(s => s.id === studentId)
  const myCourses = courseList.filter(c => c.studentIds.includes(studentId))

  const getCourseGrades = (course: typeof courseList[0]) => {
    const gradeMap: Record<string, number | null> = {}
    for (const comp of course.components) {
      const g = grades.find(g => g.studentId === studentId && g.componentId === comp.id)
      gradeMap[comp.id] = g?.value ?? null
    }
    return gradeMap
  }

  return (
    // DESIGN.md §5 — pg-warm page background
    <div className="min-h-screen bg-pg-warm flex flex-col">
      <Header />

      {/* Page header band — DESIGN.md §4 Feature Band: House Green */}
      <div className="bg-sbucks-house border-b border-white/10 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-sbucks-light" />
            <h1 className="text-white font-extrabold text-xl" style={{ letterSpacing: '-0.016em' }}>
              Mis Notas
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.58)', letterSpacing: '-0.01em' }}>
            {student?.name} · {student?.program} · Semestre {student?.semester} · Corte 1 (40%)
          </p>
        </div>
      </div>

      {/* White content section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        {myCourses.length === 0 ? (
          <div className="bg-white rounded-card border border-usb-border shadow-card p-12 text-center">
            <BookOpen size={32} className="text-ink-faint mx-auto mb-3" />
            <p className="font-bold text-ink" style={{ letterSpacing: '-0.01em' }}>
              No estás inscrito en ninguna materia
            </p>
          </div>
        ) : (
          myCourses.map((course, idx) => {
            const gradeMap = getCourseGrades(course)
            const total = calcWeightedTotal(gradeMap, course.components)
            const risk = getRisk(total)
            const totalPct = course.components.reduce((s, c) => s + c.percentage, 0)

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                /* DESIGN.md §4 Card: white, 12px radius, 2-layer shadow */
                className="bg-white rounded-card border border-usb-border shadow-card overflow-hidden"
              >
                {/* Course header */}
                <div className="px-5 py-4 border-b border-usb-border flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {/* Course code badge — sbucks-accent tint */}
                      <span className="bg-sbucks-accent/10 text-sbucks-accent text-[0.62rem] font-bold uppercase px-2.5 py-1 rounded-pill"
                            style={{ letterSpacing: '0.08em' }}>
                        {course.code} · {course.group}
                      </span>
                      <span className="bg-pg-warm text-ink-faint text-[0.62rem] font-semibold px-2.5 py-1 rounded-pill border border-usb-border">
                        2024-I
                      </span>
                    </div>
                    <h2 className="font-extrabold text-ink" style={{ letterSpacing: '-0.01em' }}>
                      {course.name}
                    </h2>
                  </div>

                  {/* Total + risk */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      {total !== null ? (
                        <>
                          <p className={`text-2xl font-extrabold ${gradeColor(total)}`}
                             style={{ letterSpacing: '-0.016em' }}>
                            {total.toFixed(2)}
                          </p>
                          <p className="text-[0.62rem] font-bold text-ink-faint uppercase" style={{ letterSpacing: '0.08em' }}>
                            Promedio {totalPct}%
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-extrabold text-ink-faint" style={{ letterSpacing: '-0.016em' }}>—</p>
                          <p className="text-[0.62rem] font-bold text-ink-faint uppercase" style={{ letterSpacing: '0.08em' }}>
                            Sin notas
                          </p>
                        </>
                      )}
                    </div>
                    {risk && (
                      /* Risk badge — full-pill per DESIGN.md */
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill border text-xs font-bold ${
                        risk === 'high'   ? 'bg-risk-high-bg border-risk-high/20 text-risk-high'
                        : risk === 'medium' ? 'bg-risk-med-bg border-risk-med/20 text-risk-med'
                        : 'bg-risk-low-bg border-risk-low/20 text-risk-low'
                      }`}>
                        {risk === 'high' ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                        {risk === 'high' ? 'Riesgo alto' : risk === 'medium' ? 'Riesgo medio' : 'En buen estado'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Components table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-pg-warm border-b border-usb-border">
                        <th className="text-left px-5 py-2.5 text-[0.65rem] font-bold text-ink-faint uppercase"
                            style={{ letterSpacing: '0.08em' }}>
                          Componente
                        </th>
                        <th className="text-center px-4 py-2.5 text-[0.65rem] font-bold text-ink-faint uppercase"
                            style={{ letterSpacing: '0.08em' }}>
                          Peso
                        </th>
                        <th className="text-center px-4 py-2.5 text-[0.65rem] font-bold text-ink-faint uppercase"
                            style={{ letterSpacing: '0.08em' }}>
                          Nota
                        </th>
                        <th className="text-center px-4 py-2.5 text-[0.65rem] font-bold text-ink-faint uppercase"
                            style={{ letterSpacing: '0.08em' }}>
                          Aporte
                        </th>
                        <th className="px-5 py-2.5 text-[0.65rem] font-bold text-ink-faint uppercase"
                            style={{ letterSpacing: '0.08em' }}>
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.components.map(comp => {
                        const val = gradeMap[comp.id]
                        const aporte = val !== null ? (val * comp.percentage) / 100 : null
                        const compRisk = val !== null ? (val < 3.0 ? 'high' : val < 3.8 ? 'medium' : 'low') : null
                        return (
                          <tr key={comp.id} className="border-b border-usb-border last:border-0 hover:bg-pg-warm transition-colors">
                            <td className="px-5 py-3 font-medium text-ink-soft" style={{ letterSpacing: '-0.01em' }}>
                              {comp.name}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sbucks-accent font-bold text-xs">{comp.percentage}%</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <GradeCell value={val} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {aporte !== null ? (
                                <span className="font-mono text-xs text-ink-soft">{aporte.toFixed(3)}</span>
                              ) : (
                                <span className="text-ink-faint text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              {compRisk === null ? (
                                <span className="text-ink-faint text-xs">Sin registrar</span>
                              ) : compRisk === 'high' ? (
                                <span className="flex items-center gap-1 text-xs font-semibold text-risk-high">
                                  <AlertTriangle size={11} /> Por debajo del mínimo
                                </span>
                              ) : compRisk === 'medium' ? (
                                <span className="text-xs font-semibold text-risk-med">Puede mejorar</span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-semibold text-risk-low">
                                  <CheckCircle2 size={11} /> Aprobado
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-pg-warm border-t-2 border-usb-border">
                        <td className="px-5 py-3 text-[0.65rem] font-bold text-ink-faint uppercase"
                            style={{ letterSpacing: '0.08em' }}
                            colSpan={2}>
                          Total corte ({totalPct}%)
                        </td>
                        <td />
                        <td className="px-4 py-3 text-center">
                          {total !== null ? (
                            <span className={`font-mono font-extrabold text-sm ${gradeColor(total)}`}>
                              {total.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-ink-faint text-xs font-mono">—</span>
                          )}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            )
          })
        )}
      </main>

      {/* Footer — DESIGN.md: House Green bookend */}
      <footer className="bg-sbucks-house border-t border-white/10 py-4 text-center">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)', letterSpacing: '-0.01em' }}>
          Academic Risk · Mis Notas · Corte 1 · 2024-I
        </p>
      </footer>
    </div>
  )
}
