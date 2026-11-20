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
    <!-- E-mail envoyé -->
    <div v-if="isSubmitted" class="flex flex-col items-center gap-6 text-center">
      <div class="ds-auth-icon !mb-0" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 6l8 7 8-7" />
        </svg>
      </div>
      <AuthCardHeader center eyebrow="Lien envoyé" :title="[{ text: 'Vérifiez vos ' }, { text: 'e-mails', em: true }]">
        Un lien de réinitialisation a été envoyé à <strong>{{ email }}</strong>.
      </AuthCardHeader>
      <DsButton block @click="goLogin">Retour au formulaire</DsButton>
      <p class="ds-auth-foot w-full">
        Rien reçu ?
        <button type="button" class="ds-auth-link" :disabled="isResending" @click="handleResend">
          {{ isResending ? 'Envoi…' : "Renvoyer l'e-mail" }}
        </button>
      </p>
    </div>

    <!-- Demande -->
    <div v-else class="flex flex-col gap-6">
      <NuxtLink to="/login" class="ds-auth-link w-fit text-[14px]"><span aria-hidden="true">←</span> Retour à la connexion</NuxtLink>

      <AuthCardHeader
        eyebrow="Mot de passe oublié"
        :title="[{ text: 'Recevez un ' }, { text: 'nouveau lien', em: true }]"
        description="Indiquez votre adresse e-mail, nous vous enverrons un lien pour réinitialiser votre mot de passe."
      />

      <AuthErrorAlert :message="submitError" />

      <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
        <AuthInputField
          v-model="email"
          label="Adresse e-mail"
          type="email"
          autocomplete="email"
          placeholder="vous@statsio.fr"
          :disabled="isSubmitting"
        />
        <DsButton type="submit" block :disabled="!isFormValid || isSubmitting">
          <template v-if="isSubmitting"><AuthSpinner /> Envoi…</template>
          <template v-else>Envoyer le lien <span aria-hidden="true">→</span></template>
        </DsButton>
      </form>
    </div>
  </AuthCard>
</template>
