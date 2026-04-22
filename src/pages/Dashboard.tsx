import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, BookOpen, ArrowLeft, Layers } from 'lucide-react'
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
    target: '#tour-prof-nav',
    title: '🧭 Navegación del docente',
    content: 'Accede al Dashboard con el resumen de tus cursos, o al portal de Calificaciones para gestionar las notas de cada estudiante.',
    placement: 'bottom',
  },
  {
    target: '#tour-stats',
    title: '📈 Resumen del período',
    content: 'Aquí ves de un vistazo cuántas materias tienes asignadas, el total de estudiantes y el corte académico activo.',
    placement: 'bottom',
  },
  {
    target: '#tour-courses',
    title: '📚 Tus materias',
    content: 'Haz clic en cualquier materia para abrir el portal de calificaciones, donde podrás ingresar notas y ver el indicador de riesgo de cada estudiante.',
    placement: 'top',
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
  
  // Fix for user name if it's an email
  const isEmail = user?.name.includes('@')
  const displayName = isEmail ? user?.name.split('@')[0] : user?.name.split(' ')[0]
  const firstName = isEmail ? '' : (user?.name.split(' ').slice(-2)[0] ?? '')

  const coursesByProgram = courses.reduce((acc, course) => {
    const prog = course.program || 'Otras materias'
    if (!acc[prog]) acc[prog] = []
    acc[prog].push(course)
    return acc
  }, {} as Record<string, Course[]>)

  
  const programs = Object.keys(coursesByProgram)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)

  useEffect(() => {
    // If a selected program becomes empty or doesn't exist, reset to gallery
    if (selectedProgram && !programs.includes(selectedProgram)) {
      setSelectedProgram(null)
    }
  }, [programs, selectedProgram])

  const visibleCourses = selectedProgram ? (coursesByProgram[selectedProgram] || []) : []

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
          <h2 className="text-2xl font-extrabold text-usb-text capitalize">
            Buenos días, {displayName} {firstName} 👋
          </h2>
          <p className="text-usb-muted text-sm mt-1">Docente · Academic Risk</p>
        </motion.div>

        {/* Stats row */}
        <div id="tour-stats" className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: BookOpen, label: 'Materias', value: courses.length, color: 'text-ar-cyan', bg: 'bg-ar-cyan/10' },
            { icon: Users, label: 'Estudiantes', value: totalStudents, color: 'text-violet-500', bg: 'bg-violet-50' },
            { icon: TrendingUp, label: 'Corte activo', value: 'Corte 1 · 40%', color: 'text-risk-low', bg: 'bg-risk-low-bg' },
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

        {/* Main Content Area */}
        {programs.length === 0 ? (
          <div className="mb-6 p-10 bg-white rounded-2xl border-2 border-dashed border-usb-border text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-usb-border">
              <BookOpen size={24} className="text-usb-faint" />
            </div>
            <h3 className="text-usb-text font-bold text-lg mb-2">Aún no tienes materias asignadas</h3>
            <p className="text-usb-muted text-sm max-w-md mx-auto">
              Tus áreas y materias aparecerán aquí automáticamente una vez que seas asignado a uno o más cursos en el período académico actual.
            </p>
          </div>
        ) : !selectedProgram ? (
          // PROGRAMS GALLERY VIEW
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-usb-muted">
                Tus Programas
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {programs.map((prog, i) => (
                <motion.button
                  key={prog}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedProgram(prog)}
                  className="bg-white rounded-2xl p-6 border border-usb-border shadow-card hover:shadow-card-hover hover:border-ar-cyan/50 text-left transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-ar-cyan/10 flex items-center justify-center mb-4 text-ar-cyan group-hover:scale-110 transition-transform">
                    <Layers size={22} />
                  </div>
                  <h4 className="font-extrabold text-usb-text text-lg leading-tight mb-2 group-hover:text-ar-cyan transition-colors">
                    {prog}
                  </h4>
                  <p className="text-usb-muted text-sm mt-auto font-medium">
                    {coursesByProgram[prog].length} materia{coursesByProgram[prog].length !== 1 ? 's' : ''} asignada{coursesByProgram[prog].length !== 1 ? 's' : ''}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          // COURSES DRILL-DOWN VIEW
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => setSelectedProgram(null)}
              className="flex items-center gap-2 text-sm font-bold text-usb-muted hover:text-ar-cyan transition-colors mb-6 group"
            >
              <div className="p-1.5 rounded-full bg-white border border-usb-border group-hover:border-ar-cyan/30 shadow-sm">
                <ArrowLeft size={16} />
              </div>
              Volver a programas
            </button>
            
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ar-cyan mb-1">
                  Materias del programa
                </h3>
                <h2 className="text-xl font-extrabold text-usb-text">
                  {selectedProgram}
                </h2>
              </div>
              <span className="text-xs font-medium text-usb-faint bg-white px-3 py-1.5 rounded-full border border-usb-border">
                {visibleCourses.length} curso{visibleCourses.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div id="tour-courses" className="grid gap-3 sm:grid-cols-2">
              {visibleCourses.map((course, i) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  grades={grades}
                  onClick={() => onSelectCourse(course)}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
