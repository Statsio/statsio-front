<script setup lang="ts">
import HomeLede from '@/components/home/statsio/HomeLede.vue'
import HomeLedeSkeleton from '@/components/home/statsio/HomeLedeSkeleton.vue'
import HomeRiver from '@/components/home/statsio/HomeRiver.vue'
import HomeLiveStats from '@/components/home/statsio/HomeLiveStats.vue'
import HomeSurveys from '@/components/home/statsio/HomeSurveys.vue'
import HomeChannelsStrip from '@/components/home/v2/HomeChannelsStrip.vue'
import HomeCreateSteps from '@/components/home/v2/HomeCreateSteps.vue'
import HomeFaq from '@/components/home/v2/HomeFaq.vue'
import HomeCtaBanner from '@/components/home/v2/HomeCtaBanner.vue'
import { useHomeFeed } from '@/composables/useHomeFeed'
import { statsioHomeV2 as c } from '@/data/brands/statsio/home-v2'

const {
  pending,
  lead,
  secondary,
  river,
  mostRead,
  statsdata,
  surveys,
  isFavorited,
  toggleItemFavorite,
} = useHomeFeed()
</script>

<template>
  <div class="bg-white">
    <!-- LA UNE — fond blanc -->
    <section class="mx-auto max-w-[1120px] px-6 pb-14 pt-8">
      <div class="mb-6 flex items-center gap-3">
        <span class="font-mono text-[10px] font-semibold tracking-[0.14em] text-slate-400">À LA UNE</span>
        <span class="h-px flex-1 bg-slate-200/80" />
      </div>
      <HomeLede
        v-if="lead"
        :lead="lead"
        :secondary="secondary"
        :is-favorited="isFavorited"
        @favorite="toggleItemFavorite"
      />
      <HomeLedeSkeleton v-else-if="pending" />
    </section>

    <!-- DERNIERS DÉCRYPTAGES + colonne « les plus consultés » — fond gris clair -->
    <section
      v-if="river.length"
      class="border-t border-slate-200/70 bg-[#f8f8fb] py-16"
    >
      <div class="mx-auto max-w-[1120px] px-6">
        <HomeRiver :title="c.carousels.articles.title" :river="river" :most-read="mostRead" />
      </div>
    </section>

    <!-- CHIFFRES EN DIRECT — fond violet léger (la section porte son fond) -->
    <HomeLiveStats
      :title="c.carousels.statsdata.title"
      :items="statsdata"
      :is-favorited="isFavorited"
      @favorite="toggleItemFavorite"
    />

    <!-- CONSULTATIONS OUVERTES — cadre sur fond blanc -->
    <HomeSurveys
      :title="c.carousels.sondages.title"
      :items="surveys"
      :is-favorited="isFavorited"
      @favorite="toggleItemFavorite"
    />

    <!-- CHAÎNES À SUIVRE — fond gris clair -->
    <section class="border-y border-slate-200/70 bg-[#f6f6fb] py-16 [&_section]:!mb-0">
      <div class="mx-auto max-w-[1120px] px-6">
        <HomeChannelsStrip :title="c.channelsTitle" />
      </div>
    </section>

    <!-- PUBLIER SUR STATSIO — carte sur fond teinté -->
    <section class="bg-[#f3f0fb] py-16 [&_section]:!mb-0">
      <div class="mx-auto max-w-[1120px] px-6">
        <HomeCreateSteps
          :eyebrow="c.stepsEyebrow"
          :title="c.stepsTitle"
          :desc="c.stepsDesc"
          :cta-label="c.stepsCta"
          :steps="c.steps"
          cta-to="/register"
        />
      </div>
    </section>

    <!-- FAQ — fond blanc -->
    <section class="border-t border-slate-200/70 bg-white py-16 [&_section]:!mb-0">
      <div class="mx-auto max-w-[1120px] px-6">
        <HomeFaq :eyebrow="c.faqEyebrow" :title="c.faqTitle" :faqs="c.faqs" />
      </div>
    </section>

    <!-- CTA FINALE — bannière sombre sur fond blanc -->
    <section class="bg-white pb-16 [&_section]:!mb-0">
      <div class="mx-auto max-w-[1120px] px-6">
        <HomeCtaBanner
          :headline="c.cta.headline"
          :subtitle="c.cta.subtitle"
          :primary-label="c.cta.primary"
          :secondary-label="c.cta.secondary"
          primary-to="/register"
          secondary-to="/chaines"
        />
      </div>
    </section>
  </div>
</template>
