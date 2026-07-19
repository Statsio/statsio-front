<script setup lang="ts">
import { getBrandConfig } from '@/data/brands'

definePageMeta({ layout: 'default' })

const categories = getBrandConfig('medistats').contentCategories
</script>

<template>
  <ArticleDetailView :categories="categories" />
</template>
