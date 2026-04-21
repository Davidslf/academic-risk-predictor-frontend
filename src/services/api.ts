/**
 * Base HTTP client.
 * - Attaches JWT bearer token when available.
 * - Throws ApiError with status code on non-2xx responses.
 */

import { API_V1 } from '../config/env'

// ─── Token storage helpers ───────────────────────────────────────────────────

const ACCESS_KEY  = 'ar-token'
const REFRESH_KEY = 'ar-refresh-token'

export const tokenStore = {
  getAccess:    ()    => localStorage.getItem(ACCESS_KEY),
  getRefresh:   ()    => localStorage.getItem(REFRESH_KEY),
  setTokens:    (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clearTokens:  () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// ─── Custom error ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, ...init } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }

  if (!skipAuth) {
    const token = tokenStore.getAccess()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_V1}${path}`, { ...init, headers })

  if (!res.ok) {
    let body: unknown
    try { body = await res.json() } catch { /* ignore */ }
    const detail = (body as { detail?: string })?.detail ?? res.statusText
    throw new ApiError(res.status, detail, body)
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T

  return res.json() as Promise<T>
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export const api = {
  get:    <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { method: 'GET', ...opts }),

  post:   <T>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...opts }),

  patch:  <T>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...opts }),

  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { method: 'DELETE', ...opts }),
}
