/**
 * Enrollment service.
 * Wraps /api/v1/enrollments and /api/v1/students/{id}/enrollments endpoints.
 */

import { api } from './api'

// ─── Backend DTOs ─────────────────────────────────────────────────────────────

export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface BackendEnrollment {
  id:              string
  student_id:      string
  course_id:       string
  status:          EnrollmentStatus
  enrollment_date: string
  updated_at:      string
  // Academic indicator fields (null until set by a professor)
  asistencia:      number | null
  seguimiento:     number | null
  nota_parcial_1:  number | null
  logins:          number | null
  uso_tutorias:    boolean | null
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const enrollmentService = {
  /**
   * List enrollments for a student.
   * STUDENT can access their own; PROFESSOR/ADMIN can access any.
   * @param status — optional filter: PENDING, ACTIVE, COMPLETED, CANCELLED.
   *                 Omit to get all statuses.
   */
  async listByStudent(
    studentId: string,
    status?: EnrollmentStatus,
  ): Promise<BackendEnrollment[]> {
    const qs = status ? `?status=${status}` : ''
    return api.get<BackendEnrollment[]>(`/students/${studentId}/enrollments${qs}`)
  },

  /**
   * Get a single enrollment by ID.
   */
  async getById(enrollmentId: string): Promise<BackendEnrollment> {
    return api.get<BackendEnrollment>(`/enrollments/${enrollmentId}`)
  },
}
