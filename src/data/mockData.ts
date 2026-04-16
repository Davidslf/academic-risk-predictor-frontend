import type { Professor, Student, Course, Grade } from '../types'

// Demo password for all users in demonstration mode
export const DEMO_PASSWORD = 'demo'

export const professors: Professor[] = [
  {
    id: 'prof-1',
    name: 'Carlos Mendoza',
    title: 'Dr.',
    faculty: 'Facultad de Ingeniería',
    department: 'Ingeniería de Sistemas',
    email: 'c.mendoza@academicrisk.edu',
    username: 'carlos.mendoza',
  },
  {
    id: 'prof-2',
    name: 'Ana García',
    title: 'Dra.',
    faculty: 'Facultad de Ciencias Básicas',
    department: 'Matemáticas y Estadística',
    email: 'a.garcia@academicrisk.edu',
    username: 'ana.garcia',
  },
  {
    id: 'prof-3',
    name: 'Luis Torres',
    title: 'Mg.',
    faculty: 'Facultad de Ingeniería',
    department: 'Ciencias Básicas',
    email: 'l.torres@academicrisk.edu',
    username: 'luis.torres',
  },
]

export const students: Student[] = [
  { id: 's01', studentCode: '2021100001', name: 'Valentina Ramos Ortiz',     program: 'Ing. de Sistemas',  semester: 5 },
  { id: 's02', studentCode: '2021100002', name: 'Sebastián Mora Díaz',       program: 'Ing. de Sistemas',  semester: 5 },
  { id: 's03', studentCode: '2021100003', name: 'Daniela Castro Herrera',    program: 'Ing. de Sistemas',  semester: 5 },
  { id: 's04', studentCode: '2021100004', name: 'Andrés Felipe Suárez',      program: 'Ing. Civil',        semester: 4 },
  { id: 's05', studentCode: '2021100005', name: 'Laura Sofía Peña',          program: 'Ing. de Sistemas',  semester: 5 },
  { id: 's06', studentCode: '2021100006', name: 'Camilo Andrés Torres',      program: 'Ing. Civil',        semester: 4 },
  { id: 's07', studentCode: '2021100007', name: 'Isabella Martínez Cruz',    program: 'Ing. de Sistemas',  semester: 5 },
  { id: 's08', studentCode: '2021100008', name: 'David Esteban López',       program: 'Administración',    semester: 3 },
  { id: 's09', studentCode: '2021100009', name: 'María Alejandra Gómez',     program: 'Ing. de Sistemas',  semester: 5 },
  { id: 's10', studentCode: '2021100010', name: 'Juan Pablo Vargas',         program: 'Ing. Civil',        semester: 4 },
  { id: 's11', studentCode: '2021200001', name: 'Juliana Ríos Morales',      program: 'Matemáticas',       semester: 6 },
  { id: 's12', studentCode: '2021200002', name: 'Santiago Muñoz Cárdenas',   program: 'Ing. Civil',        semester: 4 },
  { id: 's13', studentCode: '2021200003', name: 'Natalia Ospina Vega',       program: 'Matemáticas',       semester: 6 },
  { id: 's14', studentCode: '2021200004', name: 'Tomás Bejarano Silva',      program: 'Administración',    semester: 3 },
  { id: 's15', studentCode: '2021200005', name: 'Mariana Guerrero Pinto',    program: 'Ing. de Sistemas',  semester: 5 },
  { id: 's16', studentCode: '2022100001', name: 'Felipe Arango Restrepo',    program: 'Matemáticas',       semester: 2 },
  { id: 's17', studentCode: '2022100002', name: 'Sara Quintero Ibáñez',      program: 'Matemáticas',       semester: 2 },
  { id: 's18', studentCode: '2022100003', name: 'Alejandro Palacios Ruiz',   program: 'Ing. Civil',        semester: 2 },
  { id: 's19', studentCode: '2022100004', name: 'Luisa Fernanda Castillo',   program: 'Matemáticas',       semester: 2 },
  { id: 's20', studentCode: '2022100005', name: 'Nicolás Echeverri Duque',   program: 'Administración',    semester: 3 },
]

