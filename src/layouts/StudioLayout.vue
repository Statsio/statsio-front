<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed, watchEffect } from 'vue'

type SeoMeta = {
  title?: string
  description?: string
  robots?: string
  ogImage?: string
  ogType?: string
}

const route = useRoute()

function upsertMetaByName(name: string, content: string) {
  if (!content) return
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${CSS.escape(name)}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertMetaByProperty(property: string, content: string) {
  if (!content) return
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${CSS.escape(property)}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  if (!href) return
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${CSS.escape(rel)}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

const siteName = 'Statsio'
const baseUrl = computed(() => window.location.origin)

const seo = computed<Required<SeoMeta>>(() => {
  const meta = (route.meta ?? {}) as SeoMeta

  const title = meta.title ? `${meta.title} · ${siteName}` : siteName
  const description =
    meta.description ??
    'Statsio centralise les analyses, les sources et les signaux en temps réel pour créer des articles, des StatsData et des sondages à fort impact.'

  return {
    title,
    description,
    robots: meta.robots ?? 'noindex,nofollow',
    ogImage: meta.ogImage ?? '',
    ogType: meta.ogType ?? 'website',
  }
})

const canonicalUrl = computed(() => `${baseUrl.value}${route.fullPath}`)

watchEffect(() => {
  document.title = seo.value.title

  upsertMetaByName('description', seo.value.description)
  upsertMetaByName('robots', seo.value.robots)

  upsertLink('canonical', canonicalUrl.value)

  // OpenGraph
  upsertMetaByProperty('og:site_name', siteName)
  upsertMetaByProperty('og:title', seo.value.title)
  upsertMetaByProperty('og:description', seo.value.description)
  upsertMetaByProperty('og:type', seo.value.ogType)
  upsertMetaByProperty('og:url', canonicalUrl.value)
  if (seo.value.ogImage) upsertMetaByProperty('og:image', seo.value.ogImage)

  // Twitter
  upsertMetaByName('twitter:card', seo.value.ogImage ? 'summary_large_image' : 'summary')
  upsertMetaByName('twitter:title', seo.value.title)
  upsertMetaByName('twitter:description', seo.value.description)
  if (seo.value.ogImage) upsertMetaByName('twitter:image', seo.value.ogImage)
})
</script>

<template>
  <RouterView />
</template>
