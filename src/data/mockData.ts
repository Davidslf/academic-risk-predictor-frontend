import type { Professor, Student, Course, Grade, University, Program } from '../types'

// Demo password for all users in demonstration mode
export const DEMO_PASSWORD = 'demo'

// ─── Admin credentials ───────────────────────────────────────────────────────
export const adminUser = {
  id: 'admin-1',
  username: 'admin',
  name: 'Administrador',
  role: 'admin' as const,
}

// ─── Universities (mocked) ───────────────────────────────────────────────────
export const initialUniversities: University[] = [
  {
    id: 'uni-1',
    name: 'Universidad Nacional de Colombia',
    logo: '',
    createdAt: '2024-01-15',
    programCount: 8,
    status: 'active',
  },
  {
    id: 'uni-2',
    name: 'Universidad de Antioquia',
    logo: '',
    createdAt: '2024-02-03',
    programCount: 8,
    status: 'active',
  },
  {
    id: 'uni-3',
    name: 'Universidad EAFIT',
    logo: '',
    createdAt: '2024-02-20',
    programCount: 6,
    status: 'active',
  },
]

// ─── Programs (mocked) ───────────────────────────────────────────────────────
export const initialPrograms: Program[] = [
  // Universidad Nacional de Colombia
  { id: 'prog-1', universityId: 'uni-1', name: 'Ingeniería de Sistemas y Computación', level: 'Pregrado', faculty: 'Ingeniería', credits: 165, duration: '10 semestres' },
  { id: 'prog-2', universityId: 'uni-1', name: 'Ingeniería Civil', level: 'Pregrado', faculty: 'Ingeniería', credits: 172, duration: '10 semestres' },
  { id: 'prog-3', universityId: 'uni-1', name: 'Medicina', level: 'Pregrado', faculty: 'Medicina', credits: 240, duration: '12 semestres' },
  { id: 'prog-4', universityId: 'uni-1', name: 'Derecho', level: 'Pregrado', faculty: 'Derecho, Ciencias Políticas y Sociales', credits: 162, duration: '10 semestres' },
  { id: 'prog-5', universityId: 'uni-1', name: 'Economía', level: 'Pregrado', faculty: 'Ciencias Económicas', credits: 150, duration: '10 semestres' },
  { id: 'prog-6', universityId: 'uni-1', name: 'Psicología', level: 'Pregrado', faculty: 'Ciencias Humanas', credits: 160, duration: '10 semestres' },
  { id: 'prog-7', universityId: 'uni-1', name: 'Maestría en Ingeniería — Sistemas', level: 'Posgrado', faculty: 'Ingeniería', credits: 52, duration: '4 semestres' },
  { id: 'prog-8', universityId: 'uni-1', name: 'Doctorado en Ciencias — Informática', level: 'Posgrado', faculty: 'Ingeniería', credits: 80, duration: '8 semestres' },
  // Universidad de Antioquia
  { id: 'prog-9', universityId: 'uni-2', name: 'Administración de Empresas', level: 'Pregrado', faculty: 'Ciencias Económicas', credits: 155, duration: '10 semestres' },
  { id: 'prog-10', universityId: 'uni-2', name: 'Ingeniería Electrónica', level: 'Pregrado', faculty: 'Ingeniería', credits: 168, duration: '10 semestres' },
  { id: 'prog-11', universityId: 'uni-2', name: 'Enfermería', level: 'Pregrado', faculty: 'Enfermería', credits: 175, duration: '10 semestres' },
  { id: 'prog-12', universityId: 'uni-2', name: 'Comunicaciones', level: 'Pregrado', faculty: 'Comunicaciones', credits: 148, duration: '10 semestres' },
  { id: 'prog-13', universityId: 'uni-2', name: 'Técnico Auxiliar Contable', level: 'Técnico', faculty: 'Ciencias Económicas', credits: 48, duration: '2 semestres' },
  { id: 'prog-14', universityId: 'uni-2', name: 'Tecnología en Sistemas de Inf.', level: 'Tecnológico', faculty: 'Ingeniería', credits: 90, duration: '6 semestres' },
  { id: 'prog-15', universityId: 'uni-2', name: 'Especialización en Gerencia', level: 'Posgrado', faculty: 'Ciencias Económicas', credits: 36, duration: '2 semestres' },
  { id: 'prog-16', universityId: 'uni-2', name: 'Filosofía', level: 'Pregrado', faculty: 'Artes y Humanidades', credits: 152, duration: '10 semestres' },
  // Universidad EAFIT
  { id: 'prog-17', universityId: 'uni-3', name: 'Ingeniería de Producción', level: 'Pregrado', faculty: 'Ingeniería', credits: 160, duration: '10 semestres' },
  { id: 'prog-18', universityId: 'uni-3', name: 'Ingeniería de Sistemas', level: 'Pregrado', faculty: 'Ingeniería', credits: 158, duration: '10 semestres' },
  { id: 'prog-19', universityId: 'uni-3', name: 'Administración de Negocios', level: 'Pregrado', faculty: 'Escuela de Negocios', credits: 150, duration: '10 semestres' },
  { id: 'prog-20', universityId: 'uni-3', name: 'Geología', level: 'Pregrado', faculty: 'Ciencias', credits: 162, duration: '10 semestres' },
  { id: 'prog-21', universityId: 'uni-3', name: 'Maestría en Administración', level: 'Posgrado', faculty: 'Escuela de Negocios', credits: 60, duration: '4 semestres' },
  { id: 'prog-22', universityId: 'uni-3', name: 'Música', level: 'Pregrado', faculty: 'Humanidades', credits: 144, duration: '10 semestres' },
]

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
  { id: 's01', studentCode: '2021100001', name: 'Valentina Ramos Ortiz', program: 'Ing. de Sistemas', semester: 5 },
  { id: 's02', studentCode: '2021100002', name: 'Sebastián Mora Díaz', program: 'Ing. de Sistemas', semester: 5 },
  { id: 's03', studentCode: '2021100003', name: 'Daniela Castro Herrera', program: 'Ing. de Sistemas', semester: 5 },
  { id: 's04', studentCode: '2021100004', name: 'Andrés Felipe Suárez', program: 'Ing. Civil', semester: 4 },
  { id: 's05', studentCode: '2021100005', name: 'Laura Sofía Peña', program: 'Ing. de Sistemas', semester: 5 },
  { id: 's06', studentCode: '2021100006', name: 'Camilo Andrés Torres', program: 'Ing. Civil', semester: 4 },
  { id: 's07', studentCode: '2021100007', name: 'Isabella Martínez Cruz', program: 'Ing. de Sistemas', semester: 5 },
  { id: 's08', studentCode: '2021100008', name: 'David Esteban López', program: 'Administración', semester: 3 },
  { id: 's09', studentCode: '2021100009', name: 'María Alejandra Gómez', program: 'Ing. de Sistemas', semester: 5 },
  { id: 's10', studentCode: '2021100010', name: 'Juan Pablo Vargas', program: 'Ing. Civil', semester: 4 },
  { id: 's11', studentCode: '2021200001', name: 'Juliana Ríos Morales', program: 'Matemáticas', semester: 6 },
  { id: 's12', studentCode: '2021200002', name: 'Santiago Muñoz Cárdenas', program: 'Ing. Civil', semester: 4 },
  { id: 's13', studentCode: '2021200003', name: 'Natalia Ospina Vega', program: 'Matemáticas', semester: 6 },
  { id: 's14', studentCode: '2021200004', name: 'Tomás Bejarano Silva', program: 'Administración', semester: 3 },
  { id: 's15', studentCode: '2021200005', name: 'Mariana Guerrero Pinto', program: 'Ing. de Sistemas', semester: 5 },
  { id: 's16', studentCode: '2022100001', name: 'Felipe Arango Restrepo', program: 'Matemáticas', semester: 2 },
  { id: 's17', studentCode: '2022100002', name: 'Sara Quintero Ibáñez', program: 'Matemáticas', semester: 2 },
  { id: 's18', studentCode: '2022100003', name: 'Alejandro Palacios Ruiz', program: 'Ing. Civil', semester: 2 },
  { id: 's19', studentCode: '2022100004', name: 'Luisa Fernanda Castillo', program: 'Matemáticas', semester: 2 },
  { id: 's20', studentCode: '2022100005', name: 'Nicolás Echeverri Duque', program: 'Administración', semester: 3 },
]

