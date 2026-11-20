<script setup lang="ts">
import { computed } from 'vue'
import DsButton from '@/components/ds/DsButton.vue'
import ListingPublishBand from '@/components/listing/tranches/ListingPublishBand.vue'
import { useAuthStore } from '@/stores/auth'

/** Bande « Écrire » du listing des articles (un article = une tranche prise dans un StatsData) : CTA vers le Studio, ou l'inscription si déconnecté. */
const auth = useAuthStore()
const ctaTo = computed(() => (auth.isAuthenticated ? '/studio' : '/register'))
</script>

<template>
  <ListingPublishBand>
    <template #label>Écrire · <b>gratuit</b></template>
    <template #title>Un StatsData vous parle ? Racontez-le.</template>
    Dans le Studio, un article reprend les blocs d'un StatsData publié : graphiques, tableaux et
    chiffres restent à jour quand la source se synchronise.
    <template #actions>
      <DsButton :to="ctaTo">Écrire un article <span aria-hidden="true">→</span></DsButton>
    </template>
  </ListingPublishBand>
</template>
