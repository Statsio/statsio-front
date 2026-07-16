<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'MédiStats — Santé publique en données',
  description: 'Analysez la santé publique en chiffres avec MédiStats : maladies, médicaments et offre de soins décryptés par la donnée.',
})
import MedistatsHome from '@/components/home/medistats/MedistatsHome.vue'
</script>

<template>
  <MedistatsHome />
</template>
