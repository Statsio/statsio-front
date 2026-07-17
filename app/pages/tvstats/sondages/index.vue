<script setup lang="ts">
import { getBrandConfig } from '@/data/brands'

definePageMeta({
  layout: 'default',
  title: 'Sondages TV & People',
  description: "Parcourez les sondages TVSTATS : baromètres d'opinion sur les programmes, les chaînes et les personnalités TV.",
})

const categories = getBrandConfig('tvstats').contentCategories
</script>

<template>
  <SondagesListingView :categories="categories" />
</template>
