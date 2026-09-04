<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Dossiers santé',
  description:
    "Les dossiers MEDISTATS : articles, statsdata et sondages d'un même sujet santé, réunis et mis à jour au fil de l'actualité.",
})
</script>

<template>
  <main>
    <DossiersListingView title="Dossiers" />
  </main>
</template>
