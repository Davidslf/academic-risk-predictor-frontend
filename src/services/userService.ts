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

export interface AuditLogEntry {
  id:               string
  operation:        'INSERT' | 'UPDATE' | 'DELETE' | string
  changed_by_id:    string | null
  changed_by_name:  string | null
  previous_data:    Record<string, unknown> | null
  new_data:         Record<string, unknown> | null
  timestamp:        string
}

export interface UserUpdatePayload {
  full_name?:           string
  role?:                UserRole
  password?:            string
  ml_consent?:          boolean
  institutional_email?: string
}

export const userService = {
  /**
   * List users with optional role / status / program filters.
   */
  async list(params: {
    role?:       UserRole
    status?:     UserStatus
    skip?:       number
    limit?:      number
    program_id?: string
  } = {}): Promise<PaginatedResponse<BackendUser>> {
    const qs = new URLSearchParams()
    if (params.role)       qs.set('role', params.role)
    if (params.status)     qs.set('status', params.status)
    if (params.program_id) qs.set('program_id', params.program_id)
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
   * Partial update a user (ADMIN only).
   */
  async update(userId: string, data: UserUpdatePayload): Promise<BackendUser> {
    return api.patch<BackendUser>(`/users/${userId}`, data)
  },

  /**
   * Update user status (ADMIN only).
   */
  async updateStatus(userId: string, status: UserStatus): Promise<BackendUser> {
    return api.patch<BackendUser>(`/users/${userId}/status`, { status })
  },

  /**
   * Get audit history for a user (ADMIN only).
   */
  async getHistory(userId: string): Promise<AuditLogEntry[]> {
    return api.get<AuditLogEntry[]>(`/users/${userId}/history`)
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
