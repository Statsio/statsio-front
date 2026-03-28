import axios from 'axios'

type ValidationErrors = Record<string, string[]>

interface LaravelValidationErrorPayload {
  message?: string
  errors?: ValidationErrors
}

export const isUnauthorizedError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const message = error.response?.data?.message

  return typeof message === 'string' && message.trim().length > 0 ? message : fallback
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
