<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const appTheme = computed(() => (route.path.startsWith('/tvstats') ? 'tvstats' : undefined))

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
})
</script>

<template>
  <div
    :data-theme="appTheme"
    class="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans"
  >
    <slot />
  </div>
</template>
