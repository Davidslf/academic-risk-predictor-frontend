/**
 * User service — wraps /api/v1/users endpoints.
 */

import { api } from './api'
import type { BackendUser } from './authService'

export interface PaginatedResponse<T> {
  data:  T[]
  total: number
  skip:  number
  limit: number
}

export type UserRole = 'STUDENT' | 'PROFESSOR' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'INACTIVE'

export const userService = {
  /**
   * List users with optional role / status filters.
   */
  async list(params: {
    role?:   UserRole
    status?: UserStatus
    skip?:   number
    limit?:  number
  } = {}): Promise<PaginatedResponse<BackendUser>> {
    const qs = new URLSearchParams()
    if (params.role)   qs.set('role', params.role)
    if (params.status) qs.set('status', params.status)
    if (params.skip  != null) qs.set('skip',  String(params.skip))
    if (params.limit != null) qs.set('limit', String(params.limit))
    const query = qs.toString() ? `?${qs}` : ''
    return api.get<PaginatedResponse<BackendUser>>(`/users${query}`)
  },

  /**
   * Get a single user by UUID.
   */
  async getById(userId: string): Promise<BackendUser> {
    return api.get<BackendUser>(`/users/${userId}`)
  },

  /**
   * List all active professors (convenience wrapper).
   */
  async listProfessors(): Promise<BackendUser[]> {
    const res = await userService.list({ role: 'PROFESSOR', status: 'ACTIVE', limit: 100 })
    return res.data
  },

  /**
   * List all active students (convenience wrapper).
   */
  async listStudents(): Promise<BackendUser[]> {
    const res = await userService.list({ role: 'STUDENT', status: 'ACTIVE', limit: 100 })
    return res.data
  },
}
