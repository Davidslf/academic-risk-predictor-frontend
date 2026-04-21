/**
 * Centralised environment configuration.
 * Override via VITE_API_BASE_URL in your .env file.
 */
export const API_BASE =
  (import.meta as ImportMeta & { env: Record<string, string> }).env?.VITE_API_BASE_URL ??
  'http://localhost:8001'

export const API_V1 = `${API_BASE}/api/v1`
