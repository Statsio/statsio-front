<script setup lang="ts">
import HomeHeroV2 from '@/components/home/statsio/HomeHeroV2.vue'
import HomeArticlesV2 from '@/components/home/statsio/HomeArticlesV2.vue'
import HomeStatsDataV2 from '@/components/home/statsio/HomeStatsDataV2.vue'
import HomeSondagesV2 from '@/components/home/statsio/HomeSondagesV2.vue'
import HomeChannelsStrip from '@/components/home/statsio/HomeChannelsStrip.vue'
import HomeCreateSteps from '@/components/home/statsio/HomeCreateSteps.vue'
import HomeFaq from '@/components/home/statsio/HomeFaq.vue'
import HomeCtaBanner from '@/components/home/statsio/HomeCtaBanner.vue'
import { statsioHomeV2 } from '@/data/brands/statsio/home-v2'
</script>

<template>
  <div class="bg-[#f4f3f8]">
    <HomeHeroV2 :content="statsioHomeV2" primary-cta-to="/register" secondary-cta-to="/studio" />

    <div class="container pt-16">
      <div id="articles-section" class="scroll-mt-32">
        <HomeArticlesV2 />
      </div>
      <div id="statsdata-section" class="scroll-mt-32">
        <HomeStatsDataV2 />
      </div>
      <div id="sondages-section" class="scroll-mt-32">
        <HomeSondagesV2 />
      </div>

      <HomeChannelsStrip />
      <HomeCreateSteps :steps="statsioHomeV2.steps" cta-to="/register" />
      <HomeFaq :faqs="statsioHomeV2.faqs" />
      <HomeCtaBanner primary-to="/register" secondary-to="/chaines" />
    </div>
  </div>
</template>
