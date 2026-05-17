import { api } from './api'

export interface Template {
  id: string
  name: string
  type: 'email' | 'whatsapp'
  category: string
  subject: string
  preview_html: string
  preview_text: string
}

export const templateService = {
  getAll: (): Promise<Template[]> => api.get('/templates'),
}
