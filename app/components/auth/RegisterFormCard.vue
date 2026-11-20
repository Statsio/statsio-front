<script setup lang="ts">
import { computed, ref } from 'vue'
import { getErrorMessage, getValidationErrors } from '@/lib/http-errors'
import { computePasswordStrength } from '@/lib/password-strength'
import { useAuthStore } from '@/stores/auth'
import AppTurnstile from '@/components/ui/AppTurnstile.vue'

const firstName = ref('')
const lastName = ref('')
const birthday = ref('')
const email = ref('')
const password = ref('')
const acceptTerms = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const turnstileToken = ref('')
const turnstileRef = ref<InstanceType<typeof AppTurnstile> | null>(null)

const router = useRouter()
const authStore = useAuthStore()

const passwordStrength = computed(() => computePasswordStrength(password.value))

const isFormValid = computed(
  () =>
    firstName.value.trim().length > 0 &&
    lastName.value.trim().length > 0 &&
    birthday.value.trim().length > 0 &&
    email.value.trim().length > 0 &&
    password.value.trim().length >= 8 &&
    acceptTerms.value &&
    (turnstileToken.value.length > 0 || import.meta.dev),
)

const handleGoogleSuccess = async () => {
  submitError.value = ''
  await router.push('/')
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    return
  }

  submitError.value = ''
  fieldErrors.value = {}

  try {
    const result = await authStore.register({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      birthday: birthday.value,
      email: email.value.trim(),
      password: password.value,
      turnstile_token: turnstileToken.value,
    })

    await router.push({ path: '/verify-email', query: { email: result.email } })
  } catch (error) {
    fieldErrors.value = getValidationErrors(error)
    turnstileToken.value = ''
    turnstileRef.value?.reset()

    if (Object.keys(fieldErrors.value).length > 0) {
      return
    }

    submitError.value = getErrorMessage(error, "Inscription impossible pour le moment. Réessayez dans un instant.")
  }
}
</script>

<template>
  <AuthCard>
    <div class="flex flex-col gap-5">
      <AuthCardHeader
        eyebrow="Inscription · gratuite"
        :title="[{ text: 'Créez votre ' }, { text: 'compte', em: true }]"
        description="Suivez vos sujets, votez aux sondages et publiez vos propres analyses."
      >
        <template #aside><NuxtLink to="/login" class="ds-auth-link">Déjà un compte ? Se connecter</NuxtLink></template>
      </AuthCardHeader>

      <AuthErrorAlert :message="submitError" />

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div class="grid gap-4 sm:grid-cols-2">
          <AuthInputField
            v-model="firstName"
            label="Prénom"
            autocomplete="given-name"
            placeholder="Camille"
            :error="fieldErrors.first_name"
            :disabled="authStore.isAuthenticating"
          />
          <AuthInputField
            v-model="lastName"
            label="Nom"
            autocomplete="family-name"
            placeholder="Martin"
            :error="fieldErrors.last_name"
            :disabled="authStore.isAuthenticating"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <AuthInputField
            v-model="email"
            label="Adresse e-mail"
            type="email"
            autocomplete="email"
            placeholder="vous@statsio.fr"
            :error="fieldErrors.email"
            :disabled="authStore.isAuthenticating"
          />
          <AuthInputField
            v-model="birthday"
            label="Date de naissance"
            type="date"
            autocomplete="bday"
            :error="fieldErrors.birthday"
            :disabled="authStore.isAuthenticating"
          />
        </div>

        <div class="flex flex-col gap-2">
          <AuthInputField
            v-model="password"
            label="Mot de passe"
            type="password"
            autocomplete="new-password"
            placeholder="8 caractères minimum"
            :error="fieldErrors.password"
            :disabled="authStore.isAuthenticating"
          />
          <PasswordStrengthMeter :strength="passwordStrength" :has-password="password.length > 0" />
        </div>

        <AuthCheckbox v-model="acceptTerms">
          J'accepte les
          <NuxtLink to="/mentions-legales" target="_blank">mentions légales</NuxtLink>
          et la
          <NuxtLink to="/politique-de-confidentialite" target="_blank">politique de confidentialité</NuxtLink>
        </AuthCheckbox>

        <AppTurnstile
          ref="turnstileRef"
          action="register"
          appearance="interaction-only"
          @verified="(token) => { turnstileToken = token; submitError = '' }"
          @expired="turnstileToken = ''"
          @error="() => { turnstileToken = ''; submitError = 'Impossible de charger la vérification de sécurité. Vérifiez votre connexion réseau.' }"
        />

        <DsButton type="submit" block :disabled="!isFormValid || authStore.isAuthenticating">
          <template v-if="authStore.isAuthenticating"><AuthSpinner /> Création…</template>
          <template v-else>Créer mon compte <span aria-hidden="true">→</span></template>
        </DsButton>
      </form>

      <AuthDivider />

      <AuthGoogleButton context="signup" @success="handleGoogleSuccess" @error="submitError = $event" />

    </div>
  </AuthCard>
</template>
