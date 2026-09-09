<script setup lang="ts">
import HomeEditorial from '@/components/home/HomeEditorial.vue'
import { statsioHomeV2 } from '@/data/brands/statsio/home-v2'
</script>

<template>
  <HomeEditorial :content="statsioHomeV2" />
</template>
