<script setup lang="ts">
import { computed } from 'vue'
import DsButton from '@/components/ds/DsButton.vue'
import ListingPublishBand from '@/components/listing/tranches/ListingPublishBand.vue'
import { useAuthStore } from '@/stores/auth'

/** Bande « Publier » du listing des dossiers : CTA vers le Studio, ou l'inscription si déconnecté. */
const auth = useAuthStore()
const ctaTo = computed(() => (auth.isAuthenticated ? '/studio' : '/register'))
</script>

<template>
  <ListingPublishBand>
    <template #label>Publier · <b>Studio</b></template>
    <template #title>Rangez vos contenus dans un dossier.</template>
    Au moment de publier un StatsData, un article ou un sondage, choisissez un ou plusieurs
    dossiers : le Studio suggère ceux qui correspondent à votre titre. Votre contenu apparaît
    aussitôt ici.
    <template #actions>
      <DsButton :to="ctaTo">Ouvrir le Studio <span aria-hidden="true">→</span></DsButton>
      <DsButton to="/contact" variant="secondary">Proposer un dossier</DsButton>
    </template>
  </ListingPublishBand>
</template>
