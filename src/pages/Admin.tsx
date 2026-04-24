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
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { api } from '../services/api'
import { programService } from '../services/programService'
import type { BackendUniversity, BackendProgram, BackendCampus } from '../services/programService'
import { courseService } from '../services/courseService'
import type { BackendCourse } from '../services/courseService'
import { userService } from '../services/userService'
import type { UserRole } from '../services/userService'
import type { BackendUser } from '../services/authService'
import { notificationService } from '../services/notificationService'
import { friendlyError } from '../services/errorMessages'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

// ─── Shared helpers ───────────────────────────────────────────────────────────

type Tab = 'universidades' | 'programas' | 'materias' | 'usuarios'

const DEGREE_TYPES = ['PREG', 'POST', 'TEC'] as const
type DegreeType = typeof DEGREE_TYPES[number]

const DEGREE_LABELS: Record<DegreeType, string> = {
  PREG: 'Pregrado',
  POST: 'Posgrado',
  TEC:  'Técnico',
}

const DEGREE_COLORS: Record<DegreeType, string> = {
  PREG: 'bg-ar-cyan/10 text-ar-cyan',
  POST: 'bg-violet-50 text-violet-600',
  TEC:  'bg-amber-50 text-amber-600',
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT:   'Estudiante',
  PROFESSOR: 'Docente',
  ADMIN:     'Admin',
}

