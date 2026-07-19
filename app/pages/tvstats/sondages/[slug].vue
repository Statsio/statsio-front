<script setup lang="ts">
import { getBrandConfig } from '@/data/brands'

definePageMeta({ layout: 'default' })

const categories = getBrandConfig('tvstats').contentCategories
</script>

<template>
  <SondageDetailView :categories="categories" />
</template>
