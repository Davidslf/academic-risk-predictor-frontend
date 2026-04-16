import type { Course, Student } from '../types'

/**
 * Generates and downloads a CSV template for grade entry.
 * Columns: Código, Nombre, ...component names
 */
export function downloadCSVTemplate(course: Course, students: Student[]) {
  const courseStudents = students.filter(s => course.studentIds.includes(s.id))
  const compHeaders = course.components.map(c => `${c.name} (${c.percentage}%)`)
  const headers = ['Código', 'Nombre', ...compHeaders]

  const rows = courseStudents.map(s => [
    s.studentCode,
    s.name,
    ...course.components.map(() => ''),
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `plantilla_${course.code}_${course.group}_corte1.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Generates and downloads an XLSX template using SheetJS.
 */
export async function downloadXLSXTemplate(course: Course, students: Student[]) {
  const XLSX = await import('xlsx')
  const courseStudents = students.filter(s => course.studentIds.includes(s.id))
  const compHeaders = course.components.map(c => `${c.name} (${c.percentage}%)`)

  const wsData = [
    ['Código', 'Nombre', ...compHeaders],
    ...courseStudents.map(s => [s.studentCode, s.name, ...course.components.map(() => '')]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Style header row width
  ws['!cols'] = [
    { wch: 14 },
    { wch: 30 },
    ...course.components.map(() => ({ wch: 18 })),
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones Corte 1')

  // Add info sheet
  const infoData = [
    ['Portal de Calificaciones — Universidad San Buenaventura'],
    [`Materia: ${course.name} (${course.code})`],
    [`Grupo: ${course.group}  |  Período: 2024-I`],
    [''],
    ['INSTRUCCIONES:'],
    ['1. No modifique los encabezados ni los códigos de estudiante.'],
    ['2. Ingrese notas entre 0.0 y 5.0 (use punto como decimal).'],
    ['3. Deje vacío si la nota no ha sido registrada.'],
    ['4. Guarde el archivo y cárguelo en el portal.'],
    [''],
    ['Distribución del 40%:'],
    ...course.components.map(c => [`  • ${c.name}: ${c.percentage}%`]),
  ]
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
  wsInfo['!cols'] = [{ wch: 50 }]
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Instrucciones')

  XLSX.writeFile(wb, `plantilla_${course.code}_${course.group}_corte1.xlsx`)
}
