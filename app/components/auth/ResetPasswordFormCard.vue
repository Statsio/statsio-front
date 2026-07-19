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
    <!-- Missing/invalid link, detected up front -->
    <div v-if="!hasValidLink || linkInvalid" class="flex flex-col items-center text-center">
      <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 class="mb-2 text-[21px] font-bold text-slate-950">Lien non valide</h1>
      <p class="mb-7 text-sm leading-relaxed text-slate-950/55">
        {{ submitError || "Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau." }}
      </p>
      <AppButton as="router-link" to="/forgot-password" full-width size="lg" variant="gradient">
        Demander un nouveau lien
      </AppButton>
    </div>

    <!-- Success -->
    <div v-else-if="isSubmitted" class="flex flex-col items-center text-center">
      <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75l2.25 2.25 4.5-4.5m5.25 2.25a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="mb-2 text-[21px] font-bold text-slate-950">Mot de passe mis à jour</h1>
      <p class="mb-7 text-sm leading-relaxed text-slate-950/55">
        Votre mot de passe a bien été modifié. Vous pouvez désormais vous connecter avec vos nouveaux identifiants.
      </p>
      <AppButton as="router-link" to="/login" full-width size="lg" variant="gradient">
        Aller à la connexion
      </AppButton>
    </div>

    <!-- Form -->
    <div v-else class="flex flex-col gap-6">
      <div>
        <h1 class="mb-1.5 text-2xl font-bold text-slate-950">Nouveau mot de passe</h1>
        <p class="text-sm leading-relaxed text-slate-950/55">Choisissez un nouveau mot de passe pour {{ email }}.</p>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div>
          <AuthInputField
            v-model="password"
            label="Nouveau mot de passe"
            type="password"
            autocomplete="new-password"
            placeholder="8 caractères minimum"
            :error="fieldErrors.password"
            :disabled="isSubmitting"
          />
          <PasswordStrengthMeter class="mt-2" :strength="passwordStrength" :has-password="password.length > 0" />
        </div>

        <AuthInputField
          v-model="passwordConfirmation"
          label="Confirmer le mot de passe"
          type="password"
          autocomplete="new-password"
          placeholder="8 caractères minimum"
          :disabled="isSubmitting"
        />

        <AppButton :disabled="!isFormValid || isSubmitting" full-width size="lg" variant="gradient" type="submit" class="mt-1.5">
          {{ isSubmitting ? 'Mise à jour...' : 'Réinitialiser le mot de passe' }}
        </AppButton>
      </form>
    </div>
  </AuthCard>
</template>
