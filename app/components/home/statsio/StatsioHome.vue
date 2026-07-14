<script setup lang="ts">
import HomeHero from '@/components/home/HomeHero.vue'
import HomeArticles from '@/components/home/HomeArticles.vue'
import HomeChannels from '@/components/home/HomeChannels.vue'
import PollPulseBanner from '@/components/polls/PollPulseBanner.vue'
import { homeContent } from '@/data/brands/statsio/home'
</script>

<template>
  <div>
    <a href="#main-content" class="sr-skip-link">Passer au contenu principal</a>
    <main id="main-content" tabindex="-1" class="pb-0 pt-0">
      <HomeHero :content="homeContent" primary-cta-to="/statsdata" secondary-cta-to="/register" />
      <HomeArticles />
      <HomeChannels />
      <section class="bg-white">
        <div class="container py-20">
          <PollPulseBanner v-bind="homeContent.poll" />
        </div>
      </section>
    </main>
  </div>
</template>
