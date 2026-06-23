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

const siteName = 'Statsio'
const requestUrl = useRequestURL()

const seoTitle = computed(() => {
  const title = route.meta.title as string | undefined
  return title ? `${title} · ${siteName}` : siteName
})

const seoDescription = computed(() =>
  (route.meta.description as string | undefined) ??
  'Statsio centralise les analyses, les sources et les signaux en temps réel pour créer des articles, des StatsData et des sondages à fort impact.',
)

const canonicalUrl = computed(() => `${requestUrl.origin}${route.fullPath}`)

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  robots: () => (route.meta.robots as string | undefined) ?? 'index,follow',
  ogSiteName: siteName,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogType: () => (route.meta.ogType as string | undefined) ?? 'website',
  ogUrl: () => canonicalUrl.value,
  ogImage: () => (route.meta.ogImage as string | undefined) ?? undefined,
  twitterCard: () => (route.meta.ogImage ? 'summary_large_image' : 'summary'),
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
})

useHead({
  link: [{ rel: 'canonical', href: () => canonicalUrl.value }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteName,
          url: requestUrl.origin,
          logo: `${requestUrl.origin}/favicon.ico`,
        }),
    },
  ],
})
</script>

<template>
  <div
    :data-theme="appTheme"
    class="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_16%,#eef4ff_100%)] text-slate-900"
  >
    <AppPromoBanner :items="sharedPromoItems" />
    <AppHeader />
    <slot />
    <AppFooter />
  </div>
</template>
