<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Sondages santé',
  description: "Parcourez les sondages MEDISTATS : baromètres d'opinion sur la santé, les maladies et l'offre de soins.",
})
</script>

<template>
  <SondagesListingView sub-brand="medistats" />
</template>
