import { motion } from 'framer-motion'
import { TrendingUp, Users, BookOpen } from 'lucide-react'
import type { Course, Grade } from '../types'
import { students } from '../data/mockData'
import { useGradeCalculation } from '../hooks/useGradeCalculation'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import SubjectCard from '../components/SubjectCard'

interface Props {
  courses: Course[]
  grades: Grade[]
  onSelectCourse: (c: Course) => void
  onLogout: () => void
}

function CourseRow({ course, grades, onClick, index }: {
  course: Course; grades: Grade[]; onClick: () => void; index: number
}) {
  const { atRiskCount, completionPct } = useGradeCalculation(course, grades, students)
  return (
    <SubjectCard
      course={course}
      studentCount={course.studentIds.length}
      completionPct={completionPct}
      atRiskCount={atRiskCount}
      onClick={onClick}
      index={index}
    />
  )
}

export default function Dashboard({ courses, grades, onSelectCourse }: Props) {
  const { user } = useAuth()
  const totalStudents = new Set(courses.flatMap(c => c.studentIds)).size
  const firstName = user?.name.split(' ').slice(-2)[0] ?? ''

  return (
    // DESIGN.md §5 — pg-warm as page background
    <div className="min-h-screen bg-pg-warm flex flex-col">
      <Header />

      {/* Period ribbon — white with warm border (content card surface) */}
      <div className="bg-white border-b border-usb-border px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[0.65rem] font-bold text-ink-faint uppercase" style={{ letterSpacing: '0.1em' }}>
            Período 2024-I
          </span>
          <span className="text-usb-border">·</span>
          <span className="text-[0.65rem] font-bold text-ink-faint uppercase" style={{ letterSpacing: '0.1em' }}>
            Semestre Activo
          </span>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: 'Corte 1', pct: '40%', active: true  },
            { label: 'Corte 2', pct: '30%', active: false },
            { label: 'Corte 3', pct: '30%', active: false },
          ].map(c => (
            <div
              key={c.label}
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                c.active ? 'text-sbucks-accent' : 'text-ink-faint'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${c.active ? 'bg-sbucks-accent' : 'bg-usb-border'}`} />
              {c.label} · {c.pct}
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-extrabold text-sbucks-green" style={{ letterSpacing: '-0.016em' }}>
            Buenos días, {user?.name.split(' ')[0]} {firstName} 👋
          </h2>
          <p className="text-ink-soft text-sm mt-1" style={{ letterSpacing: '-0.01em' }}>
            Docente · Academic Risk
          </p>
        </motion.div>

        {/* Stats row — DESIGN.md §4 Card: white bg, 12px radius, 2-layer shadow */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: BookOpen,   label: 'Materias',     value: courses.length,   color: 'text-sbucks-accent',  bg: 'bg-sbucks-accent/10'  },
            { icon: Users,      label: 'Estudiantes',  value: totalStudents,    color: 'text-violet-600',     bg: 'bg-violet-50'          },
            { icon: TrendingUp, label: 'Corte activo', value: 'Corte 1 · 40%', color: 'text-risk-low',       bg: 'bg-risk-low-bg'        },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-card shadow-card border border-usb-border flex items-center gap-3 p-4"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-[0.65rem] font-bold text-ink-faint uppercase" style={{ letterSpacing: '0.08em' }}>
                  {stat.label}
                </p>
                <p className="text-lg font-extrabold text-ink leading-tight" style={{ letterSpacing: '-0.016em' }}>
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Courses */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold text-ink-faint uppercase" style={{ letterSpacing: '0.1em' }}>
            Materias asignadas
          </h3>
          <span className="text-xs text-ink-faint">
            {courses.length} curso{courses.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((course, i) => (
            <CourseRow
              key={course.id}
              course={course}
              grades={grades}
              onClick={() => onSelectCourse(course)}
              index={i}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
