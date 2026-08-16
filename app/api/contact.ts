import { apiHttp } from '@/lib/http'

export type ContactReason = 'general' | 'partenariat' | 'presse' | 'commercial'

export interface ContactMessagePayload {
  reason: ContactReason
  name: string
  email: string
  company?: string
  message: string
}

export async function submitContactMessage(payload: ContactMessagePayload): Promise<void> {
  await apiHttp.post('/contact', payload)
}
