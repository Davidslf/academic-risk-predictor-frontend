import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Upload, FileSpreadsheet, FileText, FileCode2,
  Cloud, FolderOpen, CheckCircle2, AlertTriangle,
  Download, Loader2, HardDriveDownload, Link2
} from 'lucide-react'
import type { Course, Grade, Student } from '../types'
import { parseCSV, parseXLSX, parseXML, type ImportResult } from '../utils/gradeImport'
import { downloadCSVTemplate, downloadXLSXTemplate } from '../utils/templateExport'

interface Props {
  course: Course
  students: Student[]
  onImport: (grades: Grade[]) => void
  onClose: () => void
}

type Step = 'upload' | 'preview' | 'done'

const ACCEPTED = '.csv,.xlsx,.xls,.xml'

const fileTypeInfo = {
  csv:  { icon: FileText,        label: 'CSV',  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  xlsx: { icon: FileSpreadsheet, label: 'Excel',color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  xml:  { icon: FileCode2,       label: 'XML',  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
}

function getFileType(name: string): 'csv' | 'xlsx' | 'xml' | null {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return 'csv'
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  if (ext === 'xml') return 'xml'
  return null
}

export default function ImportModal({ course, students, onImport, onClose }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState<'csv' | 'xlsx' | 'xml' | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState<'csv' | 'xlsx' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    const type = getFileType(file.name)
    if (!type) return

    setLoading(true)
    setFileName(file.name)
    setFileType(type)

    try {
      let res: ImportResult
      if (type === 'csv') {
        const text = await file.text()
        res = parseCSV(text, course, students)
      } else if (type === 'xlsx') {
        const buf = await file.arrayBuffer()
        res = await parseXLSX(buf, course, students)
      } else {
        const text = await file.text()
        res = parseXML(text, course, students)
      }
      setResult(res)
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }, [course, students])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleConfirm = () => {
    if (!result) return
    onImport(result.grades)
    setStep('done')
  }

  const handleCSVDownload = async () => {
    setDownloadLoading('csv')
    await new Promise(r => setTimeout(r, 300))
    downloadCSVTemplate(course, students)
    setDownloadLoading(null)
  }

  const handleXLSXDownload = async () => {
    setDownloadLoading('xlsx')
    await new Promise(r => setTimeout(r, 300))
    await downloadXLSXTemplate(course, students)
    setDownloadLoading(null)
  }

  const FileIcon = fileType ? fileTypeInfo[fileType].icon : FileText

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
      >
        <div className="bg-white rounded-3xl shadow-modal w-full max-w-xl pointer-events-auto overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-usb-border">
            <div>
              <h2 className="font-extrabold text-lg text-usb-text">Importar Calificaciones</h2>
              <p className="text-xs text-usb-muted mt-0.5">
                <span className="font-semibold text-usb-orange">{course.code}</span> · {course.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-usb-muted hover:text-usb-text hover:bg-usb-canvas transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6">
            {/* ── STEP: UPLOAD ── */}
            {step === 'upload' && (
              <div className="space-y-5">
                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    dragging
                      ? 'border-usb-orange bg-usb-orange-light scale-[1.01]'
                      : 'border-usb-border hover:border-usb-orange/50 hover:bg-usb-canvas'
                  }`}
                >
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={36} className="text-usb-orange animate-spin" />
                      <p className="text-sm font-semibold text-usb-muted">Procesando archivo…</p>
                    </div>
                  ) : (
                    <>
                      <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${
                        dragging ? 'bg-usb-orange text-white' : 'bg-usb-orange-light text-usb-orange'
                      }`}>
                        <Upload size={24} />
                      </div>
                      <p className="font-bold text-usb-text text-sm">
                        {dragging ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí'}
                      </p>
                      <p className="text-xs text-usb-muted mt-1 mb-4">
                        Formatos soportados: CSV, Excel (.xlsx), XML
                      </p>
                      {/* Format pills */}
                      <div className="flex items-center justify-center gap-2 mb-4">
                        {(Object.entries(fileTypeInfo) as [keyof typeof fileTypeInfo, typeof fileTypeInfo[keyof typeof fileTypeInfo]][]).map(([key, info]) => {
                          const Icon = info.icon
                          return (
                            <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${info.color} ${info.bg} ${info.border}`}>
                              <Icon size={11} />
                              {info.label}
                            </span>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex items-center gap-2 bg-usb-orange hover:bg-usb-orange-hover text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md"
                      >
                        <FolderOpen size={15} />
                        Seleccionar archivo
                      </button>
                    </>
                  )}
                  <input ref={inputRef} type="file" accept={ACCEPTED} onChange={handleFile} className="hidden" />
                </div>

                {/* Other sources */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-usb-muted mb-2">Otras fuentes</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        // Mock: show coming soon message in the UI
                        alert('Integración con Google Drive — próximamente disponible')
                      }}
                      className="flex items-center gap-2.5 border border-usb-border rounded-xl px-4 py-3 hover:border-usb-orange/40 hover:bg-usb-canvas transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Cloud size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-usb-text">Google Drive</p>
                        <p className="text-[0.65rem] text-usb-faint">Próximamente</p>
                      </div>
                    </button>
                    <button
                      onClick={() => alert('Importar desde URL — próximamente disponible')}
                      className="flex items-center gap-2.5 border border-usb-border rounded-xl px-4 py-3 hover:border-usb-orange/40 hover:bg-usb-canvas transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Link2 size={16} className="text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-usb-text">Desde URL</p>
                        <p className="text-[0.65rem] text-usb-faint">Próximamente</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Download template */}
                <div className="bg-usb-canvas rounded-2xl p-4 border border-usb-border">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-usb-orange-light flex items-center justify-center flex-shrink-0">
                      <HardDriveDownload size={15} className="text-usb-orange" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-usb-text">¿Primera vez?</p>
                      <p className="text-xs text-usb-muted">Descarga nuestra plantilla con los estudiantes y columnas ya configurados</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCSVDownload}
                      disabled={!!downloadLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-60"
                    >
                      {downloadLoading === 'csv' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      Plantilla CSV
                    </button>
                    <button
                      onClick={handleXLSXDownload}
                      disabled={!!downloadLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-60"
                    >
                      {downloadLoading === 'xlsx' ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
                      Plantilla Excel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP: PREVIEW ── */}
            {step === 'preview' && result && (
              <div className="space-y-4">
                {/* File info */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${fileType ? fileTypeInfo[fileType].border : 'border-usb-border'} ${fileType ? fileTypeInfo[fileType].bg : 'bg-usb-canvas'}`}>
                  <FileIcon size={20} className={fileType ? fileTypeInfo[fileType].color : 'text-usb-muted'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-usb-text truncate">{fileName}</p>
                    <p className="text-xs text-usb-muted">{fileType?.toUpperCase()} · Listo para importar</p>
                  </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-usb-canvas rounded-xl p-3 text-center border border-usb-border">
                    <p className="text-2xl font-extrabold text-usb-orange">{result.grades.filter(g => g.value !== null).length}</p>
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-usb-muted mt-0.5">Notas</p>
                  </div>
                  <div className="bg-usb-canvas rounded-xl p-3 text-center border border-usb-border">
                    <p className="text-2xl font-extrabold text-green-600">{result.matched}</p>
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-usb-muted mt-0.5">Estudiantes</p>
                  </div>
                  <div className="bg-usb-canvas rounded-xl p-3 text-center border border-usb-border">
                    <p className="text-2xl font-extrabold text-amber-500">{result.skipped}</p>
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-usb-muted mt-0.5">Omitidos</p>
                  </div>
                </div>

                {/* Warnings */}
                {result.errors.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <p className="text-xs font-bold text-amber-700">Advertencias ({result.errors.length})</p>
                    </div>
                    <ul className="space-y-0.5 max-h-20 overflow-y-auto">
                      {result.errors.map((e, i) => (
                        <li key={i} className="text-[0.7rem] text-amber-700">· {e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* No data warning */}
                {result.grades.length === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700">No se encontraron notas válidas. Verifica que el archivo tenga el formato correcto.</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setStep('upload'); setResult(null) }}
                    className="flex-1 border border-usb-border text-usb-muted font-semibold text-sm py-2.5 rounded-full hover:bg-usb-canvas transition-all"
                  >
                    Cambiar archivo
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={result.grades.length === 0}
                    className="flex-1 bg-usb-orange hover:bg-usb-orange-hover disabled:bg-usb-faint disabled:cursor-not-allowed text-white font-bold text-sm py-2.5 rounded-full transition-all shadow-sm"
                  >
                    Importar {result.grades.filter(g => g.value !== null).length} notas
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: DONE ── */}
            {step === 'done' && (
              <div className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 size={32} className="text-green-500" />
                </motion.div>
                <h3 className="font-extrabold text-lg text-usb-text">¡Importación exitosa!</h3>
                <p className="text-sm text-usb-muted mt-1">
                  Se actualizaron <span className="font-bold text-usb-orange">{result?.grades.filter(g => g.value !== null).length}</span> calificaciones en la tabla.
                </p>
                <button
                  onClick={onClose}
                  className="mt-5 bg-usb-orange hover:bg-usb-orange-hover text-white font-bold text-sm px-8 py-2.5 rounded-full transition-all shadow-sm"
                >
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
