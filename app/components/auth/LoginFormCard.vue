<script setup lang="ts">
import { computed, ref } from 'vue'
import { getErrorMessage, getValidationErrors, isUnauthorizedError } from '@/lib/http-errors'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import { useAuthStore } from '@/stores/auth'
import AppTurnstile from '@/components/ui/AppTurnstile.vue'

const email = ref('')
const password = ref('')
const keepSignedIn = ref(true)
const submitError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const turnstileToken = ref('')
const turnstileRef = ref<InstanceType<typeof AppTurnstile> | null>(null)

const router = useRouter()
const authStore = useAuthStore()

const isFormValid = computed(
  () =>
    email.value.trim().length > 0 &&
    password.value.trim().length > 0 &&
    (turnstileToken.value.length > 0 || import.meta.dev),
)

function normalizeRedirectTarget(raw: unknown): string | null {
  const target = typeof raw === 'string' ? raw : ''
  if (!target || !target.startsWith('/') || target.startsWith('//')) return null
  return target
}

const redirectTarget = computed(() => {
  try {
    const fromSession = normalizeRedirectTarget(window.sessionStorage.getItem(AUTH_REDIRECT_KEY))
    if (fromSession) return fromSession
  } catch {}
  try {
    return normalizeRedirectTarget(window.localStorage.getItem(AUTH_REDIRECT_KEY))
  } catch {}
  return null
})

const clearStoredRedirect = () => {
  try { window.sessionStorage.removeItem(AUTH_REDIRECT_KEY) } catch {}
  try { window.localStorage.removeItem(AUTH_REDIRECT_KEY) } catch {}
}

const handleGoogleSuccess = async () => {
  submitError.value = ''
  const to = redirectTarget.value
  if (to) { clearStoredRedirect(); await router.replace(to) }
  else await router.push('/')
}

const handleSubmit = async () => {
  if (!isFormValid.value) return
  submitError.value = ''
  fieldErrors.value = {}

  try {
    await authStore.login(
      { email: email.value.trim(), password: password.value, turnstile_token: turnstileToken.value },
      keepSignedIn.value ? 'local' : 'session',
    )
    const to = redirectTarget.value
    if (to) { clearStoredRedirect(); await router.replace(to) }
    else await router.push('/')
  } catch (error) {
    fieldErrors.value = getValidationErrors(error)
    turnstileToken.value = ''
    turnstileRef.value?.reset()
    if (Object.keys(fieldErrors.value).length > 0) return
    submitError.value = isUnauthorizedError(error)
      ? 'Adresse e-mail ou mot de passe incorrect.'
      : getErrorMessage(error, 'Connexion impossible pour le moment. Réessayez dans un instant.')
  }
}
</script>

<template>
  <AuthCard>
    <div class="flex flex-col gap-7">
      <!-- Header -->
      <div>
        <h1 class="mb-1.5 text-2xl font-bold text-slate-950">Connexion</h1>
        <p class="text-sm text-slate-950/55">Content de vous revoir sur Statsio.</p>
      </div>

      <AuthErrorAlert :message="submitError" />

      <!-- Form -->
      <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
        <AuthInputField
          v-model="email"
          label="Adresse e-mail"
          type="email"
          placeholder="vous@statsio.fr"
          autocomplete="email"
          :error="fieldErrors.email"
          :disabled="authStore.isAuthenticating"
        />

        <AuthInputField
          v-model="password"
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          :error="fieldErrors.password"
          :disabled="authStore.isAuthenticating"
        >
          <template #label-action>
            <NuxtLink
              to="/forgot-password"
              class="text-xs font-semibold text-[var(--color-primary)] transition hover:brightness-90"
            >
              Mot de passe oublié ?
            </NuxtLink>
          </template>
        </AuthInputField>

        <AppCheckbox v-model="keepSignedIn" label="Se souvenir de moi" class="mt-0.5" />

        <AppTurnstile
          ref="turnstileRef"
          action="login"
          @verified="(token) => { turnstileToken = token; submitError = '' }"
          @expired="turnstileToken = ''"
          @error="() => { turnstileToken = ''; submitError = 'Impossible de charger la vérification de sécurité. Vérifiez votre connexion réseau.' }"
        />

        <AppButton
          :disabled="!isFormValid || authStore.isAuthenticating"
          full-width
          size="lg"
          variant="gradient"
          type="submit"
          class="mt-1.5"
        >
          <template v-if="authStore.isAuthenticating">
            <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connexion en cours…
          </template>
          <template v-else>Se connecter</template>
        </AppButton>
      </form>

      <AuthDivider />

      <AuthGoogleButton
        context="signin"
        :persist-mode="keepSignedIn ? 'local' : 'session'"
        @success="handleGoogleSuccess"
        @error="submitError = $event"
      />

      <p class="text-center text-sm text-slate-950/55">
        Pas encore de compte ?
        <NuxtLink to="/register" class="font-bold text-[var(--color-primary)] transition hover:brightness-90">
          S'inscrire
        </NuxtLink>
      </p>
    </div>
  </AuthCard>
</template>
