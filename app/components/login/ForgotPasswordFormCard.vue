<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'

const email = ref('')
const isSubmitted = ref(false)

const isFormValid = computed(() => email.value.trim().length > 0)

const handleSubmit = () => {
  if (!isFormValid.value) {
    return
  }

  isSubmitted.value = true
}
</script>

<template>
  <div class="panel rounded-[2rem] p-2 text-slate-950 shadow-[0_32px_80px_-36px_rgba(15,23,42,0.75)]">
    <div class="flex flex-col gap-6 rounded-[1.5rem] bg-white p-5 sm:p-8">
      <div class="flex flex-col gap-2">
        <p class="text-xs font-semibold uppercase tracking-[0.32em] text-primary">Récupération</p>
        <h2 class="text-2xl font-semibold text-slate-950 sm:text-3xl">Mot de passe oublié ?</h2>
        <p class="text-sm leading-6 text-slate-500">
          Indiquez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <form v-if="!isSubmitted" class="flex flex-col gap-5" @submit.prevent="handleSubmit">
        <label class="flex flex-col gap-2">
          <span class="text-sm font-semibold text-slate-700">Adresse e-mail</span>
          <input v-model="email" type="email" autocomplete="email" placeholder="vous@statsio.fr"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
        </label>

        <AppButton :disabled="!isFormValid" full-width size="lg" variant="primary" type="submit">
          Envoyer le lien
        </AppButton>
      </form>

      <div v-else class="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
        <p class="text-sm font-semibold text-emerald-800">Lien envoyé</p>
        <p class="mt-2 text-sm leading-6 text-emerald-700">
          Si un compte existe pour <span class="font-semibold">{{ email }}</span>, vous recevrez les instructions
          de réinitialisation dans quelques instants.
        </p>
      </div>

      <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <p class="text-sm font-semibold text-slate-800">Besoin d'aide ?</p>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          Vérifiez votre dossier spam ou revenez à la page de connexion pour essayer à nouveau.
        </p>
      </div>

      <div>
        <AppButton as="router-link" to="/login" full-width size="lg" variant="secondary">
          Retour à la connexion
        </AppButton>
      </div>

      <p class="text-center text-sm text-slate-500">
        Vous n'avez plus accès à cette adresse ?
        <RouterLink to="/" class="font-semibold text-primary transition hover:text-accent">
          Contacter le support
        </RouterLink>
      </p>
    </div>
  </div>
</template>
