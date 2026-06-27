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
    <main class="pt-28">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
