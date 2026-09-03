<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'StatsData santé',
  description: 'Explorez les datasets MEDISTATS : indicateurs santé, maladies, médicaments et soins.',
})
</script>

<template>
  <StatsDataListingView sub-brand="medistats" />
</template>
