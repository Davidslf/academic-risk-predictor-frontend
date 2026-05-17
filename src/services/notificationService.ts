/**
 * Notification service — in-app notifications + email triggers.
 */

import { api } from './api'
import { API_BASE } from '../config/env'
import { tokenStore } from './api'

function h() {
  const t = tokenStore.getAccess()
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }
}

// ─── Email notifications (existing) ──────────────────────────────────────────

export interface RiskAlertPayload {
  student_name:    string
  student_email:   string
  professor_email: string
  professor_name:  string
  risk_level:      string
  course_name:     string
}

export interface PredictorReminderPayload {
  student_email: string
  student_name:  string
}

// ─── In-app notifications ─────────────────────────────────────────────────────

export interface InAppNotification {
  id: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

const INAPP = `${API_BASE}/api/v1/inapp/notifications`

export const inAppService = {
  async getUnread(): Promise<InAppNotification[]> {
    try {
      const res = await fetch(INAPP, { headers: h() })
      return res.ok ? res.json() : []
    } catch { return [] }
  },
  async getAll(limit = 30): Promise<InAppNotification[]> {
    try {
      const res = await fetch(`${INAPP}/all?limit=${limit}`, { headers: h() })
      return res.ok ? res.json() : []
    } catch { return [] }
  },
  async getUnreadCount(): Promise<number> {
    try {
      const res = await fetch(`${INAPP}/unread-count`, { headers: h() })
      if (!res.ok) return 0
      return (await res.json()).count ?? 0
    } catch { return 0 }
  },
  async markRead(id: string): Promise<void> {
    await fetch(`${INAPP}/${id}/read`, { method: 'PATCH', headers: h() })
  },
  async markAllRead(): Promise<void> {
    await fetch(`${INAPP}/read-all`, { method: 'PATCH', headers: h() })
  },
  async deleteOne(id: string): Promise<void> {
    await fetch(`${INAPP}/${id}`, { method: 'DELETE', headers: h() })
  },
}

// ─── User profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  whatsapp_enabled: boolean
  email_enabled: boolean
  role: string
}

export const profileService = {
  async get(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/api/v1/users/me/profile`, { headers: h() })
    if (!res.ok) throw new Error('No se pudo cargar el perfil')
    return res.json()
  },
  async update(data: Partial<Pick<UserProfile, 'phone' | 'full_name' | 'whatsapp_enabled' | 'email_enabled'>>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/api/v1/users/me/profile`, {
      method: 'PATCH', headers: h(), body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('No se pudo actualizar el perfil')
    return res.json()
  },
}

// ─── Legacy email helpers ─────────────────────────────────────────────────────

export const notificationService = {
  async sendRiskAlert(payload: RiskAlertPayload): Promise<void> {
    await api.post('/notifications/risk-alert', payload)
  },
  async sendPredictorReminder(payload: PredictorReminderPayload): Promise<void> {
    await api.post('/notifications/predictor-reminder', payload)
  },
}
