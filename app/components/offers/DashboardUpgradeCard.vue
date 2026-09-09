<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

/** Carte d'appel à l'offre Premium, partagée par les sidebars des dashboards
 * (compte, chaîne, propriétés d'un contenu) — masquée pour un compte déjà Premium. */
const emit = defineEmits<{ navigate: [] }>()

const authStore = useAuthStore()
</script>

<template>
  <div v-if="!authStore.isPremium" class="shrink-0 px-3.5 pb-4 pt-2">
    <div class="rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] p-4 text-white">
      <div class="text-[13px] font-extrabold leading-tight">Passez à Statsio Pro</div>
      <div class="mt-1.5 text-[11.5px] leading-relaxed text-white/80">
        Audience illimitée, revenus et export des données brutes.
      </div>
      <NuxtLink
        to="/offres"
        class="mt-3 block rounded-full bg-white px-3.5 py-2 text-center text-[11px] font-extrabold uppercase tracking-[0.06em] text-primary"
        @click="emit('navigate')"
      >
        En savoir plus
      </NuxtLink>
    </div>
  </div>
</template>
