<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Médicaments — MédiStats',
  description:
    'Consultez la composition, les présentations, le prix et les conditions de prescription des médicaments référencés dans la base publique des médicaments (BDPM).',
})
import MedicamentsExplorer from '@/components/medicaments/MedicamentsExplorer.vue'
</script>

<template>
  <MedicamentsExplorer />
</template>
