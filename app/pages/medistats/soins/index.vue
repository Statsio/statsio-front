<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Soins — MédiStats',
  description:
    'Ressources humaines de santé, infrastructures et financement des systèmes de santé par pays. Source WHO GHO OData.',
})
import SoinsMap from '@/components/soins/SoinsMap.vue'
</script>

<template>
  <SoinsMap />
</template>