export const courses: Course[] = [
  {
    id: 'c1', code: 'IS-101', name: 'Programación Orientada a Objetos', group: 'G1',
    professorId: 'prof-1', semester: '2024-I', program: 'Ingeniería de Sistemas',
    studentIds: ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10', 's11', 's12', 's13', 's14', 's15'],
    cuts: [
      { id: 'c1-cut1', name: 'Corte 1',     percentage: 30 },
      { id: 'c1-cut2', name: 'Corte 2',     percentage: 30 },
      { id: 'c1-cut3', name: 'Corte Final', percentage: 40 },
    ],
    components: [
      { id: 'c1-q1', cutId: 'c1-cut1', name: 'Quiz 1',           percentage: 10 },
      { id: 'c1-q2', cutId: 'c1-cut1', name: 'Quiz 2',           percentage: 10 },
      { id: 'c1-as', cutId: 'c1-cut1', name: 'Asistencia',       percentage: 10 },
      { id: 'c1-ta', cutId: 'c1-cut2', name: 'Taller',           percentage: 15 },
      { id: 'c1-pr', cutId: 'c1-cut2', name: 'Proyecto Parcial', percentage: 15 },
      { id: 'c1-ef', cutId: 'c1-cut3', name: 'Examen Final',     percentage: 40 },
    ],
  },
  {
    id: 'c2', code: 'IS-102', name: 'Estructuras de Datos', group: 'G2',
    professorId: 'prof-1', semester: '2024-I', program: 'Ingeniería de Sistemas',
    studentIds: ['s01', 's03', 's05', 's07', 's09', 's11', 's12', 's13', 's14', 's15', 's16', 's17'],
    cuts: [
      { id: 'c2-cut1', name: 'Corte 1',     percentage: 30 },
      { id: 'c2-cut2', name: 'Corte 2',     percentage: 30 },
      { id: 'c2-cut3', name: 'Corte Final', percentage: 40 },
    ],
    components: [
      { id: 'c2-q1', cutId: 'c2-cut1', name: 'Quiz',          percentage: 10 },
      { id: 'c2-ta', cutId: 'c2-cut1', name: 'Taller',        percentage: 10 },
      { id: 'c2-pr', cutId: 'c2-cut1', name: 'Práctica',      percentage: 10 },
      { id: 'c2-pa', cutId: 'c2-cut2', name: 'Parcial',       percentage: 30 },
      { id: 'c2-ef', cutId: 'c2-cut3', name: 'Examen Final',  percentage: 40 },
    ],
  },
  {
    id: 'c3', code: 'MAT-201', name: 'Cálculo Diferencial', group: 'G1',
    professorId: 'prof-2', semester: '2024-I', program: 'Ciencias Básicas',
    studentIds: ['s01', 's02', 's04', 's06', 's08', 's10', 's11', 's13', 's15', 's16', 's17', 's18', 's19', 's20'],
    cuts: [
      { id: 'c3-cut1', name: 'Corte 1',     percentage: 30 },
      { id: 'c3-cut2', name: 'Corte 2',     percentage: 30 },
      { id: 'c3-cut3', name: 'Corte Final', percentage: 40 },
    ],
    components: [
      { id: 'c3-q1', cutId: 'c3-cut1', name: 'Quiz 1',         percentage: 10 },
      { id: 'c3-q2', cutId: 'c3-cut1', name: 'Quiz 2',         percentage: 10 },
      { id: 'c3-ta', cutId: 'c3-cut1', name: 'Taller',         percentage: 10 },
      { id: 'c3-pa', cutId: 'c3-cut2', name: 'Examen Parcial', percentage: 30 },
      { id: 'c3-ef', cutId: 'c3-cut3', name: 'Examen Final',   percentage: 40 },
    ],
  },
  {
    id: 'c4', code: 'MAT-202', name: 'Álgebra Lineal', group: 'G3',
    professorId: 'prof-2', semester: '2024-I', program: 'Ciencias Básicas',
    studentIds: ['s02', 's04', 's06', 's08', 's10', 's12', 's14', 's16', 's18', 's20'],
    cuts: [
      { id: 'c4-cut1', name: 'Corte 1',     percentage: 30 },
      { id: 'c4-cut2', name: 'Corte 2',     percentage: 30 },
      { id: 'c4-cut3', name: 'Corte Final', percentage: 40 },
    ],
    components: [
      { id: 'c4-q1', cutId: 'c4-cut1', name: 'Quiz',          percentage: 10 },
      { id: 'c4-as', cutId: 'c4-cut1', name: 'Asistencia',    percentage: 10 },
      { id: 'c4-ta', cutId: 'c4-cut1', name: 'Trabajo',       percentage: 10 },
      { id: 'c4-pa', cutId: 'c4-cut2', name: 'Parcial',       percentage: 30 },
      { id: 'c4-ef', cutId: 'c4-cut3', name: 'Examen Final',  percentage: 40 },
    ],
  },
  {
    id: 'c5', code: 'MAT-301', name: 'Matemáticas Discretas', group: 'G2',
    professorId: 'prof-3', semester: '2024-I', program: 'Ciencias Básicas',
    studentIds: ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09', 's10', 's11', 's12'],
    cuts: [
      { id: 'c5-cut1', name: 'Corte 1',     percentage: 30 },
      { id: 'c5-cut2', name: 'Corte 2',     percentage: 30 },
      { id: 'c5-cut3', name: 'Corte Final', percentage: 40 },
    ],
    components: [
      { id: 'c5-q1', cutId: 'c5-cut1', name: 'Quiz 1',         percentage: 10 },
      { id: 'c5-q2', cutId: 'c5-cut1', name: 'Quiz 2',         percentage: 10 },
      { id: 'c5-pr', cutId: 'c5-cut1', name: 'Proyecto',       percentage: 10 },
      { id: 'c5-pa', cutId: 'c5-cut2', name: 'Examen Parcial', percentage: 30 },
      { id: 'c5-ef', cutId: 'c5-cut3', name: 'Examen Final',   percentage: 40 },
    ],
  },
]

const pool = [1.5, 1.8, 2.0, 2.3, 2.5, 2.7, 3.0, 3.2, 3.5, 3.7, 3.8, 4.0, 4.2, 4.5, 4.8, 5.0]
const failPool = [1.0, 1.3, 1.5, 1.8, 2.0, 2.2, 2.4]

export function generateInitialGrades(): Grade[] {
  const grades: Grade[] = []
  const atRiskStudents = ['s02', 's06', 's10', 's14']
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
