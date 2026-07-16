<script setup lang="ts">
import { computed } from 'vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppPromoBanner from '@/components/layout/AppPromoBanner.vue'
import { sharedPromoItems } from '@/data/promo-items'

const route = useRoute()
const appTheme = computed(() => {
  if (route.path.startsWith('/tvstats')) return 'tvstats'
  if (route.path.startsWith('/medistats')) return 'medistats'
  return undefined
})

usePageSeo()
</script>

<template>
  <div
    :data-theme="appTheme"
    class="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_16%,#eef4ff_100%)] text-slate-900"
  >
    <AppPromoBanner :items="sharedPromoItems" />
    <AppHeader />
    <!--
      pt-44 lg:pt-28 clears the fixed AppPromoBanner + AppHeader stack, which is taller
      below lg (extra mobile nav-pills row) than at lg+. Pages that bleed a background
      under the header (HomeHero/MedistatsHero/TvstatsHero via PageHero.vue) cancel this
      with a matching -mt-44 lg:-mt-28 — keep both in sync if the header height changes.
    -->
    <main class="pt-44 lg:pt-28">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
