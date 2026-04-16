import type { Course, Grade, Student } from '../types'

export interface ImportResult {
  grades: Grade[]
  matched: number
  skipped: number
  errors: string[]
}

function parseGradeValue(raw: string): number | null {
  if (!raw || raw.trim() === '') return null
  const n = parseFloat(raw.replace(',', '.').trim())
  if (isNaN(n)) return null
  return Math.min(5, Math.max(0, Math.round(n * 10) / 10))
}

/**
 * Matches a column header to a component by name (fuzzy, case-insensitive).
 */
function matchComponent(header: string, course: Course): string | null {
  const h = header.toLowerCase().replace(/\s*\(\d+%\)/g, '').trim()
  for (const c of course.components) {
    if (c.name.toLowerCase().trim() === h) return c.id
    if (h.includes(c.name.toLowerCase().trim())) return c.id
  }
  return null
}

/**
 * Parse CSV text and return ImportResult.
 */
export function parseCSV(text: string, course: Course, students: Student[]): ImportResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { grades: [], matched: 0, skipped: 0, errors: ['Archivo vacío o sin datos'] }

  const parseRow = (line: string) =>
    line.split(',').map(cell => cell.replace(/^"|"$/g, '').replace(/""/g, '"').trim())

  const headers = parseRow(lines[0])
  const codeIdx = headers.findIndex(h => h.toLowerCase().includes('código') || h.toLowerCase().includes('codigo') || h.toLowerCase() === 'code')
  if (codeIdx === -1) return { grades: [], matched: 0, skipped: 0, errors: ['No se encontró columna "Código"'] }

  const compMap: Record<number, string> = {}
  headers.forEach((h, i) => {
    if (i === codeIdx) return
    const id = matchComponent(h, course)
    if (id) compMap[i] = id
  })

  const courseStudents = students.filter(s => course.studentIds.includes(s.id))
  const grades: Grade[] = []
  let matched = 0, skipped = 0
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i])
    const code = row[codeIdx]
    if (!code) continue

    const student = courseStudents.find(s => s.studentCode === code)
    if (!student) { skipped++; errors.push(`Código no encontrado: ${code}`); continue }

    matched++
    Object.entries(compMap).forEach(([colIdx, compId]) => {
      const val = parseGradeValue(row[Number(colIdx)])
      grades.push({ studentId: student.id, componentId: compId, value: val })
    })
  }

  return { grades, matched, skipped, errors }
}

/**
 * Parse XLSX ArrayBuffer and return ImportResult.
 */
export async function parseXLSX(buffer: ArrayBuffer, course: Course, students: Student[]): Promise<ImportResult> {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_csv(ws)
  return parseCSV(rows, course, students)
}

/**
 * Parse XML (simple format: <grades><student code="..."><component name="..." value="..."/></student></grades>)
 */
export function parseXML(text: string, course: Course, students: Student[]): ImportResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')
  const errors: string[] = []

  if (doc.querySelector('parsererror')) {
    return { grades: [], matched: 0, skipped: 0, errors: ['XML inválido'] }
  }

  const courseStudents = students.filter(s => course.studentIds.includes(s.id))
  const grades: Grade[] = []
  let matched = 0, skipped = 0

  const studentEls = doc.querySelectorAll('student')
  studentEls.forEach(el => {
    const code = el.getAttribute('code') ?? el.getAttribute('codigo') ?? ''
    const student = courseStudents.find(s => s.studentCode === code)
    if (!student) { skipped++; errors.push(`Código no encontrado: ${code}`); return }
    matched++
    el.querySelectorAll('component, componente').forEach(comp => {
      const name = comp.getAttribute('name') ?? comp.getAttribute('nombre') ?? ''
      const compId = matchComponent(name, course)
      if (!compId) return
      const val = parseGradeValue(comp.getAttribute('value') ?? comp.getAttribute('valor') ?? '')
      grades.push({ studentId: student.id, componentId: compId, value: val })
    })
  })

  return { grades, matched, skipped, errors }
}
