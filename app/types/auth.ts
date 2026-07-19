export interface AuthProfile {
  id?: number
  user_id?: number
  first_name: string | null
  last_name: string | null
  phone?: string | null
  birthday: string | null
  birth_year?: number | null
  country?: string | null
  region?: string | null
  city?: string | null
  zip_code?: string | null
  avatar?: string | null
}

export interface AuthUser {
  id: number
  email: string
  google_id?: string | null
  email_verified_at?: string | null
  status?: string
  is_admin?: boolean
  suspended_until?: string | null
  anonymized_at?: string | null
  created_at?: string
  updated_at?: string
  profile: AuthProfile | null
}

export type AuthUserPayload = AuthUser

export interface AuthSession {
  token: string
  type: string
  refreshToken?: string
  expiresIn?: number
  user: AuthUser
}

export interface ApiAuthPayload {
  token?: string
  access_token?: string
  refresh_token?: string
  type: string
  expires_in?: number
  user: AuthUser
}

export interface ApiAuthResponse {
  success: boolean
  message: string
  data: ApiAuthPayload
}

export interface ApiAuthUserResponse {
  success: boolean
  message: string
  data: {
    user: AuthUserPayload
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface GoogleAuthPayload {
  id_token: string
}

export interface RegisterPayload {
  first_name: string
  last_name: string
  birthday: string
  email: string
  password: string
}

export interface RegisterPendingData {
  email: string
}

export interface ApiRegisterPendingResponse {
  success: boolean
  message: string
  data: RegisterPendingData
}

export interface VerifyEmailPayload {
  email: string
  code: string
}

export interface ResendVerificationPayload {
  email: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export type PersistMode = 'local' | 'session'
