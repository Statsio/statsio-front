<script setup lang="ts">
import HomeHeroV2 from '@/components/home/v2/HomeHeroV2.vue'
import HomeArticlesV2 from '@/components/home/v2/HomeArticlesV2.vue'
import HomeStatsDataV2 from '@/components/home/v2/HomeStatsDataV2.vue'
import HomeSondagesV2 from '@/components/home/v2/HomeSondagesV2.vue'
import HomeChannelsStrip from '@/components/home/v2/HomeChannelsStrip.vue'
import HomeCreateSteps from '@/components/home/v2/HomeCreateSteps.vue'
import HomeFaq from '@/components/home/v2/HomeFaq.vue'
import HomeCtaBanner from '@/components/home/v2/HomeCtaBanner.vue'
import MedistatsHighlights from './MedistatsHighlights.vue'
import { medistatsHomeV2 as c } from '@/data/brands/medistats/home-v2'
</script>

<template>
  <div class="bg-[#f4f3f8]">
    <HomeHeroV2 :content="c" primary-cta-to="/register" secondary-cta-to="/studio" />

    <MedistatsHighlights />

    <div class="container pt-16">
      <div id="articles-section" class="scroll-mt-32">
        <HomeArticlesV2 v-bind="c.carousels.articles" />
      </div>
      <div id="statsdata-section" class="scroll-mt-32">
        <HomeStatsDataV2 v-bind="c.carousels.statsdata" />
      </div>
      <div id="sondages-section" class="scroll-mt-32">
        <HomeSondagesV2 v-bind="c.carousels.sondages" />
      </div>

      <HomeChannelsStrip :title="c.channelsTitle" />
      <HomeCreateSteps
        :eyebrow="c.stepsEyebrow"
        :title="c.stepsTitle"
        :desc="c.stepsDesc"
        :cta-label="c.stepsCta"
        :steps="c.steps"
        cta-to="/register"
      />
      <HomeFaq :eyebrow="c.faqEyebrow" :title="c.faqTitle" :faqs="c.faqs" />
      <HomeCtaBanner
        :headline="c.cta.headline"
        :subtitle="c.cta.subtitle"
        :primary-label="c.cta.primary"
        :secondary-label="c.cta.secondary"
        primary-to="/register"
        secondary-to="/medistats/chaines"
      />
    </div>
  </div>
</template>
