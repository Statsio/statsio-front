<script setup lang="ts">
import MedistatsHero from './MedistatsHero.vue'
import MedistatsHighlights from './MedistatsHighlights.vue'
import PollPulseBanner from '@/components/polls/PollPulseBanner.vue'
import { homeContent } from '@/data/brands/medistats/home'
</script>

<template>
  <div class="medistats-home">
    <a href="#main-content" class="sr-skip-link">Passer au contenu principal</a>
    <main id="main-content" tabindex="-1" class="pb-0 pt-0">
      <MedistatsHero />
      <MedistatsHighlights />
      <section class="bg-white">
        <div class="container py-20">
          <PollPulseBanner v-bind="homeContent.poll" />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.medistats-home {
  background: var(--app-body-background);
}
</style>
