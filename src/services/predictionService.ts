/**
 * Prediction service.
 * Wraps POST /api/v1/predict and POST /api/v1/chat.
 */

import { API_BASE } from '../config/env'
import { tokenStore } from './api'

// ─── Request / Response DTOs ─────────────────────────────────────────────────

export interface PredictionInput {
  promedio_asistencia:       number
  promedio_seguimiento:      number
  nota_parcial_1:            number
  inicios_sesion_plataforma: number
  uso_tutorias:              number
}

export interface RadarData {
  labels:           string[]
  estudiante:       number[]
  promedio_aprobado: number[]
}

export interface CoefficientDetail {
  variable:    string
  coeficiente: number
  valor:       number
  contribucion: number
}

export interface MathDetails {
  formula_logit: string
  valor_z:       number
  coeficientes:  CoefficientDetail[]
}

export interface PredictionOutput {
  probabilidad_riesgo: number
  porcentaje_riesgo:   number
  nivel_riesgo:        'ALTO' | 'MEDIO' | 'BAJO'
  analisis_ia:         string
  datos_radar:         RadarData
  detalles_matematicos: MathDetails
}

export interface ChatMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message:  string
  history?: ChatMessage[]
  context?: PredictionInput & { nivel_riesgo?: string; probabilidad_riesgo?: number }
}

export interface ChatResponse {
  response: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

async function postWithAuth<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = tokenStore.getAccess()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let detail = res.statusText
    try { detail = ((await res.json()) as { detail?: string }).detail ?? detail } catch { /* ignore */ }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export const predictionService = {
  /**
   * Run the ML prediction model.
   * @param input  - Academic variables.
   * @param studentId - Optional UUID to validate ML consent.
   */
  async predict(input: PredictionInput, studentId?: string): Promise<PredictionOutput> {
    const qs = studentId ? `?student_id=${studentId}` : ''
    return postWithAuth<PredictionOutput>(`/predict${qs}`, input)
  },

  /**
   * Send a message to the academic advisor chat.
   */
  async chat(req: ChatRequest): Promise<ChatResponse> {
    return postWithAuth<ChatResponse>('/chat', req)
  },
}
