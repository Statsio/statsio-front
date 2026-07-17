<script setup lang="ts">
import { getBrandConfig } from '@/data/brands'

definePageMeta({
  layout: 'default',
  title: 'Sondages santé',
  description: "Parcourez les sondages MEDISTATS : baromètres d'opinion sur la santé, les maladies et l'offre de soins.",
})

const categories = getBrandConfig('medistats').contentCategories
</script>

<template>
  <SondagesListingView :categories="categories" />
</template>
