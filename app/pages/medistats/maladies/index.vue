<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Maladies — MédiStats',
  description:
    'Classifications, définitions et statistiques épidémiologiques mondiales (ICD-11 + WHO GHO), croisées par maladie et par pays.',
})
import MaladiesExplorer from '@/components/maladies/MaladiesExplorer.vue'
</script>

<template>
  <MaladiesExplorer />
</template>
