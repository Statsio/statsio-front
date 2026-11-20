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
    <div class="flex flex-col gap-5">
      <AuthCardHeader
        eyebrow="Connexion"
        :title="[{ text: 'Content de vous ' }, { text: 'revoir', em: true }]"
        description="Retrouvez vos sujets suivis, vos favoris et votre Studio."
      >
        <template #aside><NuxtLink to="/register" class="ds-auth-link">Pas de compte ? Créer un compte</NuxtLink></template>
      </AuthCardHeader>

      <AuthErrorAlert :message="submitError" />

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
            <NuxtLink to="/forgot-password" class="ds-auth-link text-[13px]">Mot de passe oublié ?</NuxtLink>
          </template>
        </AuthInputField>

        <AuthCheckbox v-model="keepSignedIn" label="Se souvenir de moi" />

        <AppTurnstile
          ref="turnstileRef"
          action="login"
          appearance="interaction-only"
          @verified="(token) => { turnstileToken = token; submitError = '' }"
          @expired="turnstileToken = ''"
          @error="() => { turnstileToken = ''; submitError = 'Impossible de charger la vérification de sécurité. Vérifiez votre connexion réseau.' }"
        />

        <DsButton type="submit" block :disabled="!isFormValid || authStore.isAuthenticating">
          <template v-if="authStore.isAuthenticating">
            <AuthSpinner />
            Connexion en cours…
          </template>
          <template v-else>Se connecter <span aria-hidden="true">→</span></template>
        </DsButton>
      </form>

      <AuthDivider />

      <AuthGoogleButton
        context="signin"
        :persist-mode="keepSignedIn ? 'local' : 'session'"
        @success="handleGoogleSuccess"
        @error="submitError = $event"
      />

    </div>
  </AuthCard>
</template>
