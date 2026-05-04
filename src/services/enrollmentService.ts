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

export interface BackendGradesRead {
  id:                  string
  student_id:          string
  course_id:           string
  grades:              Record<string, unknown> | null
  first_cohort_grade:  number | null
  second_cohort_grade: number | null
  third_cohort_grade:  number | null
  final_grade:         number | null
}

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface IndicatorsUpdateInput {
  asistencia?:     number | null
  seguimiento?:    number | null
  nota_parcial_1?: number | null
  logins?:         number | null
  uso_tutorias?:   boolean | null
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

  /**
   * Get grades for a specific enrollment.
   * STUDENT can only access their own; PROFESSOR/ADMIN can access any.
   */
  async getGrades(enrollmentId: string): Promise<BackendGradesRead> {
    return api.get<BackendGradesRead>(`/enrollments/${enrollmentId}/grades`)
  },

  /**
   * Update flat indicator columns for an enrollment.
   * PROFESSOR can only update enrollments in their own courses.
   */
  async updateIndicators(
    enrollmentId: string,
    body: IndicatorsUpdateInput,
  ): Promise<BackendEnrollment> {
    return api.patch<BackendEnrollment>(`/enrollments/${enrollmentId}/indicators`, body)
  },
}
