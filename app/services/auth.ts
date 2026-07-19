import { http } from '@/lib/http'
import type {
  ApiAuthPayload,
  ApiAuthResponse,
  ApiAuthUserResponse,
  ApiRegisterPendingResponse,
  AuthSession,
  AuthUserPayload,
  ForgotPasswordPayload,
  GoogleAuthPayload,
  LoginPayload,
  RegisterPayload,
  RegisterPendingData,
  ResendVerificationPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from '@/types/auth'

const toAuthSession = (payload: ApiAuthPayload): AuthSession => ({
  token: payload.access_token ?? payload.token ?? '',
  type: payload.type,
  refreshToken: payload.refresh_token,
  expiresIn: payload.expires_in,
  user: payload.user,
})

export const loginRequest = async (payload: LoginPayload) => {
  const { data } = await http.post<ApiAuthResponse>('/login', payload)

  return toAuthSession(data.data)
}

export const registerRequest = async (payload: RegisterPayload): Promise<RegisterPendingData> => {
  const { data } = await http.post<ApiRegisterPendingResponse>('/register', payload)

  return data.data
}

export const verifyEmailRequest = async (payload: VerifyEmailPayload): Promise<AuthSession> => {
  const { data } = await http.post<ApiAuthResponse>('/verify-email', payload)

  return toAuthSession(data.data)
}

export const resendVerificationRequest = async (payload: ResendVerificationPayload): Promise<void> => {
  await http.post('/verify-email/resend', payload)
}

export const forgotPasswordRequest = async (payload: ForgotPasswordPayload): Promise<void> => {
  await http.post('/forgot-password', payload)
}

export const resetPasswordRequest = async (payload: ResetPasswordPayload): Promise<void> => {
  await http.post('/reset-password', payload)
}

export const googleAuthRequest = async (payload: GoogleAuthPayload) => {
  const { data } = await http.post<ApiAuthResponse>('/google', payload)

  return toAuthSession(data.data)
}

export const refreshTokenRequest = async (refreshToken: string) => {
  const { data } = await http.post<ApiAuthResponse>('/refresh', {
    refresh_token: refreshToken,
  })

  return toAuthSession(data.data)
}

export const logoutRequest = async () => {
  await http.post('/logout')
}

export const meRequest = async () => {
  const { data } = await http.get<AuthUserPayload | ApiAuthUserResponse>('/me')

  if (typeof data === 'object' && data !== null && 'data' in data) {
    return data.data.user
  }

  return data
}
