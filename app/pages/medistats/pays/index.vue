<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Pays — MédiStats',
  description:
    'Indicateurs de santé publique par pays (espérance de vie, dépenses de santé, densité médicale, mortalité infantile), croisés avec les maladies suivies. Source WHO GHO OData.',
})
import PaysMap from '@/components/pays/PaysMap.vue'
</script>

<template>
  <PaysMap />
</template>
