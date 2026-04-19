import { motion } from 'framer-motion'
import { TrendingUp, Users, BookOpen } from 'lucide-react'
import type { Step } from 'react-joyride'
import type { Course, Grade } from '../types'
import { students } from '../data/mockData'
import { useGradeCalculation } from '../hooks/useGradeCalculation'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import SubjectCard from '../components/SubjectCard'
import TourGuide from '../components/TourGuide'
import { useTour } from '../hooks/useTour'

interface Props {
  courses: Course[]
  grades: Grade[]
  onSelectCourse: (c: Course) => void
  onLogout: () => void
}

const TOUR_STEPS: Step[] = [
  {
    target:         '#tour-prof-nav',
    title:          '🧭 Navegación del docente',
    content:        'Accede al Dashboard con el resumen de tus cursos, o al portal de Calificaciones para gestionar las notas de cada estudiante.',
    placement:      'bottom',
  },
  {
    target:         '#tour-stats',
    title:          '📈 Resumen del período',
    content:        'Aquí ves de un vistazo cuántas materias tienes asignadas, el total de estudiantes y el corte académico activo.',
    placement:      'bottom',
  },
  {
    target:         '#tour-courses',
    title:          '📚 Tus materias',
    content:        'Haz clic en cualquier materia para abrir el portal de calificaciones, donde podrás ingresar notas y ver el indicador de riesgo de cada estudiante.',
    placement:      'top',
  },
]

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
  const { run, onTourEnd } = useTour('professor-dashboard')
  const totalStudents = new Set(courses.flatMap(c => c.studentIds)).size
  const firstName = user?.name.split(' ').slice(-2)[0] ?? ''

  return (
    <div className="min-h-screen bg-usb-canvas flex flex-col">
      <TourGuide run={run} steps={TOUR_STEPS} onEnd={onTourEnd} />
      <Header />

      {/* Period ribbon */}
      <div className="bg-white border-b border-usb-border px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">Período 2024-I</span>
          <span className="text-usb-border">·</span>
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">Semestre Activo</span>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: 'Corte 1', pct: '40%', active: true },
            { label: 'Corte 2', pct: '30%', active: false },
            { label: 'Corte 3', pct: '30%', active: false },
          ].map(c => (
            <div key={c.label} className={`flex items-center gap-1.5 text-xs font-semibold ${c.active ? 'text-ar-cyan' : 'text-usb-faint'}`}>
              <div className={`w-2 h-2 rounded-full ${c.active ? 'bg-ar-cyan' : 'bg-usb-border'}`} />
              {c.label} · {c.pct}
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 px-5 py-8 max-w-5xl mx-auto w-full">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-extrabold text-usb-text">
            Buenos días, {user?.name.split(' ')[0]} {firstName} 👋
          </h2>
          <p className="text-usb-muted text-sm mt-1">Docente · Academic Risk</p>
        </motion.div>

        {/* Stats row */}
        <div id="tour-stats" className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: BookOpen,   label: 'Materias',     value: courses.length,       color: 'text-ar-cyan',   bg: 'bg-ar-cyan/10' },
            { icon: Users,      label: 'Estudiantes',  value: totalStudents,        color: 'text-violet-500', bg: 'bg-violet-50' },
            { icon: TrendingUp, label: 'Corte activo', value: 'Corte 1 · 40%',     color: 'text-risk-low',  bg: 'bg-risk-low-bg' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-4 shadow-card border border-usb-border flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">{stat.label}</p>
                <p className="text-lg font-extrabold text-usb-text leading-tight">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Courses */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-usb-muted">Materias asignadas</h3>
          <span className="text-xs text-usb-faint">{courses.length} curso{courses.length !== 1 ? 's' : ''}</span>
        </div>
        <div id="tour-courses" className="grid gap-3 sm:grid-cols-2">
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
