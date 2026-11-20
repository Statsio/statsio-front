<script setup lang="ts">
import { computed, ref } from 'vue'
import { getErrorMessage, getValidationErrors } from '@/lib/http-errors'
import { computePasswordStrength } from '@/lib/password-strength'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const token = computed(() => (route.query.token as string) ?? '')
const email = computed(() => (route.query.email as string) ?? '')
const hasValidLink = computed(() => token.value.length > 0 && email.value.length > 0)

const password = ref('')
const passwordConfirmation = ref('')
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const submitError = ref('')
const linkInvalid = ref(false)
const fieldErrors = ref<Record<string, string>>({})

const passwordStrength = computed(() => computePasswordStrength(password.value))

const isFormValid = computed(
  () => password.value.trim().length >= 8 && password.value === passwordConfirmation.value,
)

const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  submitError.value = ''
  fieldErrors.value = {}
  isSubmitting.value = true

  try {
    await authStore.resetPassword({
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    isSubmitted.value = true
  } catch (error) {
    fieldErrors.value = getValidationErrors(error)

    if (Object.keys(fieldErrors.value).length > 0) {
      isSubmitting.value = false
      return
    }

    linkInvalid.value = true
    submitError.value = getErrorMessage(error, "Ce lien de réinitialisation n'est plus valide.")
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthCard>
    <!-- Lien manquant ou invalide -->
    <div v-if="!hasValidLink || linkInvalid" class="flex flex-col items-center gap-6 text-center">
      <div class="ds-auth-icon ds-auth-icon--danger !mb-0" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      </div>
      <AuthCardHeader
        center
        eyebrow="Réinitialisation"
        :title="[{ text: 'Lien ' }, { text: 'non valide', em: true }]"
        :description="submitError || 'Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.'"
      />
      <DsButton block to="/forgot-password">Demander un nouveau lien</DsButton>
    </div>

    <!-- Succès -->
    <div v-else-if="isSubmitted" class="flex flex-col items-center gap-6 text-center">
      <div class="ds-auth-icon !mb-0" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <AuthCardHeader
        center
        eyebrow="C'est fait"
        :title="[{ text: 'Mot de passe ' }, { text: 'mis à jour', em: true }]"
        description="Vous pouvez désormais vous connecter avec vos nouveaux identifiants."
      />
      <DsButton block to="/login">Aller à la connexion <span aria-hidden="true">→</span></DsButton>
    </div>

    <!-- Formulaire -->
    <div v-else class="flex flex-col gap-6">
      <AuthCardHeader
        eyebrow="Réinitialisation"
        :title="[{ text: 'Nouveau ' }, { text: 'mot de passe', em: true }]"
      >
        Choisissez un nouveau mot de passe pour <strong>{{ email }}</strong>.
      </AuthCardHeader>

      <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-2.5">
          <AuthInputField
            v-model="password"
            label="Nouveau mot de passe"
            type="password"
            autocomplete="new-password"
            placeholder="8 caractères minimum"
            :error="fieldErrors.password"
            :disabled="isSubmitting"
          />
          <PasswordStrengthMeter :strength="passwordStrength" :has-password="password.length > 0" />
        </div>

        <AuthInputField
          v-model="passwordConfirmation"
          label="Confirmer le mot de passe"
          type="password"
          autocomplete="new-password"
          placeholder="8 caractères minimum"
          :error="passwordConfirmation && passwordConfirmation !== password ? 'Les deux mots de passe ne correspondent pas.' : undefined"
          :disabled="isSubmitting"
        />

        <DsButton type="submit" block :disabled="!isFormValid || isSubmitting">
          <template v-if="isSubmitting"><AuthSpinner /> Mise à jour…</template>
          <template v-else>Réinitialiser le mot de passe</template>
        </DsButton>
      </form>
    </div>
  </AuthCard>
</template>
