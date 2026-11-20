<script setup lang="ts">
import { computed } from 'vue'
import DsButton from '@/components/ds/DsButton.vue'
import ListingPublishBand from '@/components/listing/tranches/ListingPublishBand.vue'
import { useAuthStore } from '@/stores/auth'

/** Bande « Publier » du listing StatsData : CTA vers le Studio, ou l'inscription si déconnecté. */
const auth = useAuthStore()
const ctaTo = computed(() => (auth.isAuthenticated ? '/studio' : '/register'))
</script>

<template>
  <ListingPublishBand>
    <template #label>Publier · <b>gratuit</b></template>
    <template #title>Publiez votre propre StatsData.</template>
    Dans le Studio, branchez un jeu de data.gouv.fr ou une API, construisez vos graphiques et
    choisissez la fréquence de synchronisation. La page reste à jour toute seule.
    <template #actions>
      <DsButton :to="ctaTo">Créer un StatsData <span aria-hidden="true">→</span></DsButton>
      <DsButton to="/about" variant="secondary">Guide des données</DsButton>
    </template>
  </ListingPublishBand>
</template>
