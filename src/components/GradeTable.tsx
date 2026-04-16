import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Course, Grade } from '../types'
import { students as allStudents } from '../data/mockData'
import { gradeColor, getRisk } from '../utils/gradeCalculator'
import { useGradeCalculation } from '../hooks/useGradeCalculation'
import RiskBadge from './RiskBadge'

// Risk % derived from weighted grade (0–5 scale)
// grade 5.0 → 0%  |  grade 3.0 → 40%  |  grade 1.0 → 80%
function riskPercent(grade: number | null): number | null {
  if (grade === null) return null
  return Math.max(0, Math.min(100, Math.round((1 - grade / 5) * 100)))
}

function RiskBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-usb-border text-xs font-mono">—</span>
  const color = pct >= 60 ? 'bg-risk-high' : pct >= 35 ? 'bg-risk-med' : 'bg-risk-low'
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

interface EditableCellProps {
  value: number | null
  onSave: (v: number | null) => void
}

function EditableCell({ value, onSave }: EditableCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const commit = () => {
    const n = parseFloat(draft.replace(',', '.'))
    onSave(draft === '' || isNaN(n) ? null : Math.min(5, Math.max(0, Math.round(n * 10) / 10)))
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commit() } }}
        className="input-grade mx-auto block"
        maxLength={4}
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

interface Props {
  course: Course
  grades: Grade[]
  onUpdateGrade: (studentId: string, componentId: string, value: number | null) => void
}

export default function GradeTable({ course, grades, onUpdateGrade }: Props) {
  const { courseStudents, gradeMap, totals, componentAvg } = useGradeCalculation(course, grades, allStudents)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-usb-border bg-usb-canvas">
            <th className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted w-28">Código</th>
            <th className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">Estudiante</th>
            {course.components.map(comp => (
              <th key={comp.id} className="text-center px-3 py-3 min-w-[90px]">
                <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">{comp.name}</span>
                <span className="block text-[0.7rem] font-bold text-ar-cyan mt-0.5">{comp.percentage}%</span>
              </th>
            ))}
            <th className="text-center px-3 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted min-w-[70px]">Total</th>
            <th className="text-center px-3 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted min-w-[80px]">
              <span className="block">% Riesgo</span>
              <span className="block text-[0.58rem] font-normal text-usb-faint normal-case">Academic Risk</span>
            </th>
            <th className="text-center px-3 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted min-w-[100px]">Estado</th>
          </tr>
        </thead>
        <tbody>
          {courseStudents.map((student, idx) => {
            const total = totals[student.id]
            const risk = getRisk(total)
            const riskPct = riskPercent(total)
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
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