export const courses: Course[] = [
  {
    id: 'c1', code: 'IS-101', name: 'Programación Orientada a Objetos', group: 'G1',
    professorId: 'prof-1', semester: '2024-I',
    studentIds: ['s01','s02','s03','s04','s05','s06','s07','s08','s09','s10','s11','s12','s13','s14','s15'],
    components: [
      { id: 'c1-q1', name: 'Quiz 1',           percentage: 7  },
      { id: 'c1-q2', name: 'Quiz 2',           percentage: 8  },
      { id: 'c1-pr', name: 'Proyecto Parcial', percentage: 15 },
      { id: 'c1-as', name: 'Asistencia',       percentage: 5  },
      { id: 'c1-ta', name: 'Taller',           percentage: 5  },
    ],
  },
  {
    id: 'c2', code: 'IS-102', name: 'Estructuras de Datos', group: 'G2',
    professorId: 'prof-1', semester: '2024-I',
    studentIds: ['s01','s03','s05','s07','s09','s11','s12','s13','s14','s15','s16','s17'],
    components: [
      { id: 'c2-q1', name: 'Quiz',    percentage: 10 },
      { id: 'c2-pa', name: 'Parcial', percentage: 20 },
      { id: 'c2-ta', name: 'Taller',  percentage: 10 },
    ],
  },
  {
    id: 'c3', code: 'MAT-201', name: 'Cálculo Diferencial', group: 'G1',
    professorId: 'prof-2', semester: '2024-I',
    studentIds: ['s01','s02','s04','s06','s08','s10','s11','s13','s15','s16','s17','s18','s19','s20'],
    components: [
      { id: 'c3-q1', name: 'Quiz 1', percentage: 5  },
      { id: 'c3-q2', name: 'Quiz 2', percentage: 5  },
      { id: 'c3-pa', name: 'Examen', percentage: 20 },
      { id: 'c3-ta', name: 'Taller', percentage: 10 },
    ],
  },
  {
    id: 'c4', code: 'MAT-202', name: 'Álgebra Lineal', group: 'G3',
    professorId: 'prof-2', semester: '2024-I',
    studentIds: ['s02','s04','s06','s08','s10','s12','s14','s16','s18','s20'],
    components: [
      { id: 'c4-q1', name: 'Quiz',    percentage: 8  },
      { id: 'c4-pa', name: 'Parcial', percentage: 22 },
      { id: 'c4-as', name: 'Asist.',  percentage: 5  },
      { id: 'c4-ta', name: 'Trabajo', percentage: 5  },
    ],
  },
  {
    id: 'c5', code: 'MAT-301', name: 'Matemáticas Discretas', group: 'G2',
    professorId: 'prof-3', semester: '2024-I',
    studentIds: ['s01','s02','s03','s04','s05','s06','s07','s08','s09','s10','s11','s12'],
    components: [
      { id: 'c5-q1', name: 'Quiz 1',   percentage: 5  },
      { id: 'c5-q2', name: 'Quiz 2',   percentage: 5  },
      { id: 'c5-pa', name: 'Examen',   percentage: 20 },
      { id: 'c5-pr', name: 'Proyecto', percentage: 10 },
    ],
  },
]

const pool     = [1.5,1.8,2.0,2.3,2.5,2.7,3.0,3.2,3.5,3.7,3.8,4.0,4.2,4.5,4.8,5.0]
const failPool = [1.0,1.3,1.5,1.8,2.0,2.2,2.4]

export function generateInitialGrades(): Grade[] {
  const grades: Grade[] = []
  const atRiskStudents = ['s02','s06','s10','s14']
  for (const course of courses) {
    for (const sid of course.studentIds) {
      for (const comp of course.components) {
        if (Math.random() < 0.3) {
          grades.push({ studentId: sid, componentId: comp.id, value: null })
          continue
        }
        const isAtRisk = atRiskStudents.includes(sid)
        const val = isAtRisk
          ? failPool[Math.floor(Math.random() * failPool.length)]
          : pool[Math.floor(Math.random() * pool.length)]
        grades.push({ studentId: sid, componentId: comp.id, value: val })
      }
    }
  }
  return grades
}
