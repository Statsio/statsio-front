import axios from 'axios'

type ValidationErrors = Record<string, string[]>

interface LaravelValidationErrorPayload {
  message?: string
  errors?: ValidationErrors
}

export const isUnauthorizedError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Message principal + détail validation Laravel + message d’exception debug si présent. */
export const formatApiErrorDetail = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const data = error.response?.data
  const parts: string[] = []

  if (isRecord(data)) {
    const msg = data.message
    if (typeof msg === 'string' && msg.trim()) parts.push(msg.trim())

    const errors = data.errors
    if (isRecord(errors)) {
      for (const [key, val] of Object.entries(errors)) {
        if (Array.isArray(val) && val[0]) parts.push(`${key} : ${String(val[0])}`)
        else if (typeof val === 'string') parts.push(`${key} : ${val}`)
      }
    }

    const debug = data.debug
    if (isRecord(debug)) {
      const ex = debug.message
      if (typeof ex === 'string' && ex.trim() && !parts.some((p) => p.includes(ex))) parts.push(ex.trim())
    }
  }

  if (parts.length === 0) {
    const st = error.response?.status
    if (st) return `${fallback} (HTTP ${st})`
    return fallback
  }

  return [...new Set(parts)].join(' — ')
}

export const getErrorMessage = (error: unknown, fallback: string) => {
  return formatApiErrorDetail(error, fallback)
}

export const getValidationErrors = (error: unknown) => {
  if (!axios.isAxiosError<LaravelValidationErrorPayload>(error) || error.response?.status !== 422) {
    return {}
  }

  const errors = error.response.data?.errors ?? {}

  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? 'Champ invalide']),
  ) as Record<string, string>
}
