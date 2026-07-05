<script setup lang="ts">
import studioLogo from '@/assets/brand/statsio-studio.svg'

defineProps<{
  contentTypeLabel: string
  studioPath: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-6 py-6 text-center">
    <!-- Icon -->
    <div class="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
      <svg class="h-10 w-10 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>

    <!-- Title -->
    <div class="space-y-2">
      <h3 class="text-xl font-bold text-slate-900">
        Votre {{ contentTypeLabel }} est prêt !
      </h3>
      <p class="max-w-sm text-sm leading-relaxed text-slate-500">
        Il est maintenant enregistré. Ouvrez le studio pour ajouter vos blocs, graphiques et données.
      </p>
    </div>

    <!-- Actions -->
    <div class="flex flex-col items-center gap-3 pt-2">
      <NuxtLink
        :to="studioPath"
        class="inline-flex items-center gap-2.5 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] transition hover:-translate-y-0.5 hover:brightness-105"
        @click="emit('close')"
      >
        <img :src="studioLogo" alt="" class="h-4 w-4 rounded-md" />
        Modifier avec le studio
      </NuxtLink>

      <button
        type="button"
        class="text-sm font-medium text-slate-500 transition hover:text-slate-700"
        @click="emit('close')"
      >
        Fermer
      </button>
    </div>
  </div>
</template>
