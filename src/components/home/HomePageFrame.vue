<script setup lang="ts">
import { computed } from 'vue'
import { promoItems as statsioPromoItems } from '@/data/brands/statsio/promo-items'
import { promoItems as tvstatsPromoItems } from '@/data/brands/tvstats/promo-items'
import HomeArticles from '@/components/home/HomeArticles.vue'
import HomeCTA from '@/components/home/HomeCTA.vue'
import HomeHero from '@/components/home/HomeHero.vue'
import HomeHighlights from '@/components/home/HomeHighlights.vue'
import HomePolls from '@/components/home/HomePolls.vue'
import HomeStatsData from '@/components/home/HomeStatsData.vue'
import HomeStatsStrip from '@/components/home/HomeStatsStrip.vue'

const props = withDefaults(
  defineProps<{
    variant?: 'statsio' | 'tvstats' | 'medistats'
    heroBullets: string[]
    heroKpis: { label: string; value: string }[]
    statsStrip: { label: string; value: string; hint: string }[]
    highlights: { title: string; description: string; tag: string; icon: string }[]
    articles: { category: string; title: string; author: string; reads: string; trend: string }[]
    statsData: { title: string; scope: string; updated: string; metrics: string[] }[]
    polls: { title: string; window: string; candidates: { name: string; score: string }[] }[]
  }>(),
  {
    variant: 'statsio',
  },
)

const pageClass = computed(() => {
  if (props.variant === 'tvstats') return 'brand-theme-tvstats'
  if (props.variant === 'medistats') return 'brand-theme-medistats'
  return ''
})
const promoItems = computed(() => (props.variant === 'tvstats' ? tvstatsPromoItems : statsioPromoItems))
</script>

<template>
  <div :class="pageClass">
    <a href="#main-content" class="sr-skip-link">Passer au contenu principal</a>
    <main id="main-content" tabindex="-1" class="pb-24 pt-32">
      <HomeHero
        headline="Le média statistique nouvelle génération."
        subtitle="Statsio centralise les analyses, les sources et les signaux en temps réel pour créer des articles, des StatsData et des sondages à fort impact."
        :bullets="heroBullets"
        :kpis="heroKpis"
      />
      <HomeStatsStrip :stats="statsStrip" />
      <HomeHighlights :items="highlights" />
      <HomeArticles :items="articles" />
      <HomeStatsData :items="statsData" />
      <HomePolls :items="polls" />
      <HomeCTA />
    </main>
  </div>
</template>

<style scoped>
.brand-theme-tvstats {
  --color-primary: var(--color-tvstats-primary);
  --color-secondary: var(--color-tvstats-soft);
  --color-accent: var(--color-tvstats-secondary);
  --app-body-background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
    linear-gradient(180deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
    radial-gradient(900px 480px at 15% -10%, rgba(22, 101, 52, 0.14), transparent 70%), #f7fcf8;
  --app-badge-border: rgba(22, 101, 52, 0.26);
  --app-badge-surface: rgba(134, 239, 172, 0.16);
  --app-badge-text: #14532d;
  background: var(--app-body-background);
}

.brand-theme-medistats {
  --color-primary: var(--color-medistats-primary);
  --color-secondary: var(--color-medistats-soft);
  --color-accent: var(--color-medistats-secondary);
  --app-body-background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
    linear-gradient(180deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
    radial-gradient(900px 480px at 15% -10%, rgba(153, 27, 27, 0.1), transparent 70%), #fdf8f8;
  --app-badge-border: rgba(153, 27, 27, 0.22);
  --app-badge-surface: rgba(252, 165, 165, 0.18);
  --app-badge-text: #7f1d1d;
  background: var(--app-body-background);
}
</style>
