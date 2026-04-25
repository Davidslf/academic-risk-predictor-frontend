/**
 * Admin panel — real backend-connected.
 * Tabs: Universidades · Programas · Materias · Usuarios
 * No mock data, no localStorage state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, BookOpen, Users, BookMarked,
  Plus, X, LogOut, ShieldCheck, GraduationCap,
  Loader2, ChevronDown, ChevronUp, AlertCircle, Search,
  Pencil, Eye, Clock, History, CheckCircle2, XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { api } from '../services/api'
import { programService } from '../services/programService'
import type { BackendUniversity, BackendProgram, BackendCampus } from '../services/programService'
import { courseService } from '../services/courseService'
import type { BackendCourse } from '../services/courseService'
import { userService } from '../services/userService'
import type { UserRole, AuditLogEntry, UserUpdatePayload } from '../services/userService'
import type { BackendUser } from '../services/authService'
import { notificationService } from '../services/notificationService'
import { friendlyError } from '../services/errorMessages'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

// ─── Shared helpers ───────────────────────────────────────────────────────────

// 'universidades' tab is hidden for now — code preserved for future feature
type Tab = 'universidades' | 'programas' | 'materias' | 'usuarios'

const DEGREE_TYPES = ['PREG', 'POST', 'TEC'] as const
type DegreeType = typeof DEGREE_TYPES[number]

const DEGREE_LABELS: Record<DegreeType, string> = {
  PREG: 'Pregrado',
  POST: 'Posgrado',
  TEC:  'Técnico',
}

const DEGREE_COLORS: Record<DegreeType, string> = {
  PREG: 'bg-green-accent/10 text-green-accent',
  POST: 'bg-violet-50 text-violet-600',
  TEC:  'bg-amber-50 text-amber-600',
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT:   'Estudiante',
  PROFESSOR: 'Docente',
  ADMIN:     'Admin',
}

const ROLE_BADGE_STYLE: Record<string, React.CSSProperties> = {
  STUDENT:   { background: 'rgba(0,117,74,0.12)', color: '#00754A' },
  PROFESSOR: { background: 'rgba(124,58,237,0.10)', color: '#7c3aed' },
  ADMIN:     { background: 'rgba(220,38,38,0.10)', color: '#dc2626' },
}

function Badge({ label, colorClass, style }: { label: string; colorClass?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.68rem] font-bold ${colorClass ?? ''}`}
      style={style}
    >
      {label}
    </span>
  )
}

function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-green-accent" />
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-usb-canvas border border-usb-border flex items-center justify-center">
        <Icon size={24} className="text-usb-faint" />
      </div>
      <p className="text-usb-muted font-medium text-sm max-w-xs">{message}</p>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}

// ─── Input / Select shared styles ────────────────────────────────────────────

const inputClass =
  'w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-accent focus:ring-2 focus:ring-green-accent/20 transition-all'

const selectClass =
  'w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-accent focus:ring-2 focus:ring-green-accent/20 transition-all appearance-none'

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-1.5">
      {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  title, icon: Icon, onClose, children, footer,
}: {
  title:    string
  icon:     React.ElementType
  onClose:  () => void
  children: React.ReactNode
  footer?:  React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-modal w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header — always visible */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: 'var(--green-deep)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-accent/20 border border-green-accent/30 flex items-center justify-center">
              <Icon size={18} className="text-green-accent" />
            </div>
            <h2 className="text-white font-bold text-base">{title}</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">{children}</div>

        {/* Footer — always visible, outside scroll area */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-usb-border bg-white">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Tab: Universidades ───────────────────────────────────────────────────────

function CreateUniversityModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast()
  const [name, setName]       = useState('')
  const [code, setCode]       = useState('')
  const [city, setCity]       = useState('')
  const [country, setCountry] = useState('Colombia')
  const [saving, setSaving]   = useState(false)

  const canSave = name.trim() && code.trim() && city.trim() && country.trim()

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await programService.createUniversity({ name: name.trim(), code: code.trim(), country: country.trim(), city: city.trim() })
      toast.success('Universidad creada', name.trim())
      onCreated()
      onClose()
    } catch (err) {
      toast.error('Error al crear universidad', friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <div className="flex gap-3">
      <button onClick={onClose} className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all">
        Cancelar
      </button>
      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="flex-1 py-3 rounded-full text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed" style={{ background: '#00754A' }}
      >
        {saving ? <Spinner size={16} /> : null}
        Guardar
      </button>
    </div>
  )

  return (
    <Modal title="Nueva Universidad" icon={Building2} onClose={onClose} footer={footer}>
      <div className="p-6 space-y-4">
        <div>
          <FieldLabel required>Nombre de la universidad</FieldLabel>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Universidad Nacional de Colombia" autoFocus />
        </div>
        <div>
          <FieldLabel required>Código</FieldLabel>
          <input className={inputClass} value={code} onChange={e => setCode(e.target.value)} placeholder="Ej: UNAL" />
        </div>
        <div>
          <FieldLabel required>Ciudad</FieldLabel>
          <input className={inputClass} value={city} onChange={e => setCity(e.target.value)} placeholder="Ej: Bogotá" />
        </div>
        <div>
          <FieldLabel required>País</FieldLabel>
          <input className={inputClass} value={country} onChange={e => setCountry(e.target.value)} placeholder="Ej: Colombia" />
        </div>
      </div>
    </Modal>
  )
}

