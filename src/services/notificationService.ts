/**
 * Notification service — triggers email notifications via the backend.
 */

import { api } from './api'

export interface RiskAlertPayload {
  student_name:    string
  student_email:   string
  professor_email: string
  professor_name:  string
  risk_level:      string   // 'ALTO' | 'MEDIO' | 'BAJO'
  course_name:     string
}

export interface PredictorReminderPayload {
  student_email: string
  student_name:  string
}

export const notificationService = {
  /**
   * Notify the professor that one of their students has HIGH academic risk.
   * Called automatically after a prediction comes back ALTO.
   */
  async sendRiskAlert(payload: RiskAlertPayload): Promise<void> {
    await api.post('/notifications/risk-alert', payload)
  },

  /**
   * Send a motivational reminder to a student to use the predictor.
   * Can be triggered from the admin panel or automatically.
   */
  async sendPredictorReminder(payload: PredictorReminderPayload): Promise<void> {
    await api.post('/notifications/predictor-reminder', payload)
  },
}
