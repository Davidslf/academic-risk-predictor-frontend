/**
 * Program & University service.
 * Wraps /api/v1/universities and /api/v1/programs endpoints.
 */

import { api } from './api'
import type { PaginatedResponse } from './userService'

// ─── Backend DTOs ─────────────────────────────────────────────────────────────

export interface BackendUniversity {
  id:         string
  name:       string
  code:       string
  country:    string
  city:       string
  active:     boolean
  created_at: string
}

export interface BackendProgram {
  id:             string
  university_id:  string
  campus_id:      string
  institution:    string
  degree_type:    string
  program_code:   string
  program_name:   string
  pensum:         string
  academic_group: string
  location:       string
  snies_code:     number
  created_at:     string
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const programService = {
  /**
   * List all universities (paged).
   */
  async listUniversities(skip = 0, limit = 50): Promise<PaginatedResponse<BackendUniversity>> {
    return api.get<PaginatedResponse<BackendUniversity>>(
      `/universities?skip=${skip}&limit=${limit}`,
    )
  },

  /**
   * Get a single university by ID.
   */
  async getUniversity(universityId: string): Promise<BackendUniversity> {
    return api.get<BackendUniversity>(`/universities/${universityId}`)
  },

  /**
   * List programs belonging to a university (paged).
   */
  async listProgramsByUniversity(
    universityId: string,
    skip = 0,
    limit = 50,
  ): Promise<PaginatedResponse<BackendProgram>> {
    return api.get<PaginatedResponse<BackendProgram>>(
      `/universities/${universityId}/programs?skip=${skip}&limit=${limit}`,
    )
  },
}
