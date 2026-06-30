<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AuthGoogleButton from '@/components/auth/AuthGoogleButton.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getErrorMessage, getValidationErrors } from '@/lib/http-errors'
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
  <div class="panel rounded-[2rem] p-2 text-slate-950 shadow-[0_32px_80px_-36px_rgba(15,23,42,0.75)]">
    <div class="flex flex-col gap-6 rounded-[1.5rem] bg-white p-5 sm:p-8">
      <div class="flex flex-col gap-2">
        <p class="text-xs font-semibold uppercase tracking-[0.32em] text-primary">Inscription</p>
        <h2 class="text-2xl font-semibold text-slate-950 sm:text-3xl">Créez votre compte.</h2>
        <p class="text-sm leading-6 text-slate-500">
          Rejoignez Statsio pour accéder à vos contenus, abonnements et services depuis un espace unique.
        </p>
      </div>

      <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
        <div v-if="submitError" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ submitError }}
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <label class="flex flex-col gap-2">
            <span class="text-sm font-semibold text-slate-700">Prénom</span>
            <input v-model="firstName" type="text" autocomplete="given-name" placeholder="Camille"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
            <span v-if="fieldErrors.first_name" class="text-sm text-rose-600">{{ fieldErrors.first_name }}</span>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-sm font-semibold text-slate-700">Nom</span>
            <input v-model="lastName" type="text" autocomplete="family-name" placeholder="Martin"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
            <span v-if="fieldErrors.last_name" class="text-sm text-rose-600">{{ fieldErrors.last_name }}</span>
          </label>
        </div>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Date de naissance</span>
          <input v-model="birthday" type="date" autocomplete="bday"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
          <span v-if="fieldErrors.birthday" class="text-sm text-rose-600">{{ fieldErrors.birthday }}</span>
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Adresse e-mail</span>
          <input v-model="email" type="email" autocomplete="email" placeholder="vous@statsio.fr"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
          <span v-if="fieldErrors.email" class="text-sm text-rose-600">{{ fieldErrors.email }}</span>
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Mot de passe</span>
          <input v-model="password" type="password" autocomplete="new-password" placeholder="8 caractères minimum"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
          <span v-if="fieldErrors.password" class="text-sm text-rose-600">{{ fieldErrors.password }}</span>
        </label>

        <label class="inline-flex items-start gap-3 text-sm text-slate-600">
          <input v-model="acceptTerms" type="checkbox"
            class="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20" />
          <span>
            J'accepte les conditions d'utilisation et la politique de confidentialité.
          </span>
        </label>

        <AppButton :disabled="!isFormValid || authStore.isAuthenticating" full-width size="lg" variant="primary"
          type="submit">
          {{ authStore.isAuthenticating ? 'Création...' : 'Créer mon compte' }}
        </AppButton>
      </form>

      <div class="flex items-center gap-4">
        <div class="h-px flex-1 bg-slate-200" />
        <span class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">ou</span>
        <div class="h-px flex-1 bg-slate-200" />
      </div>

      <div class="grid gap-3">
        <AuthGoogleButton context="signup" @success="handleGoogleSuccess" @error="submitError = $event" />
      </div>

      <p class="text-center text-sm text-slate-500">
        Vous avez déjà un compte ?
        <RouterLink to="/login" class="font-semibold text-primary transition hover:text-accent">
          Se connecter
        </RouterLink>
      </p>
    </div>
  </div>
</template>
