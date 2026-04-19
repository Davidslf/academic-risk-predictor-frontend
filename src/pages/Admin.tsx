import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Upload, Building2, BookOpen,
  LayoutGrid, Users, ShieldCheck, ChevronRight,
  Trash2, ImageIcon, HelpCircle, LogOut,
  RotateCcw, AlertTriangle, ArrowLeft, GraduationCap,
  Clock, CheckCircle2, BookMarked, Hash
} from 'lucide-react'
import type { Step } from 'react-joyride'
import type { University, Program, ProgramLevel } from '../types'
import { initialUniversities, initialPrograms } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import TourGuide from '../components/TourGuide'
import { useTour } from '../hooks/useTour'

// ─── Tour steps ───────────────────────────────────────────────────────────────
const ADMIN_TOUR_STEPS: Step[] = [
  {
    target:    '#tour-admin-stats',
    title:     '📊 Métricas de la plataforma',
    content:   'Aquí ves en tiempo real cuántas universidades activas hay, el total de programas y el período en curso.',
    placement: 'bottom',
  },
  {
    target:    '#tour-filter-tabs',
    title:     '🗂 Activas / Eliminadas',
    content:   'Filtra entre universidades activas y las que han sido archivadas. Desde "Eliminadas" puedes reactivarlas.',
    placement: 'bottom',
  },
  {
    target:    '#tour-universities-grid',
    title:     '🏛 Universidades registradas',
    content:   'Cada tarjeta representa una institución. Haz clic en "Ver programas" para explorar su oferta académica o en el ícono de eliminar para archivarla.',
    placement: 'top',
  },
  {
    target:    '#tour-add-university',
    title:     '➕ Agregar institución',
    content:   'Registra una nueva universidad: sube su logo, escribe el nombre oficial y la cantidad de programas.',
    placement: 'right',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const ALLOWED_EXT   = ['.png', '.jpg', '.jpeg']
const LEVEL_COLORS: Record<ProgramLevel, string> = {
  'Pregrado':     'bg-ar-cyan/10 text-ar-cyan',
  'Posgrado':     'bg-violet-50 text-violet-600',
  'Técnico':      'bg-amber-50 text-amber-600',
  'Tecnológico':  'bg-emerald-50 text-emerald-600',
}

function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return `Solo se aceptan: ${ALLOWED_EXT.join(', ')}`
  if (file.size > 2 * 1024 * 1024)        return 'El archivo no puede superar 2 MB.'
  return null
}

// ─── Programs view ────────────────────────────────────────────────────────────
function ProgramsView({
  university, programs, onBack
}: {
  university: University
  programs: Program[]
  onBack: () => void
}) {
  const uniPrograms = programs.filter(p => p.universityId === university.id)
  const byLevel = (l: ProgramLevel) => uniPrograms.filter(p => p.level === l)

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 max-w-7xl mx-auto w-full px-6 py-8"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-usb-muted hover:text-usb-text transition-colors text-sm font-medium group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Universidades
        </button>
        <ChevronRight size={14} className="text-usb-faint" />
        <span className="text-usb-text font-semibold text-sm">{university.name}</span>
      </div>

      {/* University header */}
      <div className="bg-ar-gradient rounded-2xl p-6 mb-6 flex items-center gap-4">
        {university.logo ? (
          <img src={university.logo} alt={university.name} className="h-14 w-14 object-contain rounded-xl bg-white/10 p-1" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
            <Building2 size={26} className="text-white/60" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-extrabold text-white">{university.name}</h1>
          <p className="text-white/50 text-sm mt-0.5">
            {uniPrograms.length} programa{uniPrograms.length !== 1 ? 's' : ''} · Vinculada desde{' '}
            {new Date(university.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(['Pregrado', 'Posgrado', 'Técnico', 'Tecnológico'] as ProgramLevel[]).map(level => {
          const count = byLevel(level).length
          if (!count) return null
          return (
            <div key={level} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${LEVEL_COLORS[level]} border-current/20`}>
              <GraduationCap size={12} />
              {count} {level}
            </div>
          )
        })}
      </div>

      {/* Programs table */}
      {uniPrograms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-usb-border p-12 text-center">
          <BookOpen size={32} className="text-usb-faint mx-auto mb-3" />
          <p className="text-usb-muted font-medium">Esta universidad no tiene programas registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-usb-border overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-usb-border bg-usb-canvas">
                <th className="text-left px-5 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">Programa</th>
                <th className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted">Nivel</th>
                <th className="text-left px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted hidden md:table-cell">Facultad</th>
                <th className="text-center px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted hidden sm:table-cell">Créditos</th>
                <th className="text-center px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-usb-muted hidden lg:table-cell">Duración</th>
              </tr>
            </thead>
            <tbody>
              {uniPrograms.map((prog, i) => (
                <motion.tr
                  key={prog.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-usb-border last:border-0 hover:bg-usb-canvas transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-usb-text">{prog.name}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-bold ${LEVEL_COLORS[prog.level]}`}>
                      <GraduationCap size={10} />
                      {prog.level}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-usb-muted hidden md:table-cell">{prog.faculty}</td>
                  <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-usb-subtle font-medium">
                      <Hash size={11} className="text-ar-cyan" />
                      {prog.credits}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 text-usb-muted">
                      <Clock size={11} />
                      {prog.duration}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

// ─── University card ──────────────────────────────────────────────────────────
function UniversityCard({
  uni, index, onDelete, onViewPrograms
}: {
  uni: University
  index: number
  onDelete: (uni: University) => void
  onViewPrograms: (uni: University) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-white rounded-2xl border border-usb-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Delete button */}
      <button
        onClick={() => onDelete(uni)}
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/80 border border-usb-border text-usb-faint hover:text-risk-high hover:border-risk-high/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
        title="Archivar universidad"
      >
        <Trash2 size={12} />
      </button>

      {/* Logo area */}
      <div className="h-32 bg-gradient-to-br from-usb-canvas to-ar-navy/5 flex items-center justify-center border-b border-usb-border relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-ar-cyan/5" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-ar-navy/5" />
        </div>
        {uni.logo ? (
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={uni.logo}
            alt={uni.name}
            className="max-h-20 max-w-[80%] object-contain relative z-10 drop-shadow-sm"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-ar-navy/10 flex items-center justify-center">
              <Building2 size={22} className="text-ar-navy/40" />
            </div>
            <span className="text-[0.65rem] text-usb-faint font-medium">Sin logo</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-usb-text text-sm leading-snug mb-3 line-clamp-2">{uni.name}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-usb-muted">
            <BookOpen size={12} className="text-ar-cyan" />
            <span>{uni.programCount} programas</span>
          </div>
          <span className="text-[0.62rem] text-usb-faint">
            {new Date(uni.createdAt).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Hover footer */}
      <button
        onClick={() => onViewPrograms(uni)}
        className="absolute bottom-0 left-0 right-0 bg-ar-navy px-4 py-2.5 flex items-center justify-between translate-y-full group-hover:translate-y-0 transition-transform duration-300"
      >
        <span className="text-white text-xs font-semibold">Ver programas</span>
        <ChevronRight size={14} className="text-ar-cyan" />
      </button>
    </motion.div>
  )
}

// ─── Archived university card ─────────────────────────────────────────────────
function ArchivedCard({
  uni, index, onReactivate
}: {
  uni: University
  index: number
  onReactivate: (id: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-white rounded-2xl border border-usb-border border-dashed shadow-card opacity-70 hover:opacity-100 transition-all duration-300 overflow-hidden"
    >
      {/* Logo area — grayed out */}
      <div className="h-32 bg-usb-canvas flex items-center justify-center border-b border-usb-border grayscale">
        {uni.logo ? (
          <img src={uni.logo} alt={uni.name} className="max-h-20 max-w-[80%] object-contain opacity-40" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-usb-border/50 flex items-center justify-center">
            <Building2 size={22} className="text-usb-faint" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-usb-muted text-sm leading-snug mb-2 line-clamp-2">{uni.name}</h3>
        {uni.archivedAt && (
          <p className="text-[0.62rem] text-usb-faint mb-3">
            Archivada el {new Date(uni.archivedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
        <button
          onClick={() => onReactivate(uni.id)}
          className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold py-2 rounded-xl transition-colors"
        >
          <RotateCcw size={12} />
          Reactivar
        </button>
      </div>
    </motion.div>
  )
}

// ─── Delete confirmation modal ────────────────────────────────────────────────
function DeleteConfirmModal({
  university, onConfirm, onCancel
}: {
  university: University
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-modal w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-risk-high-bg border-b border-risk-high/20 px-6 py-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-risk-high/10 border border-risk-high/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle size={18} className="text-risk-high" />
          </div>
          <div>
            <h2 className="font-bold text-risk-high text-base">¿Archivar universidad?</h2>
            <p className="text-risk-high/70 text-xs mt-0.5 leading-snug">
              Esta acción no es permanente — podrás reactivarla desde la pestaña "Eliminadas".
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 bg-usb-canvas rounded-xl p-3 border border-usb-border mb-5">
            {university.logo ? (
              <img src={university.logo} alt="" className="h-10 w-10 object-contain rounded-lg" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-ar-navy/10 flex items-center justify-center">
                <Building2 size={18} className="text-ar-navy/40" />
              </div>
            )}
            <div>
              <p className="font-bold text-usb-text text-sm leading-tight">{university.name}</p>
              <p className="text-usb-muted text-xs mt-0.5">{university.programCount} programas registrados</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all"
            >
              No, cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-full bg-risk-high hover:bg-red-700 text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} />
              Sí, archivar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Create university modal ─────────────────────────────────────────────────
function CreateUniversityModal({
  onSave, onClose
}: {
  onSave: (uni: University) => void
  onClose: () => void
}) {
  const [name, setName]                   = useState('')
  const [programCount, setProgramCount]   = useState<number | ''>('')
  const [logoPreview, setLogoPreview]     = useState<string>('')
  const [logoError, setLogoError]         = useState('')
  const [isDragging, setIsDragging]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    const err = validateImageFile(file)
    if (err) { setLogoError(err); return }
    setLogoError('')
    const reader = new FileReader()
    reader.onload = e => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      id:           `uni-${crypto.randomUUID()}`,
      name:         name.trim(),
      logo:         logoPreview,
      createdAt:    new Date().toISOString().split('T')[0],
      programCount: typeof programCount === 'number' ? programCount : 0,
      status:       'active',
    })
  }

  const canSave = name.trim().length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-modal w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-ar-navy px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ar-cyan/20 border border-ar-cyan/30 flex items-center justify-center">
              <Building2 size={18} className="text-ar-cyan" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Nueva Universidad</h2>
              <p className="text-white/40 text-xs">Completa los datos para registrar</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Logo upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-2">
              Logo institucional <span className="text-usb-faint font-normal normal-case">(opcional)</span>
            </label>
            {logoPreview ? (
              <div className="relative rounded-2xl border-2 border-ar-cyan/30 bg-ar-cyan/5 p-4 flex flex-col items-center gap-3">
                <img src={logoPreview} alt="preview" className="max-h-24 max-w-full object-contain" />
                <button
                  onClick={() => { setLogoPreview(''); if (fileRef.current) fileRef.current.value = '' }}
                  className="text-xs text-usb-muted hover:text-risk-high flex items-center gap-1 transition-colors"
                >
                  <X size={12} /> Cambiar logo
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`
                  relative rounded-2xl border-2 border-dashed cursor-pointer transition-all p-6
                  flex flex-col items-center gap-3 text-center
                  ${isDragging ? 'border-ar-cyan bg-ar-cyan/10 scale-[1.02]' : 'border-usb-border hover:border-ar-cyan/50 hover:bg-usb-canvas'}
                `}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isDragging ? 'bg-ar-cyan/20' : 'bg-usb-canvas border border-usb-border'}`}>
                  <ImageIcon size={22} className={isDragging ? 'text-ar-cyan' : 'text-usb-faint'} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-usb-subtle">
                    {isDragging ? 'Suelta el archivo aquí' : 'Arrastra el logo aquí'}
                  </p>
                  <p className="text-xs text-usb-muted mt-0.5">o haz clic para buscar</p>
                  <p className="text-[0.65rem] text-usb-faint mt-1.5">Solo JPG, JPEG o PNG · máx. 2 MB</p>
                </div>
                <div className="flex items-center gap-1.5 bg-ar-navy text-white text-xs font-bold px-4 py-2 rounded-full">
                  <Upload size={12} /> Subir logo
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} className="hidden" />
            <AnimatePresence>
              {logoError && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-risk-high mt-2 flex items-center gap-1">
                  <X size={11} /> {logoError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-2">
              Nombre de la universidad <span className="text-risk-high">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Universidad Nacional de Colombia"
              className="w-full bg-usb-canvas border border-usb-border rounded-xl px-4 py-3 text-sm text-usb-text placeholder-usb-faint focus:outline-none focus:border-ar-cyan focus:ring-2 focus:ring-ar-cyan/20 transition-all"
              autoFocus
            />
          </div>

          {/* Program count */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-usb-muted mb-2">
              Cantidad de programas <span className="text-usb-faint font-normal normal-case">(opcional)</span>
            </label>
            <div className="relative">
              <BookMarked size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-usb-faint" />
              <input
                type="number"
                min={0}
                value={programCount}
                onChange={e => setProgramCount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                placeholder="Ej: 12"
                className="w-full bg-usb-canvas border border-usb-border rounded-xl pl-9 pr-4 py-3 text-sm text-usb-text placeholder-usb-faint focus:outline-none focus:border-ar-cyan focus:ring-2 focus:ring-ar-cyan/20 transition-all"
              />
            </div>
          </div>

          {/* Date added (informational, auto) */}
          <div className="flex items-center gap-2 bg-usb-canvas rounded-xl px-4 py-3 border border-usb-border">
            <Clock size={14} className="text-ar-cyan flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-usb-subtle">Fecha de registro</p>
              <p className="text-xs text-usb-muted">
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-full border border-usb-border text-usb-muted hover:text-usb-text font-semibold text-sm transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 py-3 rounded-full bg-ar-cyan hover:bg-ar-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-glow hover:shadow-lg flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              Guardar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Admin page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { run, onTourEnd } = useTour('admin-page')

  const [universities, setUniversities] = useState<University[]>(() => {
    try {
      const stored = localStorage.getItem('ar-universities')
      if (stored) return JSON.parse(stored) as University[]
    } catch { /* ignore */ }
    return initialUniversities
  })

  const [programs] = useState<Program[]>(() => {
    try {
      const stored = localStorage.getItem('ar-programs')
      if (stored) return JSON.parse(stored) as Program[]
    } catch { /* ignore */ }
    return initialPrograms
  })

  const [showModal, setShowModal]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<University | null>(null)
  const [filter, setFilter]             = useState<'active' | 'archived'>('active')
  const [selectedUni, setSelectedUni]   = useState<University | null>(null)

  const saveUniversities = (unis: University[]) => {
    setUniversities(unis)
    localStorage.setItem('ar-universities', JSON.stringify(unis))
  }

  const handleSave = (uni: University) => {
    saveUniversities([...universities, uni])
    setShowModal(false)
  }

  const handleArchiveConfirm = () => {
    if (!deleteTarget) return
    const updated = universities.map(u =>
      u.id === deleteTarget.id
        ? { ...u, status: 'archived' as const, archivedAt: new Date().toISOString().split('T')[0] }
        : u
    )
    saveUniversities(updated)
    setDeleteTarget(null)
  }

  const handleReactivate = (id: string) => {
    const updated = universities.map(u =>
      u.id === id ? { ...u, status: 'active' as const, archivedAt: undefined } : u
    )
    saveUniversities(updated)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const activeUnis   = universities.filter(u => u.status === 'active')
  const archivedUnis = universities.filter(u => u.status === 'archived')
  const totalPrograms = activeUnis.reduce((s, u) => s + u.programCount, 0)

  // ── Render programs sub-view ──────────────────────────────────────────────
  if (selectedUni) {
    return (
      <div className="min-h-screen bg-usb-canvas flex flex-col">
        {/* Compact header while in programs view */}
        <header className="bg-ar-navy border-b border-white/10 sticky top-0 z-40 shadow-lg">
          <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedUni(null)}
                className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium transition-colors group"
              >
                <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                Universidades
              </button>
              <div className="w-px h-4 bg-white/10" />
              <span className="text-white/80 text-sm font-semibold truncate max-w-xs">{selectedUni.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.dispatchEvent(new Event('ar:start-tour'))} className="p-1.5 text-white/30 hover:text-ar-cyan hover:bg-white/10 rounded-lg transition-colors" title="Tour">
                <HelpCircle size={15} />
              </button>
              <button onClick={handleLogout} className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Cerrar sesión">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <ProgramsView key={selectedUni.id} university={selectedUni} programs={programs} onBack={() => setSelectedUni(null)} />
        </AnimatePresence>
      </div>
    )
  }

  // ── Main admin view ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-usb-canvas flex flex-col">
      <TourGuide run={run} steps={ADMIN_TOUR_STEPS} onEnd={onTourEnd} />

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
              <div className="w-8 h-8 rounded-full bg-ar-cyan/20 border border-ar-cyan/30 flex items-center justify-center text-ar-cyan font-extrabold text-xs">AD</div>
              <span className="hidden sm:block text-white text-xs font-bold">{user?.name}</span>
            </div>
            <button onClick={() => window.dispatchEvent(new Event('ar:start-tour'))} className="p-1.5 text-white/30 hover:text-ar-cyan hover:bg-white/10 rounded-lg transition-colors" title="Repetir tour">
              <HelpCircle size={15} />
            </button>
            <button onClick={handleLogout} className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Cerrar sesión">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Stats ribbon */}
      <div id="tour-admin-stats" className="bg-white border-b border-usb-border px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-6 flex-wrap">
          {[
            { icon: Building2,  label: 'Universidades activas', value: activeUnis.length,  color: 'text-ar-cyan' },
            { icon: BookOpen,   label: 'Programas',             value: totalPrograms,       color: 'text-violet-500' },
            { icon: Users,      label: 'Usuarios demo',         value: 23,                  color: 'text-emerald-600' },
            { icon: LayoutGrid, label: 'Corte activo',          value: '2024-I',            color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <s.icon size={14} className={s.color} />
              <span className="text-xs text-usb-muted font-medium">{s.label}:</span>
              <span className="text-xs font-extrabold text-usb-text">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-usb-text">Universidades</h1>
            <p className="text-usb-muted text-sm mt-0.5">Gestiona las instituciones educativas vinculadas a la plataforma</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowModal(true)}
            className="hidden sm:flex items-center gap-2 bg-ar-cyan hover:bg-ar-cyan-dark text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-glow"
          >
            <Plus size={16} /> Nueva universidad
          </motion.button>
        </div>

        {/* Filter tabs */}
        <div id="tour-filter-tabs" className="flex items-center gap-1 mb-6 bg-usb-canvas rounded-xl border border-usb-border p-1 w-fit">
          {[
            { key: 'active',   label: 'Activas',   count: activeUnis.length,   icon: CheckCircle2 },
            { key: 'archived', label: 'Eliminadas', count: archivedUnis.length, icon: Trash2 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as 'active' | 'archived')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === tab.key
                  ? 'bg-white text-usb-text shadow-card border border-usb-border'
                  : 'text-usb-muted hover:text-usb-text'
              }`}
            >
              <tab.icon size={13} className={filter === tab.key ? (tab.key === 'archived' ? 'text-risk-high' : 'text-ar-cyan') : ''} />
              {tab.label}
              <span className={`text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded-full ml-0.5 ${
                filter === tab.key
                  ? tab.key === 'archived' ? 'bg-risk-high-bg text-risk-high' : 'bg-ar-cyan/10 text-ar-cyan'
                  : 'bg-usb-border text-usb-faint'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filter === 'active' ? (
            <motion.div
              key="active"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              id="tour-universities-grid"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {/* Add card */}
              <motion.button
                id="tour-add-university"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(true)}
                className="group relative bg-white rounded-2xl border-2 border-dashed border-usb-border hover:border-ar-cyan transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center p-6 cursor-pointer min-h-[200px]"
              >
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                  className="w-12 h-12 rounded-full bg-usb-canvas border-2 border-dashed border-usb-border group-hover:border-ar-cyan group-hover:bg-ar-cyan/10 flex items-center justify-center transition-all"
                >
                  <Plus size={22} className="text-usb-faint group-hover:text-ar-cyan transition-colors" />
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-usb-subtle group-hover:text-ar-cyan transition-colors">Agregar universidad</p>
                  <p className="text-xs text-usb-faint mt-0.5">Haz clic para registrar</p>
                </div>
              </motion.button>

              {/* Active university cards */}
              {activeUnis.map((uni, i) => (
                <UniversityCard
                  key={uni.id} uni={uni} index={i}
                  onDelete={u => setDeleteTarget(u)}
                  onViewPrograms={u => setSelectedUni(u)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="archived"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {archivedUnis.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl border border-usb-border p-12 text-center">
                  <Trash2 size={32} className="text-usb-faint mx-auto mb-3" />
                  <p className="text-usb-muted font-medium">No hay universidades archivadas.</p>
                  <p className="text-usb-faint text-sm mt-1">Cuando archives una institución aparecerá aquí.</p>
                </div>
              ) : (
                archivedUnis.map((uni, i) => (
                  <ArchivedCard key={uni.id} uni={uni} index={i} onReactivate={handleReactivate} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-ar-navy border-t border-white/10 py-3 text-center">
        <p className="text-white/25 text-xs">Academic Risk · Panel Administrativo · 2024-I</p>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showModal    && <CreateUniversityModal key="create" onSave={handleSave} onClose={() => setShowModal(false)} />}
        {deleteTarget && <DeleteConfirmModal key="delete" university={deleteTarget} onConfirm={handleArchiveConfirm} onCancel={() => setDeleteTarget(null)} />}
      </AnimatePresence>
    </div>
  )
}
