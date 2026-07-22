<script setup lang="ts">
import MedistatsHero from './MedistatsHero.vue'
import MedistatsHighlights from './MedistatsHighlights.vue'
import PollPulseBanner from '@/components/polls/PollPulseBanner.vue'
import { homeContent } from '@/data/brands/medistats/home'
</script>

<template>
  <div class="medistats-home">
    <div class="pb-0 pt-0">
      <MedistatsHero />
      <MedistatsHighlights />
      <section class="bg-white">
        <div class="container py-20">
          <PollPulseBanner v-bind="homeContent.poll" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.medistats-home {
  background: var(--app-body-background);
}
</style>
