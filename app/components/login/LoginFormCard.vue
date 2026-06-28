<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AuthGoogleButton from '@/components/auth/AuthGoogleButton.vue'
import AuthInputField from '@/components/login/AuthInputField.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getErrorMessage, getValidationErrors, isUnauthorizedError } from '@/lib/http-errors'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const keepSignedIn = ref(true)
const submitError = ref('')
const fieldErrors = ref<Record<string, string>>({})

const router = useRouter()
const authStore = useAuthStore()

const isFormValid = computed(() => email.value.trim().length > 0 && password.value.trim().length > 0)

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
      { email: email.value.trim(), password: password.value },
      keepSignedIn.value ? 'local' : 'session',
    )
    const to = redirectTarget.value
    if (to) { clearStoredRedirect(); await router.replace(to) }
    else await router.push('/')
  } catch (error) {
    fieldErrors.value = getValidationErrors(error)
    if (Object.keys(fieldErrors.value).length > 0) return
    submitError.value = isUnauthorizedError(error)
      ? 'Adresse e-mail ou mot de passe incorrect.'
      : getErrorMessage(error, 'Connexion impossible pour le moment. Réessayez dans un instant.')
  }
}
</script>

<template>
  <div class="panel rounded-[2rem] p-2 shadow-[0_32px_80px_-36px_rgba(15,23,42,0.7)]">
    <div class="flex flex-col gap-7 rounded-[1.5rem] bg-white px-6 py-7 sm:px-8 sm:py-8">

      <!-- Header -->
      <div class="flex flex-col gap-2">
        <span class="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
          <span class="h-1.5 w-1.5 rounded-full bg-primary" />
          Connexion
        </span>
        <h2 class="text-2xl font-semibold leading-tight text-slate-950 sm:text-[1.75rem]">
          Heureux de vous revoir.
        </h2>
        <p class="text-sm leading-relaxed text-slate-500">
          Accédez à votre espace, vos contenus et services Statsio.
        </p>
      </div>

      <!-- Error alert -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1 scale-[0.99]"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="submitError"
          class="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>{{ submitError }}</span>
        </div>
      </Transition>

      <!-- Form -->
      <form class="flex flex-col gap-5" novalidate @submit.prevent="handleSubmit">
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
            <RouterLink
              to="/forgot-password"
              class="text-xs font-semibold text-slate-400 transition hover:text-primary"
            >
              Mot de passe oublié ?
            </RouterLink>
          </template>
        </AuthInputField>

        <!-- Keep signed in -->
        <label class="group flex cursor-pointer items-center gap-3">
          <button
            type="button"
            role="checkbox"
            :aria-checked="keepSignedIn"
            class="relative h-5 w-5 shrink-0 rounded-md border-2 transition duration-150"
            :class="keepSignedIn
              ? 'border-primary bg-primary'
              : 'border-slate-300 bg-white group-hover:border-slate-400'"
            @click="keepSignedIn = !keepSignedIn"
          >
            <Transition
              enter-active-class="transition duration-150"
              enter-from-class="opacity-0 scale-50"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-100"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-50"
            >
              <svg
                v-if="keepSignedIn"
                xmlns="http://www.w3.org/2000/svg"
                class="absolute inset-0 m-auto h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </Transition>
          </button>
          <span class="select-none text-sm text-slate-600 group-hover:text-slate-800 transition">
            Garder ma session active
          </span>
        </label>

        <AppButton
          :disabled="!isFormValid || authStore.isAuthenticating"
          full-width
          size="lg"
          variant="primary"
          type="submit"
          class="mt-1"
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

      <!-- Divider -->
      <div class="flex items-center gap-3">
        <div class="h-px flex-1 bg-slate-100" />
        <span class="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">ou</span>
        <div class="h-px flex-1 bg-slate-100" />
      </div>

      <!-- Google -->
      <AuthGoogleButton
        context="signin"
        :persist-mode="keepSignedIn ? 'local' : 'session'"
        @success="handleGoogleSuccess"
        @error="submitError = $event"
      />

      <!-- Register -->
      <p class="text-center text-sm text-slate-400">
        Pas encore de compte ?
        <RouterLink to="/register" class="font-semibold text-primary transition hover:text-accent">
          Créer un compte
        </RouterLink>
      </p>

    </div>
  </div>
</template>
