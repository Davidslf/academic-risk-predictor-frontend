import { motion } from 'framer-motion'
import { Users, BookOpen, ChevronRight, AlertTriangle } from 'lucide-react'
import type { Course } from '../types'

interface Props {
  course: Course
  studentCount: number
  completionPct: number
  atRiskCount: number
  onClick: () => void
  index: number
}

export default function SubjectCard({ course, studentCount, completionPct, atRiskCount, onClick, index }: Props) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      /* DESIGN.md §4 Card: white bg, 12px radius, 2-layer shadow, warm border */
      className="w-full bg-white rounded-card shadow-card hover:shadow-card-hover
                 border border-usb-border hover:border-sbucks-accent/30
                 transition-all duration-200 text-left group"
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            {/* Course code badge — accent green tint */}
            <span className="inline-block bg-sbucks-accent/10 text-sbucks-accent text-[0.65rem] font-bold uppercase px-2.5 py-1 rounded-pill mb-2"
                  style={{ letterSpacing: '0.08em' }}>
              {course.code} · {course.group}
            </span>
            <h3 className="font-bold text-[0.95rem] text-ink leading-snug" style={{ letterSpacing: '-0.01em' }}>
              {course.name}
            </h3>
          </div>
          <ChevronRight
            size={16}
            className="text-usb-faint group-hover:text-sbucks-accent transition-colors mt-1 flex-shrink-0 ml-2"
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-ink-soft text-xs">
            <Users size={13} />
            <span>{studentCount} estudiantes</span>
          </div>
          <div className="flex items-center gap-1.5 text-ink-soft text-xs">
            <BookOpen size={13} />
            <span>{course.components.length} componentes</span>
          </div>
          {atRiskCount > 0 && (
            <div className="flex items-center gap-1 text-xs font-semibold text-risk-high ml-auto">
              <AlertTriangle size={12} />
              <span>{atRiskCount} en riesgo</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-4 border-t border-usb-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[0.65rem] font-bold text-ink-faint uppercase" style={{ letterSpacing: '0.08em' }}>
              Avance Corte 1
            </span>
            <span className="text-[0.78rem] font-bold text-sbucks-accent">{completionPct}%</span>
          </div>
          {/* Track */}
          <div className="h-1.5 bg-pg-ceramic rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.6, delay: index * 0.07 + 0.2, ease: 'easeOut' }}
              className="h-full bg-sbucks-accent rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.button>
  )
}
