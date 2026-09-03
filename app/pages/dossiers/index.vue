<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Dossiers',
  description:
    "Chaque dossier Statsio regroupe articles, statsdata et sondages publiés sur un même sujet, mis à jour au fil de l'actualité.",
})

import DossiersListingView from '@/components/dossiers/DossiersListingView.vue'
</script>

<template>
  <main>
    <DossiersListingView />
  </main>
</template>
