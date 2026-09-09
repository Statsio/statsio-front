<script setup lang="ts">
import { computed } from 'vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppPromoBanner from '@/components/layout/AppPromoBanner.vue'

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
    class="app-shell min-h-screen text-slate-900"
    style="background: var(--app-shell-bg)"
  >
    <a href="#main-content" class="sr-skip-link">Passer au contenu principal</a>
    <AppPromoBanner />
    <AppHeader />
    <!--
      pt-40 lg:pt-28 clears the fixed AppPromoBanner (h-14) + AppHeader (h-14) stack — 112px
      at lg+, plus the mobile nav-pills row below lg. Pages that bleed a background under the
      header (PageHero.vue / PageHeroV2.vue) cancel this with a matching -mt-40 lg:-mt-28 — keep
      both in sync if the promo/header heights change.
    -->
    <main id="main-content" tabindex="-1" class="relative pt-40 lg:pt-28">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
