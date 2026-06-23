<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AuthGoogleButton from '@/components/auth/AuthGoogleButton.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getErrorMessage, getValidationErrors, isUnauthorizedError } from '@/lib/http-errors'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const keepSignedIn = ref(true)
const submitError = ref('')
const fieldErrors = ref<Record<string, string>>({})

const router = useRouter()
const authStore = useAuthStore()

const isFormValid = computed(() => email.value.trim().length > 0 && password.value.trim().length > 0)

const REDIRECT_KEY = 'statsio.auth.redirectAfterLogin'

function normalizeRedirectTarget(raw: unknown): string | null {
  const target = typeof raw === 'string' ? raw : ''
  if (!target) return null
  // Prevent open redirects: only allow app-internal paths.
  if (!target.startsWith('/')) return null
  if (target.startsWith('//')) return null
  return target
}

const redirectTarget = computed(() => {
  try {
    const fromSession = normalizeRedirectTarget(window.sessionStorage.getItem(REDIRECT_KEY))
    if (fromSession) return fromSession
  } catch {
    // ignore
  }
  try {
    return normalizeRedirectTarget(window.localStorage.getItem(REDIRECT_KEY))
  } catch {
    return null
  }
})

const clearStoredRedirect = () => {
  try {
    window.sessionStorage.removeItem(REDIRECT_KEY)
  } catch {
    // ignore
  }
  try {
    window.localStorage.removeItem(REDIRECT_KEY)
  } catch {
    // ignore
  }
}

const handleGoogleSuccess = async () => {
  submitError.value = ''
  const to = redirectTarget.value
  if (to) {
    clearStoredRedirect()
    await router.replace(to)
  }
  else await router.push('/')
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    return
  }

  submitError.value = ''
  fieldErrors.value = {}

  try {
    await authStore.login(
      {
        email: email.value.trim(),
        password: password.value,
      },
      keepSignedIn.value ? 'local' : 'session',
    )

    const to = redirectTarget.value
    if (to) {
      clearStoredRedirect()
      await router.replace(to)
    }
    else await router.push('/')
  } catch (error) {
    fieldErrors.value = getValidationErrors(error)

    if (Object.keys(fieldErrors.value).length > 0) {
      return
    }

    submitError.value = isUnauthorizedError(error)
      ? 'Adresse e-mail ou mot de passe incorrect.'
      : getErrorMessage(error, 'Connexion impossible pour le moment. Réessayez dans un instant.')
  }
}
</script>

<template>
  <div class="panel rounded-[2rem] p-2 text-slate-950 shadow-[0_32px_80px_-36px_rgba(15,23,42,0.75)]">
    <div class="flex flex-col gap-6 rounded-[1.5rem] bg-white p-5 sm:p-8">
      <div class="flex flex-col gap-2">
        <p class="text-xs font-semibold uppercase tracking-[0.32em] text-primary">Connexion</p>
        <h2 class="text-2xl font-semibold text-slate-950 sm:text-3xl">Heureux de vous revoir.</h2>
        <p class="text-sm leading-6 text-slate-500">
          Renseignez vos identifiants pour accéder à votre compte et à vos services Statsio.
        </p>
      </div>

      <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
        <div v-if="submitError" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ submitError }}
        </div>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Adresse e-mail</span>
          <input v-model="email" type="email" autocomplete="email" placeholder="vous@statsio.fr"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
          <span v-if="fieldErrors.email" class="text-sm text-rose-600">{{ fieldErrors.email }}</span>
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Mot de passe</span>
          <input v-model="password" type="password" autocomplete="current-password" placeholder="••••••••"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
          <span v-if="fieldErrors.password" class="text-sm text-rose-600">{{ fieldErrors.password }}</span>
        </label>

        <div class="flex items-center">
          <label class="inline-flex items-start gap-3 text-slate-600">
            <input v-model="keepSignedIn" type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20" />
            Garder ma session active
          </label>
        </div>

        <div class="flex flex-col gap-3">
          <AppButton :disabled="!isFormValid || authStore.isAuthenticating" full-width size="lg" variant="primary"
            type="submit">
            {{ authStore.isAuthenticating ? 'Connexion...' : 'Se connecter' }}
          </AppButton>
          <RouterLink to="/forgot-password" class="text-sm font-semibold text-primary transition hover:text-accent">
            Mot de passe oublié ?
          </RouterLink>
        </div>
      </form>

      <div class="flex items-center gap-4">
        <div class="h-px flex-1 bg-slate-200" />
        <span class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">ou</span>
        <div class="h-px flex-1 bg-slate-200" />
      </div>

      <div class="grid gap-3">
        <AuthGoogleButton context="signin" :persist-mode="keepSignedIn ? 'local' : 'session'"
          @success="handleGoogleSuccess" @error="submitError = $event" />
      </div>

      <p class="text-center text-sm text-slate-500">
        Pas encore de compte ?
        <RouterLink to="/register" class="font-semibold text-primary transition hover:text-accent">
          Créer un compte
        </RouterLink>
      </p>
    </div>
  </div>
</template>
