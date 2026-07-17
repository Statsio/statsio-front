<script setup lang="ts">
import { getBrandConfig } from '@/data/brands'

definePageMeta({
  layout: 'default',
  title: 'Actus TV & People',
  description: 'Décryptages et analyses TVSTATS sur les audiences, les programmes et les personnalités TV.',
})

const categories = getBrandConfig('tvstats').contentCategories
</script>

<template>
  <ArticlesListingView :categories="categories" title="Actus" />
</template>
