<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const appTheme = computed(() => (route.path.startsWith('/tvstats') ? 'tvstats' : undefined))

usePageSeo({ title: 'Studio', robots: 'noindex,nofollow' })

// Charte « Tranches » du Studio : posée sur <html> (et retirée au démontage du layout)
// pour que les modales téléportées dans <body> en héritent aussi — cf. assets/studio.css.
useHead({ htmlAttrs: { class: 'studio-tranches' } })
</script>

<template>
  <div
    :data-theme="appTheme"
    class="st-app relative h-screen w-screen overflow-hidden"
  >
    <slot />
    <SourceSyncToast />
    <StudioPremiumUpsellModal />
  </div>
</template>
