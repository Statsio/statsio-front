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
import { useContentBasePath } from '@/composables/useContentBasePath'
import type { HomeV2Content } from '@/data/brands/home-content.types'

/**
 * Page d'accueil « éditoriale » (façon magazine), partagée par Statsio / TVStats /
 * Medistats. Un seul chargement groupé du catalogue via `useHomeFeed`, filtré par
 * domaine (`sub_brand`) d'après le préfixe de route. Les textes marketing viennent
 * de `content` ; les liens « voir tout » sont préfixés par la marque courante.
 * Le slot `after-lede` reçoit un encart propre à la marque (ex. le programme TV en
 * direct sur TVStats).
 */
defineProps<{ content: HomeV2Content }>()

const base = useContentBasePath()

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

    <!-- Encart propre à la marque (programme TV en direct, etc.) -->
    <slot name="after-lede" />

    <!-- DERNIERS DÉCRYPTAGES + colonne « les plus consultés » — fond gris clair -->
    <section
      v-if="river.length"
      class="border-t border-slate-200/70 py-16"
      style="background: var(--home-band-muted)"
    >
      <div class="mx-auto max-w-[1120px] px-6">
        <HomeRiver :title="content.carousels.articles.title" :river="river" :most-read="mostRead" />
      </div>
    </section>

    <!-- CHIFFRES EN DIRECT — fond teinté (la section porte son fond) -->
    <HomeLiveStats
      :title="content.carousels.statsdata.title"
      :items="statsdata"
      :is-favorited="isFavorited"
      @favorite="toggleItemFavorite"
    />

    <!-- CONSULTATIONS OUVERTES — cadre sur fond blanc -->
    <HomeSurveys
      :title="content.carousels.sondages.title"
      :items="surveys"
      :is-favorited="isFavorited"
      @favorite="toggleItemFavorite"
    />

    <!-- CHAÎNES À SUIVRE — fond gris clair -->
    <section
      class="border-y border-slate-200/70 py-16 [&_section]:!mb-0"
      style="background: var(--home-band-muted-2)"
    >
      <div class="mx-auto max-w-[1120px] px-6">
        <HomeChannelsStrip :title="content.channelsTitle" />
      </div>
    </section>

    <!-- PUBLIER — carte sur fond teinté -->
    <section class="py-16 [&_section]:!mb-0" style="background: var(--home-band-tint)">
      <div class="mx-auto max-w-[1120px] px-6">
        <HomeCreateSteps
          :eyebrow="content.stepsEyebrow"
          :title="content.stepsTitle"
          :desc="content.stepsDesc"
          :cta-label="content.stepsCta"
          :steps="content.steps"
          cta-to="/register"
        />
      </div>
    </section>

    <!-- FAQ — fond blanc -->
    <section class="border-t border-slate-200/70 bg-white py-16 [&_section]:!mb-0">
      <div class="mx-auto max-w-[1120px] px-6">
        <HomeFaq :eyebrow="content.faqEyebrow" :title="content.faqTitle" :faqs="content.faqs" />
      </div>
    </section>

    <!-- CTA FINALE — bannière sombre sur fond blanc -->
    <section class="bg-white pb-16 [&_section]:!mb-0">
      <div class="mx-auto max-w-[1120px] px-6">
        <HomeCtaBanner
          :headline="content.cta.headline"
          :subtitle="content.cta.subtitle"
          :primary-label="content.cta.primary"
          :secondary-label="content.cta.secondary"
          primary-to="/register"
          :secondary-to="`${base}/chaines`"
        />
      </div>
    </section>
  </div>
</template>
