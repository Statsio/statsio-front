<script setup lang="ts">
import { computed } from 'vue'
import DsButton from '@/components/ds/DsButton.vue'
import ListingPublishBand from '@/components/listing/tranches/ListingPublishBand.vue'
import { useAuthStore } from '@/stores/auth'

/** Bande « Consulter » du listing des sondages : CTA vers le Studio, ou l'inscription si déconnecté. */
const auth = useAuthStore()
const ctaTo = computed(() => (auth.isAuthenticated ? '/studio' : '/register'))
</script>

<template>
  <ListingPublishBand>
    <template #label>Consulter · <b>gratuit</b></template>
    <template #title>Consultez votre audience, à votre échelle.</template>
    Un vote express, un questionnaire à plusieurs volets ou une pétition avec un objectif de
    signatures. Les réponses s'exportent en CSV, et vous pouvez exiger une identité vérifiée.
    <template #actions>
      <DsButton :to="ctaTo">Créer une consultation <span aria-hidden="true">→</span></DsButton>
      <DsButton to="/about" variant="secondary">Bonnes pratiques</DsButton>
    </template>
  </ListingPublishBand>
</template>
