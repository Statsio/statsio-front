<script setup lang="ts">
import TvstatsHero from './TvstatsHero.vue'
import TvstatsHighlights from './TvstatsHighlights.vue'
import PollPulseBanner from '@/components/polls/PollPulseBanner.vue'
import { homeContent } from '@/data/brands/tvstats/home'
</script>

<template>
  <div class="tvstats-home">
    <a href="#main-content" class="sr-skip-link">Passer au contenu principal</a>
    <main id="main-content" tabindex="-1" class="pb-0 pt-0">
      <TvstatsHero />
      <TvstatsHighlights />
      <section class="bg-white">
        <div class="container py-20">
          <PollPulseBanner v-bind="homeContent.poll" />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.tvstats-home {
  background: var(--app-body-background);
}
</style>
