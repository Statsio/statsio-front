<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'À propos',
  description: 'Découvrez Statsio, la plateforme de data journalism qui centralise analyses, sources et signaux pour créer des contenus à fort impact.',
})
</script>

<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
