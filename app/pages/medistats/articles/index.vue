<script setup lang="ts">
import { getBrandConfig } from '@/data/brands'

definePageMeta({
  layout: 'default',
  title: 'Articles santé',
  description: 'Décryptages et analyses MEDISTATS sur la santé : maladies, médicaments et offre de soins.',
})

const categories = getBrandConfig('medistats').contentCategories
</script>

<template>
  <ArticlesListingView :categories="categories" title="Articles" />
</template>
