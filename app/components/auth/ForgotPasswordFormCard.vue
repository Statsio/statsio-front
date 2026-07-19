<script setup lang="ts">
import { computed, ref } from 'vue'
import { getErrorMessage } from '@/lib/http-errors'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const isSubmitted = ref(false)
const isSubmitting = ref(false)
const isResending = ref(false)
const submitError = ref('')

const authStore = useAuthStore()

const isFormValid = computed(() => email.value.trim().length > 0)

const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  submitError.value = ''
  isSubmitting.value = true

  try {
    await authStore.forgotPassword(email.value.trim())
    isSubmitted.value = true
  } catch (error) {
    submitError.value = getErrorMessage(error, 'Impossible d\'envoyer le lien pour le moment. Réessayez dans un instant.')
  } finally {
    isSubmitting.value = false
  }
}

const handleResend = async () => {
  if (isResending.value) return

  isResending.value = true

  try {
    await authStore.forgotPassword(email.value.trim())
  } catch {
    // Silently ignore — the "sent" state already reflects the expected outcome.
  } finally {
    isResending.value = false
  }
}

const goLogin = () => {
  isSubmitted.value = false
}
</script>

<template>
  <AuthCard>
    <!-- Sent state -->
    <div v-if="isSubmitted" class="flex flex-col items-center text-center">
      <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
          <path d="M4 6 L12 13 L20 6" stroke="var(--color-primary)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="var(--color-primary)" stroke-width="2" fill="none" />
        </svg>
      </div>
      <h1 class="mb-2 text-[21px] font-bold text-slate-950">Vérifiez vos e-mails</h1>
      <p class="mb-7 text-sm leading-relaxed text-slate-950/55">
        Un lien de réinitialisation a été envoyé à<br />
        <strong class="text-slate-950">{{ email }}</strong>
      </p>
      <AppButton full-width size="lg" variant="gradient" @click="goLogin">Retour à la connexion</AppButton>
      <p class="mt-4.5 text-[13px] text-slate-950/50">
        Rien reçu ?
        <button
          type="button"
          :disabled="isResending"
          class="font-bold text-[var(--color-primary)] transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleResend"
        >
          {{ isResending ? 'Envoi...' : "Renvoyer l'e-mail" }}
        </button>
      </p>
    </div>

    <!-- Request form -->
    <div v-else class="flex flex-col gap-6">
      <NuxtLink to="/login" class="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-slate-950/50 transition hover:text-[var(--color-primary)]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Retour
      </NuxtLink>

      <div>
        <h1 class="mb-1.5 text-2xl font-bold text-slate-950">Mot de passe oublié</h1>
        <p class="text-sm leading-relaxed text-slate-950/55">
          Indiquez votre adresse e-mail, nous vous enverrons un lien pour le réinitialiser.
        </p>
      </div>

      <AuthErrorAlert :message="submitError" />

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AuthInputField
          v-model="email"
          label="Adresse e-mail"
          type="email"
          autocomplete="email"
          placeholder="vous@statsio.fr"
          :disabled="isSubmitting"
        />

        <AppButton :disabled="!isFormValid || isSubmitting" full-width size="lg" variant="gradient" type="submit">
          {{ isSubmitting ? 'Envoi...' : 'Envoyer le lien' }}
        </AppButton>
      </form>
    </div>
  </AuthCard>
</template>
