import { apiHttp } from '@/lib/http'

export async function checkHandleAvailability(handle: string): Promise<boolean> {
  try {
    const response = await apiHttp.get<{ available: boolean; handle: string }>(`/channels/check-handle/${handle}`)
    return response.data.available
  } catch (error) {
    console.error('Error checking handle availability:', error)
    // En cas d'erreur, on considère que c'est disponible pour ne pas bloquer l'utilisateur
    return true
  }
}
