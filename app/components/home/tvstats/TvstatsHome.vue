<script setup lang="ts">
import HomeEditorial from '@/components/home/HomeEditorial.vue'
import TvstatsHighlights from './TvstatsHighlights.vue'
import { tvstatsHomeV2 } from '@/data/brands/tvstats/home-v2'
</script>

<template>
  <HomeEditorial :content="tvstatsHomeV2">
    <template #after-lede>
      <TvstatsHighlights />
    </template>
  </HomeEditorial>
</template>
