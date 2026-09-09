<script setup lang="ts">
import HomeEditorial from '@/components/home/HomeEditorial.vue'
import { medistatsHomeV2 } from '@/data/brands/medistats/home-v2'
</script>

<template>
  <HomeEditorial :content="medistatsHomeV2" />
</template>
