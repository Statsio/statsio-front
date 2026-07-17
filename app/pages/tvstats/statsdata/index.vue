<script setup lang="ts">
import { getBrandConfig } from '@/data/brands'

definePageMeta({
  layout: 'default',
  title: 'StatsData TV & People',
  description: 'Explorez les datasets TVSTATS : audiences, programmes et indicateurs TV et people.',
})

const categories = getBrandConfig('tvstats').contentCategories
</script>

<template>
  <StatsDataListingView :categories="categories" />
</template>
