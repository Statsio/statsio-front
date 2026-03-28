import { http } from '@/lib/http'
import type {
  ApiAuthResponse,
  AuthSession,
  AuthUserPayload,
  GoogleAuthPayload,
  LoginPayload,
  RegisterPayload,
} from '@/types/auth'

export const loginRequest = async (payload: LoginPayload) => {
  const { data } = await http.post<ApiAuthResponse>('/login', payload)

  return data.data
}

export const registerRequest = async (payload: RegisterPayload) => {
  const { data } = await http.post<ApiAuthResponse>('/register', payload)

  return data.data
}

export const googleAuthRequest = async (payload: GoogleAuthPayload) => {
  const { data } = await http.post<ApiAuthResponse>('/google', payload)

  return data.data
}

export const logoutRequest = async () => {
  await http.post('/logout')
}

export const meRequest = async () => {
  const { data } = await http.get<AuthUserPayload | AuthSession['user']>('/me')

  return data
}
