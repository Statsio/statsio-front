import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { clearStoredToken, getStoredToken, storeSession, storeUser } from '@/lib/auth-storage'
import { isUnauthorizedError } from '@/lib/http-errors'
import {
  googleAuthRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
  resendVerificationRequest,
  verifyEmailRequest,
} from '@/services/auth'
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  PersistMode,
  RegisterPayload,
  VerifyEmailPayload,
} from '@/types/auth'

const DEFAULT_PERSIST_MODE: PersistMode = 'local'
const isValidUser = (user: Partial<AuthUser> | null | undefined): user is AuthUser =>
  typeof user?.id === 'number' && typeof user.email === 'string' && user.email.trim().length > 0

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const tokenType = ref<string | null>(null)
  const expiresIn = ref<number | null>(null)
  const user = ref<AuthUser | null>(null)
  const persistMode = ref<PersistMode>(DEFAULT_PERSIST_MODE)
  const isBootstrapping = ref(false)
  const isAuthenticating = ref(false)
  const isLoggingOut = ref(false)

  const hasSession = computed(() => Boolean(token.value))
  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const isAdmin = computed(() => Boolean(user.value?.is_admin))
  const displayName = computed(() => {
    const firstName = user.value?.profile?.first_name?.trim()
    const lastName = user.value?.profile?.last_name?.trim()

    if (firstName || lastName) {
      return [firstName, lastName].filter(Boolean).join(' ')
    }

    return user.value?.email ?? 'Mon compte'
  })

  const applySession = (session: AuthSession, mode: PersistMode) => {
    token.value = session.token
    refreshToken.value = session.refreshToken ?? null
    tokenType.value = session.type
    expiresIn.value = session.expiresIn ?? null
    user.value = session.user
    persistMode.value = mode
    storeSession(session, mode)
  }

  const clearSession = () => {
    token.value = null
    refreshToken.value = null
    tokenType.value = null
    expiresIn.value = null
    user.value = null
    persistMode.value = DEFAULT_PERSIST_MODE
    clearStoredToken()
  }

  const hydrateFromStorage = () => {
    const stored = getStoredToken()

    if (!stored) {
      return
    }

    token.value = stored.token
    refreshToken.value = stored.refreshToken ?? null
    tokenType.value = stored.type
    expiresIn.value = stored.expiresIn ?? null
    user.value = stored.user
    persistMode.value = stored.mode
  }

  const initialize = async () => {
    if (!token.value || isBootstrapping.value) {
      return
    }

    isBootstrapping.value = true

    try {
      const refreshedUser = await meRequest()

      if (!isValidUser(refreshedUser)) {
        return
      }

      user.value = refreshedUser
      storeUser(refreshedUser, persistMode.value)
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSession()
        return
      }
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

  const register = async (payload: RegisterPayload) => {
    isAuthenticating.value = true

    try {
      return await registerRequest(payload)
    } finally {
      isAuthenticating.value = false
    }
  }

  const verifyEmail = async (payload: VerifyEmailPayload, mode: PersistMode = DEFAULT_PERSIST_MODE) => {
    isAuthenticating.value = true

    try {
      const session = await verifyEmailRequest(payload)
      applySession(session, mode)
      return session.user
    } finally {
      isAuthenticating.value = false
    }
  }

  const resendVerification = async (email: string) => {
    await resendVerificationRequest({ email })
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

    const refreshedUser = await meRequest()

    if (!isValidUser(refreshedUser)) {
      return user.value
    }

    user.value = refreshedUser
    storeUser(refreshedUser, persistMode.value)

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
    refreshToken,
    tokenType,
    expiresIn,
    user,
    persistMode,
    hasSession,
    isAuthenticated,
    isAdmin,
    displayName,
    isBootstrapping,
    isAuthenticating,
    isLoggingOut,
    initialize,
    login,
    register,
    verifyEmail,
    resendVerification,
    authenticateWithGoogle,
    refreshUser,
    logout,
    clearSession,
    hydrateFromStorage,
  }
})
