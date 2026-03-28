import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { clearStoredToken, getStoredToken, storeToken } from '@/lib/auth-storage'
import { isUnauthorizedError } from '@/lib/http-errors'
import { googleAuthRequest, loginRequest, logoutRequest, meRequest, registerRequest } from '@/services/auth'
import type {
  AuthSession,
  AuthUser,
  AuthUserPayload,
  LoginPayload,
  PersistMode,
  RegisterPayload,
} from '@/types/auth'

const DEFAULT_PERSIST_MODE: PersistMode = 'local'
const EMPTY_PROFILE = {
  first_name: '',
  last_name: '',
  birthday: '',
}

const normalizeUser = (user: AuthUserPayload): AuthUser => ({
  id: user.id,
  email: user.email,
  profile: {
    first_name: user.profile?.first_name ?? user.first_name ?? EMPTY_PROFILE.first_name,
    last_name: user.profile?.last_name ?? user.last_name ?? EMPTY_PROFILE.last_name,
    birthday: user.profile?.birthday ?? user.birthday ?? EMPTY_PROFILE.birthday,
  },
})

export const useAuthStore = defineStore('auth', () => {
  const storedToken = getStoredToken()

  const token = ref(storedToken?.token ?? null)
  const tokenType = ref(storedToken?.type ?? null)
  const user = ref<AuthUser | null>(null)
  const persistMode = ref<PersistMode>(storedToken?.mode ?? DEFAULT_PERSIST_MODE)
  const isBootstrapping = ref(false)
  const isAuthenticating = ref(false)
  const isLoggingOut = ref(false)

  const hasSession = computed(() => Boolean(token.value))
  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const displayName = computed(() => {
    const firstName = user.value?.profile.first_name?.trim()
    const lastName = user.value?.profile.last_name?.trim()

    if (firstName || lastName) {
      return [firstName, lastName].filter(Boolean).join(' ')
    }

    return user.value?.email ?? 'Mon compte'
  })

  const applySession = (session: AuthSession, mode: PersistMode) => {
    token.value = session.token
    tokenType.value = session.type
    user.value = normalizeUser(session.user)
    persistMode.value = mode
    storeToken(session.token, session.type, mode)
  }

  const clearSession = () => {
    token.value = null
    tokenType.value = null
    user.value = null
    persistMode.value = DEFAULT_PERSIST_MODE
    clearStoredToken()
  }

  const initialize = async () => {
    if (!token.value || isBootstrapping.value) {
      return
    }

    isBootstrapping.value = true

    try {
      user.value = normalizeUser(await meRequest())
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSession()
        return
      }

      throw error
    } finally {
      isBootstrapping.value = false
    }
  }

  const login = async (payload: LoginPayload, mode: PersistMode = DEFAULT_PERSIST_MODE) => {
    isAuthenticating.value = true

    try {
      const session = await loginRequest(payload)
      applySession(session, mode)
      return session.user
    } finally {
      isAuthenticating.value = false
    }
  }

  const register = async (payload: RegisterPayload, mode: PersistMode = DEFAULT_PERSIST_MODE) => {
    isAuthenticating.value = true

    try {
      const session = await registerRequest(payload)
      applySession(session, mode)
      return session.user
    } finally {
      isAuthenticating.value = false
    }
  }

  const authenticateWithGoogle = async (idToken: string, mode: PersistMode = DEFAULT_PERSIST_MODE) => {
    isAuthenticating.value = true

    try {
      const session = await googleAuthRequest({ id_token: idToken })
      applySession(session, mode)
      return session.user
    } finally {
      isAuthenticating.value = false
    }
  }

  const refreshUser = async () => {
    if (!token.value) {
      return null
    }

    user.value = normalizeUser(await meRequest())

    return user.value
  }

  const logout = async () => {
    if (!token.value) {
      clearSession()
      window.google?.accounts.id.disableAutoSelect()
      return
    }

    isLoggingOut.value = true

    try {
      await logoutRequest()
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        throw error
      }
    } finally {
      clearSession()
      window.google?.accounts.id.disableAutoSelect()
      isLoggingOut.value = false
    }
  }

  return {
    token,
    tokenType,
    user,
    persistMode,
    hasSession,
    isAuthenticated,
    displayName,
    isBootstrapping,
    isAuthenticating,
    isLoggingOut,
    initialize,
    login,
    register,
    authenticateWithGoogle,
    refreshUser,
    logout,
    clearSession,
  }
})
