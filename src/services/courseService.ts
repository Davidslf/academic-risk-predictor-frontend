/**
 * Course service.
 * Wraps /api/v1/programs/{id}/courses and /api/v1/professors/{id}/courses endpoints.
 */

import { api } from './api'
import type { BackendUser } from './authService'
import type { PaginatedResponse } from './userService'

// ─── Backend DTOs ─────────────────────────────────────────────────────────────

export interface BackendCourse {
  id:              string
  code:            string
  name:            string
  credits:         number
  academic_period: string
  program_id:      string
  professor_id?:   string | null
  status:          'ACTIVE' | 'INACTIVE'
  created_at:      string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface CourseCreateInput {
  code:            string
  name:            string
  credits:         number
  academic_period: string
  program_id:      string
}

export const courseService = {
  /** Create a new course. */
  async create(body: CourseCreateInput): Promise<BackendCourse> {
    return api.post<BackendCourse>('/courses', body)
  },

  /**
   * List courses belonging to a program.
   */
  async listByProgram(programId: string): Promise<BackendCourse[]> {
    return api.get<BackendCourse[]>(`/programs/${programId}/courses`)
  },

  /**
   * List courses assigned to a specific professor.
   */
  async listByProfessor(professorId: string): Promise<BackendCourse[]> {
    return api.get<BackendCourse[]>(`/professors/${professorId}/courses`)
  },

  /**
   * List courses within a specific university program.
   */
  async listByUniversityAndProgram(
    universityId: string,
    programId: string,
  ): Promise<BackendCourse[]> {
    return api.get<BackendCourse[]>(
      `/universities/${universityId}/programs/${programId}/courses`,
    )
  },

  /**
   * Get the professor assigned to a course.
   */
  async getCourseProf(courseId: string): Promise<BackendUser> {
    return api.get<BackendUser>(`/courses/${courseId}/professor`)
  },

  /**
   * List students enrolled in a course (professor must be provided for auth check).
   */
  async listCourseStudents(courseId: string, professorId: string): Promise<BackendUser[]> {
    return api.get<BackendUser[]>(
      `/courses/${courseId}/students?professor_id=${professorId}`,
    )
  },

  /**
   * Get a single course by ID.
   */
  async getById(courseId: string): Promise<BackendCourse> {
    return api.get<BackendCourse>(`/courses/${courseId}`)
  },

  /**
   * List courses with pagination (accessible by any authenticated user).
   */
  async listAll(params: {
    status?: 'ACTIVE' | 'INACTIVE'
    skip?:   number
    limit?:  number
  } = {}): Promise<PaginatedResponse<BackendCourse>> {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.skip  != null) qs.set('skip',  String(params.skip))
    if (params.limit != null) qs.set('limit', String(params.limit))
    const query = qs.toString() ? `?${qs}` : ''
    return api.get<PaginatedResponse<BackendCourse>>(`/courses${query}`)
  },
}