const ROLE_COLORS: Record<string, string> = {
  STUDENT:   'bg-ar-cyan/10 text-ar-cyan',
  PROFESSOR: 'bg-violet-50 text-violet-600',
  ADMIN:     'bg-rose-50 text-rose-600',
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.68rem] font-bold ${colorClass}`}>
      {label}
    </span>
  )
}

function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-ar-cyan" />
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
  'w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ar-cyan focus:ring-2 focus:ring-ar-cyan/20 transition-all'

const selectClass =
  'w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ar-cyan focus:ring-2 focus:ring-ar-cyan/20 transition-all appearance-none'

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-1.5">
      {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  title, icon: Icon, onClose, children,
}: {
  title: string
  icon:  React.ElementType
  onClose: () => void
  children: React.ReactNode
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
        {/* Header */}
        <div className="bg-ar-navy px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ar-cyan/20 border border-ar-cyan/30 flex items-center justify-center">
              <Icon size={18} className="text-ar-cyan" />
            </div>
            <h2 className="text-white font-bold text-base">{title}</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
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

  return (
    <Modal title="Nueva Universidad" icon={Building2} onClose={onClose}>
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
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-3 rounded-full bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Spinner size={16} /> : null}
            Guardar
          </button>
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
            <span className="ml-2 text-xs font-bold bg-ar-cyan/10 text-ar-cyan px-2 py-0.5 rounded-full">
              {universities.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-ar-cyan hover:bg-ar-cyan-dark text-white font-bold rounded-full px-5 py-2.5 text-sm transition-all"
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

function CreateProgramModal({
  universities, selectedUniId, onClose, onCreated,
}: {
  universities: BackendUniversity[]
  selectedUniId: string
  onClose: () => void
  onCreated: () => void
}) {
  const toast = useToast()
  const [uniId, setUniId]               = useState(selectedUniId)
  const [campuses, setCampuses]         = useState<BackendCampus[]>([])
  const [campusId, setCampusId]         = useState('')
  const [programCode, setProgramCode]   = useState('')
  const [programName, setProgramName]   = useState('')
  const [degreeType, setDegreeType]     = useState<DegreeType>('PREG')
  const [institution, setInstitution]   = useState('')
  const [sniesCode, setSniesCode]       = useState('')
  const [location, setLocation]         = useState('')
  const [academicGroup, setAcademicGroup] = useState('')
  const [loadingCampuses, setLoadingCampuses] = useState(false)
  const [saving, setSaving]             = useState(false)

  const loadCampuses = useCallback(async (id: string) => {
    if (!id) return
    setLoadingCampuses(true)
    setCampusId('')
    try {
      const data = await programService.listCampusesByUniversity(id)
      setCampuses(data)
      if (data.length === 1) setCampusId(data[0].id)
    } catch (err) {
      toast.error('Error al cargar sedes', friendlyError(err))
    } finally {
      setLoadingCampuses(false)
    }
  }, [toast])

  useEffect(() => { if (uniId) void loadCampuses(uniId) }, [uniId, loadCampuses])

  const canSave = uniId && campusId && programCode.trim() && programName.trim() && institution.trim() && sniesCode.trim()

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await programService.createProgram({
        campus_id:      campusId,
        institution:    institution.trim(),
        degree_type:    degreeType,
        program_code:   programCode.trim(),
        program_name:   programName.trim(),
        pensum:         '',
        academic_group: academicGroup.trim(),
        location:       location.trim(),
        snies_code:     Number(sniesCode),
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

  return (
    <Modal title="Nuevo Programa" icon={BookOpen} onClose={onClose}>
      <div className="p-6 space-y-4">
        {/* University selector */}
        <div>
          <FieldLabel required>Universidad</FieldLabel>
          <div className="relative">
            <select
              className={selectClass}
              value={uniId}
              onChange={e => setUniId(e.target.value)}
            >
              <option value="">Selecciona universidad…</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
          </div>
        </div>

        {/* Campus selector */}
        <div>
          <FieldLabel required>Sede</FieldLabel>
          {loadingCampuses ? (
            <div className="flex items-center gap-2 py-3 text-usb-muted text-sm"><Spinner size={15} /> Cargando sedes…</div>
          ) : (
            <div className="relative">
              <select
                className={selectClass}
                value={campusId}
                onChange={e => setCampusId(e.target.value)}
                disabled={!uniId || campuses.length === 0}
              >
                <option value="">{!uniId ? 'Primero elige universidad' : campuses.length === 0 ? 'Sin sedes disponibles' : 'Selecciona sede…'}</option>
                {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>Código</FieldLabel>
            <input className={inputClass} value={programCode} onChange={e => setProgramCode(e.target.value)} placeholder="Ej: ING-SIS" />
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

        <div>
          <FieldLabel>Grupo académico</FieldLabel>
          <input className={inputClass} value={academicGroup} onChange={e => setAcademicGroup(e.target.value)} placeholder="Ej: CIENCIAS" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-3 rounded-full bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Spinner size={16} /> : null}
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ProgramasTab() {
  const toast = useToast()
  const [universities, setUniversities] = useState<BackendUniversity[]>([])
  const [selectedUniId, setSelectedUniId] = useState('')
  const [programs, setPrograms]         = useState<BackendProgram[]>([])
  const [loadingUnis, setLoadingUnis]   = useState(true)
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [error, setError]               = useState('')
  const [showModal, setShowModal]       = useState(false)

  // Load universities once
  useEffect(() => {
    let cancelled = false
    setLoadingUnis(true)
    programService.listUniversities()
      .then(res => { if (!cancelled) setUniversities(res.data) })
      .catch(() => { /* universities load silently — user can still see selector */ })
      .finally(() => { if (!cancelled) setLoadingUnis(false) })
    return () => { cancelled = true }
  }, [])

  const loadPrograms = useCallback(async (uniId: string) => {
    if (!uniId) { setPrograms([]); return }
    setLoadingPrograms(true)
    setError('')
    try {
      const res = await programService.listProgramsByUniversity(uniId)
      setPrograms(res.data)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoadingPrograms(false)
    }
  }, [])

  const handleUniChange = (id: string) => {
    setSelectedUniId(id)
    void loadPrograms(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-usb-text">
          Programas
          {programs.length > 0 && (
            <span className="ml-2 text-xs font-bold bg-ar-cyan/10 text-ar-cyan px-2 py-0.5 rounded-full">
              {programs.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          disabled={!selectedUniId}
          className="flex items-center gap-2 bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-full px-5 py-2.5 text-sm transition-all"
        >
          <Plus size={15} /> Nuevo Programa
        </button>
      </div>

      {/* University selector */}
      <div className="max-w-xs relative">
        {loadingUnis ? (
          <div className="flex items-center gap-2 text-sm text-usb-muted py-2"><Spinner size={15} /> Cargando universidades…</div>
        ) : (
          <>
            <select
              className={selectClass}
              value={selectedUniId}
              onChange={e => handleUniChange(e.target.value)}
            >
              <option value="">Selecciona una universidad…</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
          </>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {!selectedUniId ? (
        <EmptyState icon={BookOpen} message="Selecciona una universidad para ver sus programas." />
      ) : loadingPrograms ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : programs.length === 0 ? (
        <EmptyState icon={BookOpen} message="Esta universidad no tiene programas registrados." />
      ) : (
        <div className="bg-white rounded-2xl border border-usb-border overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-usb-border bg-usb-canvas">
                {['Programa', 'Código', 'Tipo', 'Institución', 'SNIES'].map(h => (
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
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showModal && selectedUniId && (
          <CreateProgramModal
            universities={universities}
            selectedUniId={selectedUniId}
            onClose={() => setShowModal(false)}
            onCreated={() => void loadPrograms(selectedUniId)}
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

  return (
    <Modal title="Nueva Materia" icon={BookMarked} onClose={onClose}>
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
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-3 rounded-full bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Spinner size={16} /> : null}
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  )
}

function MateriasTab() {
  const toast = useToast()
  const [universities, setUniversities] = useState<BackendUniversity[]>([])
  const [selectedUniId, setSelectedUniId] = useState('')
  const [programs, setPrograms]         = useState<BackendProgram[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [courses, setCourses]           = useState<BackendCourse[]>([])
  const [loadingUnis, setLoadingUnis]   = useState(true)
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [error, setError]               = useState('')
  const [showModal, setShowModal]       = useState(false)

  // Load universities
  useEffect(() => {
    let cancelled = false
    setLoadingUnis(true)
    programService.listUniversities()
      .then(res => { if (!cancelled) setUniversities(res.data) })
      .catch(() => { /* selector-only load, errors surface via handleUniChange */ })
      .finally(() => { if (!cancelled) setLoadingUnis(false) })
    return () => { cancelled = true }
  }, [])

  const handleUniChange = async (id: string) => {
    setSelectedUniId(id)
    setSelectedProgramId('')
    setPrograms([])
    setCourses([])
    if (!id) return
    setLoadingPrograms(true)
    setError('')
    try {
      const res = await programService.listProgramsByUniversity(id)
      setPrograms(res.data)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoadingPrograms(false)
    }
  }

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
            <span className="ml-2 text-xs font-bold bg-ar-cyan/10 text-ar-cyan px-2 py-0.5 rounded-full">
              {courses.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          disabled={!selectedProgramId}
          className="flex items-center gap-2 bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-full px-5 py-2.5 text-sm transition-all"
        >
          <Plus size={15} /> Nueva Materia
        </button>
      </div>

      {/* Selectors row */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          {loadingUnis ? (
            <div className="flex items-center gap-2 text-sm text-usb-muted py-2"><Spinner size={15} /> Cargando…</div>
          ) : (
            <>
              <select className={selectClass} value={selectedUniId} onChange={e => void handleUniChange(e.target.value)}>
                <option value="">Universidad…</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
            </>
          )}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          {loadingPrograms ? (
            <div className="flex items-center gap-2 text-sm text-usb-muted py-2"><Spinner size={15} /> Cargando programas…</div>
          ) : (
            <>
              <select
                className={selectClass}
                value={selectedProgramId}
                onChange={e => handleProgramChange(e.target.value)}
                disabled={!selectedUniId || programs.length === 0}
              >
                <option value="">{!selectedUniId ? 'Primero elige universidad' : 'Programa…'}</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.program_name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
            </>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {!selectedProgramId ? (
        <EmptyState icon={BookMarked} message="Selecciona una universidad y un programa para ver sus materias." />
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

// ─── User row with reminder action ───────────────────────────────────────────

function UserRow({ user: u, index: i }: { user: BackendUser; index: number }) {
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
          colorClass={ROLE_COLORS[u.role] ?? 'bg-usb-canvas text-usb-muted'}
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
        {u.role === 'STUDENT' && (
          <button
            onClick={handleSendReminder}
            disabled={sending}
            title="Enviar recordatorio del predictor"
            className="flex items-center gap-1.5 text-xs font-semibold text-ar-cyan hover:text-ar-cyan-dark disabled:opacity-40 transition-colors px-2 py-1 rounded-lg hover:bg-ar-cyan/10"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <GraduationCap size={12} />}
            Recordatorio
          </button>
        )}
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
    } catch (err) {
      toast.error('Error al crear usuario', friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Nuevo Usuario" icon={Users} onClose={onClose}>
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
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-3 rounded-full bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Spinner size={16} /> : null}
            Crear usuario
          </button>
        </div>
      </div>
    </Modal>
  )
}

function UsuariosTab() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [users, setUsers]           = useState<BackendUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [search, setSearch]         = useState('')
  const [sortCol, setSortCol]       = useState<'full_name' | 'email' | 'role' | 'status' | 'created_at'>('full_name')
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('asc')
  const [page, setPage]             = useState(1)
  const PAGE_SIZE = 20

  const load = useCallback(async (filter: RoleFilter) => {
    setLoading(true)
    setError('')
    try {
      const res = await userService.list({
        ...(filter !== 'ALL' ? { role: filter } : {}),
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
    userService.list({ ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}), limit: 100 })
      .then(res => { if (!cancelled) setUsers(res.data) })
      .catch(err => { if (!cancelled) setError(friendlyError(err)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [roleFilter])

  useEffect(() => { setPage(1) }, [search, roleFilter])

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-usb-text">
          Usuarios
          {users.length > 0 && (
            <span className="ml-2 text-xs font-bold bg-ar-cyan/10 text-ar-cyan px-2 py-0.5 rounded-full">
              {users.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-ar-cyan hover:bg-ar-cyan-dark text-white font-bold rounded-full px-5 py-2.5 text-sm transition-all"
        >
          <Plus size={15} /> Nuevo Usuario
        </button>
      </div>

      {/* Role filter pills */}
      <div className="flex items-center gap-1 bg-usb-canvas rounded-xl border border-usb-border p-1 w-fit">
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-usb-faint pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          className="w-full pl-9 pr-4 py-2.5 bg-usb-canvas border border-usb-border rounded-xl text-sm focus:outline-none focus:border-ar-cyan focus:ring-2 focus:ring-ar-cyan/20 transition-all"
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
                <UserRow key={u.id} user={u} index={i} />
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
        {showModal && (
          <CreateUserModal
            onClose={() => setShowModal(false)}
            onCreated={() => void load(roleFilter)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'universidades', label: 'Universidades', icon: Building2 },
  { key: 'programas',     label: 'Programas',     icon: BookOpen },
  { key: 'materias',      label: 'Materias',       icon: BookMarked },
  { key: 'usuarios',      label: 'Usuarios',       icon: Users },
]

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('universidades')

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'AD'

  return (
    <div className="min-h-screen bg-usb-canvas flex flex-col">

      {/* Header */}
      <header className="bg-ar-navy border-b border-white/10 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/assets/ar-icon.png" alt="Academic Risk" className="h-8 w-auto" />
            <div>
              <span className="text-white font-extrabold text-sm tracking-tight">Academic Risk</span>
              <p className="text-white/40 text-[0.62rem] leading-none mt-0.5">Panel de Administración</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-ar-cyan/10 border border-ar-cyan/20 px-3 py-1.5 rounded-full">
              <ShieldCheck size={13} className="text-ar-cyan" />
              <span className="text-ar-cyan text-xs font-bold">Administrador</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-ar-cyan/20 border border-ar-cyan/30 flex items-center justify-center text-ar-cyan font-extrabold text-xs">
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
      <div className="bg-white border-b border-usb-border sticky top-[57px] z-30">
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
                    ? 'border-ar-cyan text-ar-cyan'
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'universidades' && <UniversidadesTab />}
            {activeTab === 'programas'     && <ProgramasTab />}
            {activeTab === 'materias'      && <MateriasTab />}
            {activeTab === 'usuarios'      && <UsuariosTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-ar-navy border-t border-white/10 py-3 text-center">
        <p className="text-white/25 text-xs">Academic Risk · Panel Administrativo</p>
      </footer>
    </div>
  )
}
