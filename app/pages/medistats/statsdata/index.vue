<script setup lang="ts">
import { getBrandConfig } from '@/data/brands'

definePageMeta({
  layout: 'default',
  title: 'StatsData santé',
  description: 'Explorez les datasets MEDISTATS : indicateurs santé, maladies, médicaments et soins.',
})

const categories = getBrandConfig('medistats').contentCategories
</script>

<template>
  <StatsDataListingView :categories="categories" />
</template>
