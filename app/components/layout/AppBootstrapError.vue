<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import type { AppBootstrapErrorState } from '@/lib/app-bootstrap'

defineProps<{
  error: AppBootstrapErrorState
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <main
    class="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16 sm:px-8"
  >
    <div
      class="panel relative z-10 w-full max-w-2xl rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10"
      role="alert"
      aria-live="assertive"
    >
      <span
        class="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-rose-700 uppercase"
      >
        Erreur de connexion
      </span>
      <h1 class="mt-5 text-3xl font-semibold text-slate-950 sm:text-4xl">
        {{ error.title }}
      </h1>
      <p class="mt-4 max-w-xl text-base leading-7 text-slate-600">
        {{ error.message }}
      </p>
      <p v-if="error.details" class="mono mt-4 text-sm text-slate-500">
        {{ error.details }}
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <AppButton @click="emit('retry')">Réessayer</AppButton>
        <AppButton as="a" href="/" variant="secondary">Retour à l’accueil</AppButton>
      </div>
    </div>
  </main>
</template>