function UniversidadesTab() {
  const toast = useToast()
  const [universities, setUniversities] = useState<BackendUniversity[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [showModal, setShowModal]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await programService.listUniversities()
      setUniversities(res.data)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    programService.listUniversities()
      .then(res => { if (!cancelled) setUniversities(res.data) })
      .catch(err => { if (!cancelled) setError(friendlyError(err)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-usb-text">
          Universidades
          {universities.length > 0 && (
            <span className="ml-2 text-xs font-bold bg-green-accent/10 text-green-accent px-2 py-0.5 rounded-full">
              {universities.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-accent hover:bg-green-brand text-white font-bold rounded-full px-5 py-2.5 text-sm transition-all"
        >
          <Plus size={15} /> Nueva Universidad
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : universities.length === 0 && !error ? (
        <EmptyState icon={Building2} message="No hay universidades registradas. Crea la primera." />
      ) : (
        <div className="bg-white rounded-2xl border border-usb-border overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-usb-border bg-usb-canvas">
                {['Nombre', 'Código', 'Ciudad', 'País', 'Estado', 'Creada'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {universities.map((uni, i) => (
                <motion.tr
                  key={uni.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-usb-border last:border-0 hover:bg-usb-canvas transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-usb-text">{uni.name}</td>
                  <td className="px-4 py-3 text-usb-muted font-mono text-xs">{uni.code}</td>
                  <td className="px-4 py-3 text-usb-muted">{uni.city}</td>
                  <td className="px-4 py-3 text-usb-muted">{uni.country}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={uni.active ? 'Activa' : 'Inactiva'}
                      colorClass={uni.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}
                    />
                  </td>
                  <td className="px-4 py-3 text-usb-faint text-xs whitespace-nowrap">
                    {new Date(uni.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <CreateUniversityModal
            onClose={() => setShowModal(false)}
            onCreated={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tab: Programas ───────────────────────────────────────────────────────────

function CreateProgramModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast()
  const [programCode, setProgramCode]   = useState('')
  const [programName, setProgramName]   = useState('')
  const [degreeType, setDegreeType]     = useState<DegreeType>('PREG')
  const [institution, setInstitution]   = useState('')
  const [sniesCode, setSniesCode]       = useState('')
  const [location, setLocation]         = useState('')
  const [saving, setSaving]             = useState(false)

  const canSave = programCode.trim() && programName.trim() && institution.trim() && sniesCode.trim()

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await programService.createProgram({
        institution:  institution.trim(),
        degree_type:  degreeType,
        program_code: programCode.trim(),
        program_name: programName.trim(),
        location:     location.trim(),
        snies_code:   Number(sniesCode),
      })
      toast.success('Programa creado', programName.trim())
      onCreated()
      onClose()
    } catch (err) {
      toast.error('Error al crear programa', friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <div className="flex gap-3">
      <button onClick={onClose} className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all">
        Cancelar
      </button>
      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="flex-1 py-3 rounded-full text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed" style={{ background: '#00754A' }}
      >
        {saving ? <Spinner size={16} /> : null}
        Guardar
      </button>
    </div>
  )

  return (
    <Modal title="Nuevo Programa" icon={BookOpen} onClose={onClose} footer={footer}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>Código</FieldLabel>
            <input className={inputClass} value={programCode} onChange={e => setProgramCode(e.target.value)} placeholder="Ej: ING-SIS" autoFocus />
          </div>
          <div>
            <FieldLabel required>Tipo</FieldLabel>
            <div className="relative">
              <select className={selectClass} value={degreeType} onChange={e => setDegreeType(e.target.value as DegreeType)}>
                {DEGREE_TYPES.map(d => <option key={d} value={d}>{DEGREE_LABELS[d]}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
            </div>
          </div>
        </div>
        <div>
          <FieldLabel required>Nombre del programa</FieldLabel>
          <input className={inputClass} value={programName} onChange={e => setProgramName(e.target.value)} placeholder="Ej: Ingeniería de Sistemas" />
        </div>
        <div>
          <FieldLabel required>Institución</FieldLabel>
          <input className={inputClass} value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Ej: Facultad de Ingeniería" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>Código SNIES</FieldLabel>
            <input className={inputClass} type="number" value={sniesCode} onChange={e => setSniesCode(e.target.value)} placeholder="Ej: 12345" />
          </div>
          <div>
            <FieldLabel>Ubicación</FieldLabel>
            <input className={inputClass} value={location} onChange={e => setLocation(e.target.value)} placeholder="Ej: Bogotá" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ProgramasTab() {
  const [programs, setPrograms]   = useState<BackendProgram[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await programService.listAll()
      setPrograms(data)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-usb-text">
          Programas
          {programs.length > 0 && (
            <span className="ml-2 text-xs font-bold bg-green-accent/10 text-green-accent px-2 py-0.5 rounded-full">
              {programs.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-accent hover:bg-green-brand text-white font-bold rounded-full px-5 py-2.5 text-sm transition-all"
        >
          <Plus size={15} /> Nuevo Programa
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : programs.length === 0 && !error ? (
        <EmptyState icon={BookOpen} message="No hay programas registrados. Crea el primero." />
      ) : (
        <div className="bg-white rounded-2xl border border-usb-border overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-usb-border bg-usb-canvas">
                {['Programa', 'Código', 'Tipo', 'Institución', 'SNIES', 'Ubicación'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {programs.map((prog, i) => (
                <motion.tr
                  key={prog.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-usb-border last:border-0 hover:bg-usb-canvas transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-usb-text">{prog.program_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-usb-muted">{prog.program_code}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={DEGREE_LABELS[prog.degree_type as DegreeType] ?? prog.degree_type}
                      colorClass={DEGREE_COLORS[prog.degree_type as DegreeType] ?? 'bg-usb-canvas text-usb-muted'}
                    />
                  </td>
                  <td className="px-4 py-3 text-usb-muted">{prog.institution}</td>
                  <td className="px-4 py-3 text-usb-faint text-xs">{prog.snies_code}</td>
                  <td className="px-4 py-3 text-usb-faint text-xs">{prog.location || '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <CreateProgramModal
            onClose={() => setShowModal(false)}
            onCreated={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tab: Materias ────────────────────────────────────────────────────────────

function CreateCourseModal({
  programId, onClose, onCreated,
}: {
  programId: string
  onClose: () => void
  onCreated: () => void
}) {
  const toast = useToast()
  const [code, setCode]                 = useState('')
  const [name, setName]                 = useState('')
  const [credits, setCredits]           = useState('')
  const [academicPeriod, setAcademicPeriod] = useState('')
  const [saving, setSaving]             = useState(false)

  const canSave = code.trim() && name.trim() && credits.trim() && academicPeriod.trim()

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await courseService.create({
        code:            code.trim(),
        name:            name.trim(),
        credits:         Number(credits),
        academic_period: academicPeriod.trim(),
        program_id:      programId,
      })
      toast.success('Materia creada', name.trim())
      onCreated()
      onClose()
    } catch (err) {
      toast.error('Error al crear materia', friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <div className="flex gap-3">
      <button onClick={onClose} className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all">
        Cancelar
      </button>
      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="flex-1 py-3 rounded-full text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed" style={{ background: '#00754A' }}
      >
        {saving ? <Spinner size={16} /> : null}
        Guardar
      </button>
    </div>
  )

  return (
    <Modal title="Nueva Materia" icon={BookMarked} onClose={onClose} footer={footer}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>Código</FieldLabel>
            <input className={inputClass} value={code} onChange={e => setCode(e.target.value)} placeholder="Ej: MAT-101" autoFocus />
          </div>
          <div>
            <FieldLabel required>Créditos</FieldLabel>
            <input className={inputClass} type="number" min={1} value={credits} onChange={e => setCredits(e.target.value)} placeholder="Ej: 3" />
          </div>
        </div>
        <div>
          <FieldLabel required>Nombre de la materia</FieldLabel>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Cálculo Diferencial" />
        </div>
        <div>
          <FieldLabel required>Período académico</FieldLabel>
          <input className={inputClass} value={academicPeriod} onChange={e => setAcademicPeriod(e.target.value)} placeholder="Ej: 2025-I" />
        </div>
      </div>
    </Modal>
  )
}

function MateriasTab() {
  const [programs, setPrograms]             = useState<BackendProgram[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [courses, setCourses]               = useState<BackendCourse[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [error, setError]                   = useState('')
  const [showModal, setShowModal]           = useState(false)

  // Load all programs for the selector
  useEffect(() => {
    let cancelled = false
    programService.listAll()
      .then(data => { if (!cancelled) setPrograms(data) })
      .catch(() => { /* silently ignore — user sees empty selector */ })
      .finally(() => { if (!cancelled) setLoadingPrograms(false) })
    return () => { cancelled = true }
  }, [])

  const loadCourses = useCallback(async (programId: string) => {
    if (!programId) { setCourses([]); return }
    setLoadingCourses(true)
    setError('')
    try {
      const data = await courseService.listByProgram(programId)
      setCourses(data)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoadingCourses(false)
    }
  }, [])

  const handleProgramChange = (id: string) => {
    setSelectedProgramId(id)
    void loadCourses(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-usb-text">
          Materias
          {courses.length > 0 && (
            <span className="ml-2 text-xs font-bold bg-green-accent/10 text-green-accent px-2 py-0.5 rounded-full">
              {courses.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          disabled={!selectedProgramId}
          className="flex items-center gap-2 bg-green-accent hover:bg-green-brand disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-full px-5 py-2.5 text-sm transition-all"
        >
          <Plus size={15} /> Nueva Materia
        </button>
      </div>

      {/* Program selector */}
      <div className="relative max-w-sm">
        {loadingPrograms ? (
          <div className="flex items-center gap-2 text-sm text-usb-muted py-2"><Spinner size={15} /> Cargando programas…</div>
        ) : (
          <>
            <select
              className={selectClass}
              value={selectedProgramId}
              onChange={e => handleProgramChange(e.target.value)}
            >
              <option value="">Selecciona un programa…</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
          </>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {!selectedProgramId ? (
        <EmptyState icon={BookMarked} message="Selecciona un programa para ver sus materias." />
      ) : loadingCourses ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : courses.length === 0 ? (
        <EmptyState icon={BookMarked} message="Este programa no tiene materias registradas." />
      ) : (
        <div className="bg-white rounded-2xl border border-usb-border overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-usb-border bg-usb-canvas">
                {['Código', 'Nombre', 'Créditos', 'Período'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-usb-border last:border-0 hover:bg-usb-canvas transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-usb-muted">{c.code}</td>
                  <td className="px-4 py-3 font-semibold text-usb-text">{c.name}</td>
                  <td className="px-4 py-3 text-usb-muted">{c.credits}</td>
                  <td className="px-4 py-3 text-usb-muted">{c.academic_period}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showModal && selectedProgramId && (
          <CreateCourseModal
            programId={selectedProgramId}
            onClose={() => setShowModal(false)}
            onCreated={() => void loadCourses(selectedProgramId)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── EditUserModal ────────────────────────────────────────────────────────────

function EditUserModal({
  user: u, onClose, onSaved,
}: {
  user:    BackendUser
  onClose: () => void
  onSaved: (updated: BackendUser) => void
}) {
  const toast = useToast()
  const [fullName, setFullName] = useState(u.full_name)
  const [role, setRole]         = useState<UserRole>(u.role)
  const [password, setPassword] = useState('')
  const [saving, setSaving]     = useState(false)

  const isDirty = fullName.trim() !== u.full_name || role !== u.role || password.length > 0

  const handleSave = async () => {
    if (!fullName.trim()) { toast.warning('Campo requerido', 'El nombre no puede estar vacío.'); return }
    if (password && password.length < 8) { toast.warning('Contraseña débil', 'Mínimo 8 caracteres.'); return }
    setSaving(true)
    try {
      const payload: UserUpdatePayload = {}
      if (fullName.trim() !== u.full_name) payload.full_name = fullName.trim()
      if (role !== u.role) payload.role = role
      if (password) payload.password = password

      const updated = await userService.update(u.id, payload)
      toast.success('Usuario actualizado', `${updated.full_name} ha sido modificado.`)
      onSaved(updated)
      onClose()
    } catch (err) {
      toast.error('Error al actualizar', friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  const canSaveEdit = isDirty && (!password || password.length >= 8) && !saving

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={onClose}
        className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all"
      >
        Cancelar
      </button>
      <button
        onClick={canSaveEdit ? handleSave : undefined}
        style={{
          background: canSaveEdit ? '#00754A' : '#d1d5db',
          cursor: canSaveEdit ? 'pointer' : 'not-allowed',
        }}
        className="flex-1 py-3 rounded-full text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
      >
        {saving ? <Spinner size={16} /> : null}
        Guardar cambios
      </button>
    </div>
  )

  return (
    <Modal title="Editar Usuario" icon={Pencil} onClose={onClose} footer={footer}>
      <div className="p-6 space-y-4">
        <div>
          <FieldLabel required>Nombre completo</FieldLabel>
          <input
            className={inputClass}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <FieldLabel>Rol</FieldLabel>
          <div className="relative">
            <select className={selectClass} value={role} onChange={e => setRole(e.target.value as UserRole)}>
              <option value="STUDENT">Estudiante</option>
              <option value="PROFESSOR">Docente</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
          </div>
        </div>
        <div>
          <FieldLabel>Nueva contraseña <span className="text-usb-faint font-normal normal-case tracking-normal">(opcional)</span></FieldLabel>
          <input
            className={inputClass}
            type="password"
            // onInput captures password-manager autofill (bypasses React onChange)
            onInput={e => setPassword((e.target as HTMLInputElement).value)}
            onChange={e => setPassword(e.target.value)}
            placeholder="Dejar vacío para mantener la actual"
            autoComplete="new-password"
          />
          {password && password.length < 8 && (
            <p className="flex items-center gap-1.5 text-rose-500 text-xs mt-1.5">
              <AlertCircle size={12} /> Mínimo 8 caracteres.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── UserDetailDrawer ─────────────────────────────────────────────────────────

const OP_LABELS: Record<string, string> = {
  INSERT: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
}

// Human-readable field names for the audit log (avoids exposing DB column names)
const FIELD_LABELS: Record<string, string> = {
  full_name:           'Nombre completo',
  email:               'Correo electrónico',
  institutional_email: 'Correo institucional',
  role:                'Rol',
  status:              'Estado',
  password_hash:       'Contraseña',
  ml_consent:          'Consentimiento ML',
  last_login:          'Último inicio de sesión',
  created_at:          'Fecha de creación',
  updated_at:          'Última actualización',
}

const ROLE_READABLE: Record<string, string> = {
  STUDENT:   'Estudiante',
  PROFESSOR: 'Docente',
  ADMIN:     'Administrador',
}

const STATUS_READABLE: Record<string, string> = {
  ACTIVE:   'Activo',
  INACTIVE: 'Inactivo',
}

// Fields to show in the audit log — anything NOT in this set is hidden (internal/technical)
const AUDITABLE_FIELDS = new Set(Object.keys(FIELD_LABELS))

// Fields that change automatically or can't be meaningfully diffed — excluded from diffs
const AUTO_FIELDS = new Set(['updated_at', 'created_at', 'last_login', 'password_hash'])

// Normalize a value for comparison — handles Python str() booleans ("True"/"False") vs JSON booleans
function normalizeForCompare(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v).trim()
  const lower = s.toLowerCase()
  if (lower === 'true') return 'true'
  if (lower === 'false') return 'false'
  return s
}

function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'role') return ROLE_READABLE[String(value)] ?? String(value)
  if (key === 'status') return STATUS_READABLE[String(value)] ?? String(value)
  if (key === 'ml_consent') return value ? 'Sí' : 'No'
  if (key === 'password_hash') return '••••••••'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  // Format ISO date strings (handles both "T" and space separator, e.g. "2026-04-21 01:09:30+00:00")
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)) {
    try {
      return new Date(value.replace(' ', 'T')).toLocaleString('es-CO', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { /* fall through */ }
  }
  return String(value)
}

const OP_COLORS: Record<string, string> = {
  INSERT: 'bg-emerald-50 text-emerald-700',
  UPDATE: 'bg-amber-50 text-amber-700',
  DELETE: 'bg-rose-50 text-rose-600',
}

function UserDetailDrawer({ user: u, onClose, onStatusChange }: {
  user:           BackendUser
  onClose:        () => void
  onStatusChange: (updated: BackendUser) => void
}) {
  const toast = useToast()
  const [history, setHistory] = useState<AuditLogEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    userService.getHistory(u.id)
      .then(h => { if (!cancelled) setHistory(h) })
      .catch(() => { /* silently fail */ })
      .finally(() => { if (!cancelled) setLoadingHistory(false) })
    return () => { cancelled = true }
  }, [u.id])

  const handleToggleStatus = async () => {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setTogglingStatus(true)
    try {
      const updated = await userService.updateStatus(u.id, newStatus)
      toast.success(
        newStatus === 'ACTIVE' ? 'Usuario activado' : 'Usuario desactivado',
        updated.full_name,
      )
      onStatusChange(updated)
    } catch (err) {
      toast.error('Error al cambiar estado', friendlyError(err))
    } finally {
      setTogglingStatus(false)
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Nunca'
    return new Date(iso).toLocaleString('es-CO', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-modal w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center gap-3 flex-shrink-0" style={{ background: 'var(--green-deep)' }}>
          <div className="w-10 h-10 rounded-full bg-green-accent/20 border border-green-accent/30 flex items-center justify-center text-green-accent font-extrabold text-sm flex-shrink-0">
            {u.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-base leading-tight truncate">{u.full_name}</h2>
            <p className="text-white/50 text-xs truncate">{u.email}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.30)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-usb-canvas rounded-2xl p-3 text-center border border-usb-border">
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-usb-muted mb-1">Rol</p>
              <Badge label={ROLE_LABELS[u.role] ?? u.role} style={ROLE_BADGE_STYLE[u.role] ?? { background: 'var(--canvas-warm)', color: 'rgba(0,0,0,0.58)' }} />
            </div>
            <div className="bg-usb-canvas rounded-2xl p-3 text-center border border-usb-border">
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-usb-muted mb-1">Estado</p>
              <Badge
                label={u.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                colorClass={u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}
              />
            </div>
            <div className="bg-usb-canvas rounded-2xl p-3 text-center border border-usb-border">
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-usb-muted mb-1">ML</p>
              <Badge
                label={u.ml_consent ? 'Sí' : 'No'}
                colorClass={u.ml_consent ? 'bg-emerald-50 text-emerald-700' : 'bg-usb-canvas text-usb-muted'}
              />
            </div>
          </div>

          {/* Last login */}
          <div className="flex items-center gap-3 bg-usb-canvas rounded-2xl px-4 py-3 border border-usb-border">
            <Clock size={16} className="text-green-accent flex-shrink-0" />
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-usb-muted">Último inicio de sesión</p>
              <p className="text-sm font-semibold text-usb-text">{formatDate(u.last_login ?? null)}</p>
            </div>
          </div>

          {/* Toggle status */}
          <button
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${
              u.status === 'ACTIVE'
                ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            } disabled:opacity-50`}
          >
            {togglingStatus
              ? <Spinner size={14} />
              : u.status === 'ACTIVE'
                ? <><XCircle size={14} /> Desactivar usuario</>
                : <><CheckCircle2 size={14} /> Activar usuario</>
            }
          </button>

          {/* Audit history — collapsible */}
          <div>
            <button
              onClick={() => setHistoryOpen(v => !v)}
              className="w-full flex items-center justify-between gap-2 py-2 px-3 rounded-xl hover:bg-usb-canvas transition-colors border border-usb-border"
            >
              <div className="flex items-center gap-2">
                <History size={14} className="text-usb-muted" />
                <span className="text-xs font-bold uppercase tracking-wider text-usb-muted">Historial de cambios</span>
                {!loadingHistory && history.length > 0 && (
                  <span className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,117,74,0.10)', color: 'var(--green-accent, #00754A)' }}>
                    {history.length}
                  </span>
                )}
              </div>
              <ChevronDown size={14} className={`text-usb-faint transition-transform duration-200 ${historyOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
            {historyOpen && (
              <motion.div
                key="history"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
            <div className="mt-3">
            {loadingHistory ? (
              <div className="flex justify-center py-6"><Spinner size={20} /></div>
            ) : history.length === 0 ? (
              <p className="text-center text-usb-faint text-sm py-4">Sin historial de cambios.</p>
            ) : (
              <div className="space-y-2">
                {history.map(entry => (
                  <div
                    key={entry.id}
                    className="bg-usb-canvas rounded-xl border border-usb-border px-4 py-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge
                        label={OP_LABELS[entry.operation] ?? entry.operation}
                        colorClass={OP_COLORS[entry.operation] ?? 'bg-usb-canvas text-usb-muted'}
                      />
                      <span className="text-usb-faint">
                        {new Date(entry.timestamp).toLocaleString('es-CO', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {entry.changed_by_name && (
                      <p className="text-usb-muted">
                        Por: <span className="font-semibold text-usb-text">{entry.changed_by_name}</span>
                      </p>
                    )}
                    {(() => {
                      const newData  = entry.new_data  ?? {}
                      const prevData = entry.previous_data ?? {}
                      const isInsert = entry.operation === 'INSERT'

                      // Backend stores all fields in both new_data and previous_data.
                      // Show only fields where the value actually changed, normalizing types.
                      const hasPrevData = Object.keys(prevData).length > 0

                      const visibleEntries = Object.entries(newData).filter(([k, v]) => {
                        if (!AUDITABLE_FIELDS.has(k) || AUTO_FIELDS.has(k)) return false
                        if (isInsert) return v !== null && v !== undefined && v !== ''
                        // Only show if value actually differs from previous
                        if (!hasPrevData) return false
                        return normalizeForCompare(v) !== normalizeForCompare(prevData[k])
                      })

                      if (visibleEntries.length === 0) {
                        return (
                          <p className="mt-1.5 text-usb-faint text-[0.65rem] italic">
                            {isInsert ? null : 'Sin detalles de campos modificados.'}
                          </p>
                        )
                      }

                      return (
                        <div className="mt-1.5 space-y-0.5">
                          {visibleEntries.map(([k, v]) => {
                            const prevVal = prevData[k]
                            const newStr  = formatFieldValue(k, v)
                            const prevStr = formatFieldValue(k, prevVal)
                            return (
                              <p key={k} className="text-usb-faint">
                                <span className="font-semibold text-usb-muted">{FIELD_LABELS[k]}:</span>
                                {!isInsert && prevVal !== undefined && prevStr !== '—' && (
                                  <span className="mx-1 line-through text-rose-300">{prevStr}</span>
                                )}
                                <span className="mx-1 text-emerald-600 font-semibold">→ {newStr}</span>
                              </p>
                            )
                          })}
                          {/* prevOnlyKeys placeholder — intentionally empty, kept for future use */}
                          {([] as string[]).map(k => (
                            <p key={k} className="text-usb-faint">
                              <span className="font-semibold text-usb-muted">{FIELD_LABELS[k]}:</span>
                              <span className="mx-1 text-emerald-600 font-semibold">→ {formatFieldValue(k, prevData[k])}</span>
                            </p>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            )}
            </div>
            </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── User row with reminder action ───────────────────────────────────────────

function UserRow({
  user: u, index: i, onEdit, onDetail,
}: {
  user:     BackendUser
  index:    number
  onEdit:   (user: BackendUser) => void
  onDetail: (user: BackendUser) => void
}) {
  const toast = useToast()
  const [sending, setSending] = useState(false)

  const handleSendReminder = async () => {
    if (u.role !== 'STUDENT') return
    setSending(true)
    try {
      await notificationService.sendPredictorReminder({
        student_email: u.email,
        student_name:  u.full_name,
      })
      toast.success('Recordatorio enviado', `Se envió un correo a ${u.full_name}.`)
    } catch (err) {
      toast.error('Error al enviar correo', friendlyError(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02 }}
      className="border-b border-usb-border last:border-0 hover:bg-usb-canvas transition-colors"
    >
      <td className="px-4 py-3 font-semibold text-usb-text">{u.full_name}</td>
      <td className="px-4 py-3 text-usb-muted text-xs">{u.email}</td>
      <td className="px-4 py-3">
        <Badge
          label={ROLE_LABELS[u.role] ?? u.role}
          style={ROLE_BADGE_STYLE[u.role] ?? { background: 'var(--canvas-warm)', color: 'rgba(0,0,0,0.58)' }}
        />
      </td>
      <td className="px-4 py-3">
        <Badge
          label={u.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
          colorClass={u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}
        />
      </td>
      <td className="px-4 py-3 text-usb-faint text-xs whitespace-nowrap">
        {new Date(u.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDetail(u)}
            title="Ver detalles"
            className="p-1.5 text-usb-muted hover:text-green-accent hover:bg-green-accent/10 rounded-lg transition-colors"
          >
            <Eye size={13} />
          </button>
          <button
            onClick={() => onEdit(u)}
            title="Editar usuario"
            className="p-1.5 text-usb-muted hover:text-green-accent hover:bg-green-accent/10 rounded-lg transition-colors"
          >
            <Pencil size={13} />
          </button>
          {u.role === 'STUDENT' && (
            <button
              onClick={handleSendReminder}
              disabled={sending}
              title="Enviar recordatorio del predictor"
              className="flex items-center gap-1 text-xs font-semibold disabled:opacity-40 transition-colors px-2 py-1 rounded-lg"
              style={{ color: '#00754A' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,117,74,0.10)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '' }}
            >
              {sending ? <Loader2 size={12} className="animate-spin" /> : <GraduationCap size={12} />}
              <span className="hidden sm:inline">Recordatorio</span>
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  )
}

// ─── Tab: Usuarios ────────────────────────────────────────────────────────────

type RoleFilter = 'ALL' | UserRole

const ROLE_FILTER_LABELS: Record<RoleFilter, string> = {
  ALL:       'Todos',
  STUDENT:   'Estudiantes',
  PROFESSOR: 'Docentes',
  ADMIN:     'Admins',
}

// ─── Validation helpers ────────────────────────────────────────────────────────
function isEduEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.edu(\.[a-z]{2})?$/i.test(email.trim())
}

function isStrongPassword(pw: string): boolean {
  return pw.length >= 8
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast()
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [role, setRole]           = useState<UserRole>('STUDENT')
  const [saving, setSaving]       = useState(false)
  const [emailError, setEmailError]     = useState('')
  const [passwordError, setPasswordError] = useState('')

  const validateEmail = (val: string) => {
    if (!val.trim()) { setEmailError('El correo es obligatorio.'); return false }
    if (!val.includes('@')) { setEmailError('Debe incluir @.'); return false }
    if (!isEduEmail(val)) { setEmailError('Debe ser un correo institucional (ej: nombre@universidad.edu).'); return false }
    setEmailError('')
    return true
  }

  const validatePassword = (val: string) => {
    if (!val) { setPasswordError('La contraseña es obligatoria.'); return false }
    if (!isStrongPassword(val)) { setPasswordError('Mínimo 8 caracteres.'); return false }
    setPasswordError('')
    return true
  }

  const canSave = fullName.trim() && email.trim() && password.trim() && !emailError && !passwordError

  const handleSave = async () => {
    const emailOk = validateEmail(email)
    const passOk  = validatePassword(password)
    if (!fullName.trim()) { toast.warning('Campo requerido', 'El nombre completo es obligatorio.'); return }
    if (!emailOk || !passOk) return
    setSaving(true)
    try {
      await api.post<BackendUser>('/users', {
        email:      email.trim().toLowerCase(),
        full_name:  fullName.trim(),
        role,
        password,
        ml_consent: true,
      })
      toast.success('Usuario creado exitosamente', `${fullName.trim()} ha sido registrado.`)
      onCreated()
      onClose()
    } catch (err: unknown) {
      // 409 = email ya registrado
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 409) {
        setEmailError('Este correo ya está registrado en el sistema.')
      } else {
        toast.error('Error al crear usuario', friendlyError(err))
      }
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <div className="flex gap-3">
      <button onClick={onClose} className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all">
        Cancelar
      </button>
      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="flex-1 py-3 rounded-full text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed" style={{ background: '#00754A' }}
      >
        {saving ? <Spinner size={16} /> : null}
        Crear usuario
      </button>
    </div>
  )

  return (
    <Modal title="Nuevo Usuario" icon={Users} onClose={onClose} footer={footer}>
      <div className="p-6 space-y-4">
        <div>
          <FieldLabel required>Nombre completo</FieldLabel>
          <input
            className={inputClass}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Ej: María García López"
            autoFocus
          />
        </div>
        <div>
          <FieldLabel required>Correo electrónico institucional</FieldLabel>
          <input
            className={`${inputClass} ${emailError ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : ''}`}
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value) }}
            onBlur={e => validateEmail(e.target.value)}
            placeholder="nombre@universidad.edu"
          />
          {emailError && (
            <p className="flex items-center gap-1.5 text-rose-500 text-xs mt-1.5">
              <AlertCircle size={12} /> {emailError}
            </p>
          )}
          <p className="text-usb-faint text-[0.65rem] mt-1">
            Solo se aceptan correos institucionales con dominio .edu
          </p>
        </div>
        <div>
          <FieldLabel required>Contraseña</FieldLabel>
          <div className="relative">
            <input
              className={`${inputClass} pr-10 ${passwordError ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : ''}`}
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); if (passwordError) validatePassword(e.target.value) }}
              onBlur={e => validatePassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint hover:text-usb-muted transition-colors"
            >
              {showPass ? <GraduationCap size={15} /> : <GraduationCap size={15} />}
            </button>
          </div>
          {passwordError && (
            <p className="flex items-center gap-1.5 text-rose-500 text-xs mt-1.5">
              <AlertCircle size={12} /> {passwordError}
            </p>
          )}
        </div>
        <div>
          <FieldLabel>Rol</FieldLabel>
          <div className="relative">
            <select className={selectClass} value={role} onChange={e => setRole(e.target.value as UserRole)}>
              <option value="STUDENT">Estudiante</option>
              <option value="PROFESSOR">Docente</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function UsuariosTab() {
  const [roleFilter, setRoleFilter]       = useState<RoleFilter>('ALL')
  const [programFilter, setProgramFilter] = useState('')
  const [programs, setPrograms]           = useState<BackendProgram[]>([])
  const [users, setUsers]                 = useState<BackendUser[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser]     = useState<BackendUser | null>(null)
  const [detailUser, setDetailUser]       = useState<BackendUser | null>(null)
  const [search, setSearch]               = useState('')
  const [sortCol, setSortCol]             = useState<'full_name' | 'email' | 'role' | 'status' | 'created_at'>('full_name')
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('asc')
  const [page, setPage]                   = useState(1)
  const PAGE_SIZE = 20

  // Load programs for filter dropdown
  useEffect(() => {
    programService.listAll()
      .then(setPrograms)
      .catch(() => { /* silently ignore */ })
  }, [])

  const load = useCallback(async (filter: RoleFilter, progId: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await userService.list({
        ...(filter !== 'ALL' ? { role: filter } : {}),
        ...(progId ? { program_id: progId } : {}),
        limit: 100,
      })
      setUsers(res.data)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    userService.list({
      ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
      ...(programFilter ? { program_id: programFilter } : {}),
      limit: 100,
    })
      .then(res => { if (!cancelled) setUsers(res.data) })
      .catch(err => { if (!cancelled) setError(friendlyError(err)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [roleFilter, programFilter])

  useEffect(() => { setPage(1) }, [search, roleFilter, programFilter])

  const filtered = useMemo(() => {
    let list = [...users]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      const va = a[sortCol] ?? ''
      const vb = b[sortCol] ?? ''
      const cmp = String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [users, search, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageUsers  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const SortIcon = ({ col }: { col: typeof sortCol }) => {
    if (sortCol !== col) return null
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="inline ml-0.5" />
      : <ChevronDown size={12} className="inline ml-0.5" />
  }

  // Called when a user is edited — update local state
  const handleUserUpdated = (updated: BackendUser) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    if (detailUser?.id === updated.id) setDetailUser(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-usb-text">
          Usuarios
          {users.length > 0 && (
            <span className="ml-2 text-xs font-bold bg-green-accent/10 text-green-accent px-2 py-0.5 rounded-full">
              {users.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-green-accent hover:bg-green-brand text-white font-bold rounded-full px-5 py-2.5 text-sm transition-all"
        >
          <Plus size={15} /> Nuevo Usuario
        </button>
      </div>

      {/* Role filter pills */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-usb-canvas rounded-xl border border-usb-border p-1">
          {(Object.keys(ROLE_FILTER_LABELS) as RoleFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                roleFilter === f
                  ? 'bg-white text-usb-text shadow-card border border-usb-border'
                  : 'text-usb-muted hover:text-usb-text'
              }`}
            >
              {ROLE_FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Program filter */}
        {programs.length > 0 && (
          <div className="relative min-w-[200px]">
            <select
              className={`${selectClass} text-xs py-2`}
              value={programFilter}
              onChange={e => setProgramFilter(e.target.value)}
            >
              <option value="">Todos los programas</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.program_name}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          className="w-full pl-9 pr-4 py-2.5 bg-usb-canvas border border-usb-border rounded-xl text-sm focus:outline-none focus:border-green-accent focus:ring-2 focus:ring-green-accent/20 transition-all"
        />
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : filtered.length === 0 && !error ? (
        <EmptyState icon={Users} message="No hay usuarios para mostrar." />
      ) : (
        <div className="bg-white rounded-2xl border border-usb-border overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-usb-border bg-usb-canvas">
                <th
                  onClick={() => handleSort('full_name')}
                  className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted cursor-pointer hover:text-usb-text select-none"
                >
                  Nombre <SortIcon col="full_name" />
                </th>
                <th
                  onClick={() => handleSort('email')}
                  className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted cursor-pointer hover:text-usb-text select-none"
                >
                  Correo <SortIcon col="email" />
                </th>
                <th
                  onClick={() => handleSort('role')}
                  className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted cursor-pointer hover:text-usb-text select-none"
                >
                  Rol <SortIcon col="role" />
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted cursor-pointer hover:text-usb-text select-none"
                >
                  Estado <SortIcon col="status" />
                </th>
                <th
                  onClick={() => handleSort('created_at')}
                  className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted cursor-pointer hover:text-usb-text select-none"
                >
                  Registrado <SortIcon col="created_at" />
                </th>
                <th className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((u, i) => (
                <UserRow
                  key={u.id}
                  user={u}
                  index={i}
                  onEdit={setEditingUser}
                  onDetail={setDetailUser}
                />
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 pb-4 px-4 border-t border-usb-border">
              <p className="text-xs text-usb-muted">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} usuarios
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-usb-border text-xs font-semibold text-usb-muted hover:text-usb-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-xs font-bold text-usb-text">
                  Página {page} de {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-usb-border text-xs font-semibold text-usb-muted hover:text-usb-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => void load(roleFilter, programFilter)}
          />
        )}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSaved={handleUserUpdated}
          />
        )}
        {detailUser && (
          <UserDetailDrawer
            user={detailUser}
            onClose={() => setDetailUser(null)}
            onStatusChange={handleUserUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

// Universidades hidden — reserved for future feature
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'programas', label: 'Programas', icon: BookOpen },
  { key: 'materias',  label: 'Materias',  icon: BookMarked },
  { key: 'usuarios',  label: 'Usuarios',  icon: Users },
]

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('usuarios')

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'AD'

  return (
    <div className="min-h-screen bg-usb-canvas flex flex-col">

      {/* Header */}
      <header
        className="border-b border-white/10 sticky top-0 z-[1000] shadow-lg"
        style={{ background: 'var(--green-deep)' }}
      >
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(212,233,226,0.18)', border: '1px solid rgba(212,233,226,0.35)' }}
            >
              <span
                className="font-black select-none"
                style={{ color: 'var(--green-light)', fontSize: '0.72rem', letterSpacing: '-0.04em' }}
              >
                AR
              </span>
            </div>
            <div>
              <span className="text-white font-extrabold text-sm tracking-tight">Academic Risk</span>
              <p className="text-white/40 text-[0.62rem] leading-none mt-0.5">Panel de Administración</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-green-accent/10 border border-green-accent/20 px-3 py-1.5 rounded-full">
              <ShieldCheck size={13} className="text-green-accent" />
              <span className="text-green-accent text-xs font-bold">Administrador</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-accent/20 border border-green-accent/30 flex items-center justify-center text-green-accent font-extrabold text-xs">
                {initials}
              </div>
              <span className="hidden sm:block text-white text-xs font-bold">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-usb-border sticky top-[56px] z-[999]">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-green-accent text-green-accent'
                    : 'border-transparent text-usb-muted hover:text-usb-text hover:border-usb-border'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'universidades' && <UniversidadesTab />}
            {activeTab === 'programas'     && <ProgramasTab />}
            {activeTab === 'materias'      && <MateriasTab />}
            {activeTab === 'usuarios'      && <UsuariosTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-3 text-center" style={{ background: 'var(--green-deep)' }}>
        <p className="text-white/25 text-xs">Academic Risk · Panel Administrativo</p>
      </footer>
    </div>
  )
}
