export interface AuthProfile {
  first_name: string
  last_name: string
  birthday: string
}

export interface AuthUserPayload {
  id: number
  email: string
  first_name?: string
  last_name?: string
  birthday?: string
  profile?: Partial<AuthProfile>
}

export interface AuthUser {
  id: number
  email: string
  profile: AuthProfile
}

export interface AuthSession {
  token: string
  type: string
  user: AuthUserPayload
}

export interface ApiAuthResponse {
  success: boolean
  message: string
  data: AuthSession
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

export type PersistMode = 'local' | 'session'
