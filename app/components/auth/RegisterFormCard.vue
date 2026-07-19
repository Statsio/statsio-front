<script setup lang="ts">
import { computed, ref } from 'vue'
import { getErrorMessage, getValidationErrors } from '@/lib/http-errors'
import { computePasswordStrength } from '@/lib/password-strength'
import { useAuthStore } from '@/stores/auth'

const firstName = ref('')
const lastName = ref('')
const birthday = ref('')
const email = ref('')
const password = ref('')
const acceptTerms = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string>>({})

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
    acceptTerms.value,
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
    })

    await router.push({ path: '/verify-email', query: { email: result.email } })
  } catch (error) {
    fieldErrors.value = getValidationErrors(error)

    if (Object.keys(fieldErrors.value).length > 0) {
      return
    }

    submitError.value = getErrorMessage(error, "Inscription impossible pour le moment. Réessayez dans un instant.")
  }
}
</script>

<template>
  <AuthCard>
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="mb-1.5 text-2xl font-bold text-slate-950">Créer un compte</h1>
        <p class="text-sm text-slate-950/55">Rejoignez Statsio pour explorer et partager des données.</p>
      </div>

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

        <AuthInputField
          v-model="birthday"
          label="Date de naissance"
          type="date"
          autocomplete="bday"
          :error="fieldErrors.birthday"
          :disabled="authStore.isAuthenticating"
        />

        <AuthInputField
          v-model="email"
          label="Adresse e-mail"
          type="email"
          autocomplete="email"
          placeholder="vous@statsio.fr"
          :error="fieldErrors.email"
          :disabled="authStore.isAuthenticating"
        />

        <div>
          <AuthInputField
            v-model="password"
            label="Mot de passe"
            type="password"
            autocomplete="new-password"
            placeholder="8 caractères minimum"
            :error="fieldErrors.password"
            :disabled="authStore.isAuthenticating"
          />
          <PasswordStrengthMeter class="mt-2" :strength="passwordStrength" :has-password="password.length > 0" />
        </div>

        <AppCheckbox v-model="acceptTerms" class="mt-0.5">
          <span class="text-sm leading-[1.4] text-slate-700">
            J'accepte les <a href="#" class="font-semibold text-[var(--color-primary)]">conditions d'utilisation</a>
            et la <a href="#" class="font-semibold text-[var(--color-primary)]">politique de confidentialité</a>
          </span>
        </AppCheckbox>

        <AppButton
          :disabled="!isFormValid || authStore.isAuthenticating"
          full-width
          size="lg"
          variant="gradient"
          type="submit"
          class="mt-1.5"
        >
          {{ authStore.isAuthenticating ? 'Création...' : 'Créer mon compte' }}
        </AppButton>
      </form>

      <AuthDivider />

      <AuthGoogleButton context="signup" @success="handleGoogleSuccess" @error="submitError = $event" />

      <p class="text-center text-sm text-slate-950/55">
        Déjà un compte ?
        <NuxtLink to="/login" class="font-bold text-[var(--color-primary)] transition hover:brightness-90">
          Se connecter
        </NuxtLink>
      </p>
    </div>
  </AuthCard>
</template>
