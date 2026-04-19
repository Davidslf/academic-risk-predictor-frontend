export type UserRole = 'student' | 'professor' | 'admin'

export interface AuthUser {
  id: string
  role: UserRole
  name: string
  username: string      // student code or professor slug
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

export interface GradeComponent {
  id: string
  name: string
  percentage: number
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
  components: GradeComponent[]
}

export type RiskLevel = 'high' | 'medium' | 'low' | null

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
