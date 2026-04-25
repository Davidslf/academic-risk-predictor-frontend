import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Download, AlertTriangle, CheckCircle2, Upload, FileSpreadsheet } from 'lucide-react'
import type { Course, Grade } from '../types'
import { students } from '../data/mockData'
import { useGradeCalculation } from '../hooks/useGradeCalculation'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import GradeTable from '../components/GradeTable'
import ComponentsConfig from '../components/ComponentsConfig'
import ImportModal from '../components/ImportModal'

interface Props {
  course: Course
  grades: Grade[]
  lastSaved: Date | null
  onUpdateGrade: (studentId: string, componentId: string, value: number | null) => void
  onUpdateComponents: (courseId: string, components: Course['components']) => void
  onUpdateCuts: (courseId: string, cuts: Course['cuts']) => void
  onBack: () => void
  onLogout: () => void
}

type Tab = 'grades' | 'config'

export default function GradesPage({
  course, grades, lastSaved,
  onUpdateGrade, onUpdateComponents, onUpdateCuts, onBack,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('grades')
  const [showImport, setShowImport] = useState(false)
  const { user } = useAuth()
  const totalPct  = course.components.reduce((s, c) => s + c.percentage, 0)
  const cutsTotal = (course.cuts ?? []).reduce((s, c) => s + c.percentage, 0)
  const allValid  = totalPct === 100 && cutsTotal === 100
  const { atRiskCount, completionPct, courseStudents } = useGradeCalculation(course, grades, students)
  const toast = useToast()

  const handleImport = (importedGrades: Grade[]) => {
    let count = 0
    for (const g of importedGrades) {
      if (g.value !== null) {
        onUpdateGrade(g.studentId, g.componentId, g.value)
        count++
      }
    }
    toast.success(
      `${count} notas importadas`,
      `Las calificaciones de ${course.name} fueron actualizadas correctamente.`
    )
  }

  return (
    <div className="min-h-screen bg-usb-canvas flex flex-col">
      <Header
        lastSaved={lastSaved}
        subtitle={`${course.code} · ${course.name}`}
      />

      {/* Breadcrumb + actions */}
      <div className="bg-white border-b border-usb-border px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-usb-muted transition-colors font-medium"
            style={{ ['--tw-hover-color' as string]: 'var(--green-accent)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--green-accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}
          >
            <ChevronLeft size={14} />
            <span className="text-xs">Mis materias</span>
          </button>
          <span className="text-usb-border">/</span>
          <span className="text-xs font-bold" style={{ color: 'var(--green-accent)' }}>{course.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-1.5 rounded-full transition-all shadow-sm"
            style={{ background: 'var(--green-accent)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-brand)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--green-accent)')}
          >
            <Upload size={12} />
            Importar notas
          </button>
          <button
            onClick={() => toast.info('Exportación', 'Disponible en versión con backend conectado.')}
            className="flex items-center gap-1.5 text-xs font-semibold text-usb-muted border border-usb-border rounded-full px-3 py-1.5 transition-all"
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--green-accent)'; e.currentTarget.style.borderColor = 'var(--green-accent)' }}
            onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = '' }}
          >
            <Download size={12} />
            Exportar
          </button>
        </div>
      </div>

      <main className="flex-1 px-5 py-6 max-w-7xl mx-auto w-full">
        {/* Course info + risk summary */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card border border-usb-border p-5 mb-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,117,74,0.10)', color: 'var(--green-accent)' }}>
                  <FileSpreadsheet size={10} />
                  {course.code} · {course.group}
                </span>
                <span className="inline-flex items-center bg-usb-canvas text-usb-muted text-[0.65rem] font-semibold px-2.5 py-1 rounded-full border border-usb-border">
                  2024-I
                </span>
                <span className="inline-flex items-center bg-green-50 text-green-700 text-[0.65rem] font-semibold px-2.5 py-1 rounded-full border border-green-200">
                  Corte 1 · 40%
                </span>
              </div>
              <h2 className="font-extrabold text-lg text-usb-text leading-tight">{course.name}</h2>
              <p className="text-xs text-usb-muted mt-0.5">{user?.name}</p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-xl font-extrabold text-usb-text">{courseStudents.length}</p>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-usb-muted">Estudiantes</p>
              </div>
              <div className="w-px h-8 bg-usb-border" />
              <div className="text-center">
                <p className="text-xl font-extrabold" style={{ color: 'var(--green-accent)' }}>{completionPct}%</p>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-usb-muted">Avance</p>
              </div>
              <div className="w-px h-8 bg-usb-border" />
              {atRiskCount > 0 ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2">
                  <AlertTriangle size={14} />
                  <div>
                    <p className="font-bold text-xs">{atRiskCount} en riesgo alto</p>
                    <p className="text-[0.62rem] opacity-75">Requieren atención</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 py-2">
                  <CheckCircle2 size={14} />
                  <div>
                    <p className="font-bold text-xs">Sin riesgo alto</p>
                    <p className="text-[0.62rem] opacity-75">Grupo estable</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-4 border-t border-usb-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">Progreso de ingreso</span>
              <span className="text-[0.75rem] font-extrabold" style={{ color: 'var(--green-accent)' }}>{completionPct}%</span>
            </div>
            <div className="h-2 bg-usb-canvas rounded-full overflow-hidden border border-usb-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'var(--green-accent)' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-usb-border rounded-2xl p-1 w-fit mb-4">
          {[
            { key: 'grades', label: 'Calificaciones' },
            { key: 'config', label: `Distribución de notas (${totalPct}/100%)`, warn: !allValid },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'text-white shadow-sm'
                  : 'text-usb-muted hover:text-usb-text'
              }`}
              style={activeTab === tab.key ? { background: 'var(--green-accent)' } : {}}
            >
              {tab.label}
              {tab.warn && (
                <span className={`w-2 h-2 rounded-full ${activeTab === tab.key ? 'bg-white' : 'bg-amber-400'}`} />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-card border border-usb-border overflow-hidden"
        >
          {activeTab === 'grades' && (
            <GradeTable course={course} grades={grades} onUpdateGrade={onUpdateGrade} />
          )}
          {activeTab === 'config' && (
            <div className="p-5">
              <p className="text-sm text-usb-muted mb-4">
                Define los cortes y sus actividades. Cada corte tiene un peso porcentual y sus actividades
                deben sumar exactamente ese porcentaje. El total de los tres cortes debe ser <span className="font-bold" style={{ color: 'var(--green-accent)' }}>100%</span>.
              </p>
              <ComponentsConfig
                cuts={course.cuts ?? []}
                components={course.components}
                onChangeCuts={cuts => onUpdateCuts(course.id, cuts)}
                onChange={comps => onUpdateComponents(course.id, comps)}
              />
            </div>
          )}
        </motion.div>
      </main>

      <footer className="bg-white border-t border-usb-border px-5 py-3 text-center">
        <p className="text-xs text-usb-faint">
          Academic Risk · Portal de Calificaciones · 2024-I
        </p>
      </footer>

      {showImport && (
        <ImportModal
          course={course}
          students={students}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
