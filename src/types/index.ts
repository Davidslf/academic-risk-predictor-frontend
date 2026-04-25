export type UserRole = 'student' | 'professor' | 'admin'

export interface AuthUser {
  id: string
  role: UserRole
  name: string
  username: string      // email used to login
  email?: string        // same as username, explicit alias
  professorId?: string  // only when role === 'professor'
  studentId?: string    // only when role === 'student'
}

export interface Professor {
  id: string
  name: string
  title: string
  faculty: string
  department: string
  email: string
  username: string      // login slug e.g. "carlos.mendoza"
  avatar?: string
}

export interface GradeCut {
  id: string
  name: string         // "Corte 1", "Corte 2", "Corte Final"
  percentage: number   // absolute, all cuts must sum to 100
}

export interface GradeComponent {
  id: string
  cutId?: string       // which GradeCut this belongs to
  name: string
  percentage: number   // absolute % out of 100
}

export interface Student {
  id: string
  studentCode: string   // also serves as username for login
  name: string
  program: string
  semester: number
}

export interface Grade {
  studentId: string
  componentId: string
  value: number | null
}

export interface Course {
  id: string
  code: string
  name: string
  group: string
  professorId: string
  semester: string
  studentIds: string[]
  cuts: GradeCut[]
  components: GradeComponent[]
  program?: string
}

export type RiskLevel = 'high' | 'medium' | 'low' | null

export type ReferralType =
  | 'bajo_rendimiento'
  | 'riesgo_desercion'
  | 'inasistencia'
  | 'problemas_personales'
  | 'otro'

export type ReferralAttendance = 'si' | 'no' | 'sin_confirmar'

export interface Referral {
  id:                   string
  studentId:            string
  courseId:             string
  professorId:          string
  type:                 ReferralType
  observations:         string
  referralObservations: string
  date:                 string   // YYYY-MM-DD
  attended:             ReferralAttendance
  createdAt:            string   // ISO
}

export interface University {
  id: string
  name: string
  logo: string           // base64 data URL or empty string
  createdAt: string      // ISO date string YYYY-MM-DD
  programCount: number
  status: 'active' | 'archived'
  archivedAt?: string    // ISO date string, only when status === 'archived'
}

export type ProgramLevel = 'Pregrado' | 'Posgrado' | 'Técnico' | 'Tecnológico'

export interface Program {
  id: string
  universityId: string
  name: string
  level: ProgramLevel
  faculty: string
  credits: number
  duration: string       // e.g. "8 semestres"
}
