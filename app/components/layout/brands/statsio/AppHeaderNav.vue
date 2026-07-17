<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'
import { loadArticleMenu, loadStatsDataMenu, loadSurveyMenu, loadChannelsMenu } from '@/composables/useHeaderMegaMenuData'

defineProps<{
  modelValue: HeaderNavItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: HeaderNavItem | null]
}>()

const categoryPalette = ['#8b5cf6', '#e11d48', '#3b82f6', '#166534', '#d97706']

const { data } = useAsyncData('statsio-header-nav', () =>
  Promise.all([
    loadArticleMenu(undefined, categoryPalette),
    loadStatsDataMenu(undefined, categoryPalette),
    loadSurveyMenu(undefined, categoryPalette),
    loadChannelsMenu(categoryPalette),
  ]),
)

const items = computed<HeaderNavItem[]>(() => {
  const [articles, statsdata, sondages, chaines] = data.value ?? []

  return [
    {
      label: 'Articles',
      href: '/articles',
      icon: 'articles',
      eyebrow: 'Analyses & formats',
      menuHeading: 'Derniers articles',
      links: articles?.links ?? [],
      categories: articles?.categories ?? [],
      menu: articles?.menu ?? { variant: 'doc', cards: [] },
    },
    {
      label: 'StatsData',
      href: '/statsdata',
      icon: 'stats',
      eyebrow: 'Base de données',
      menuHeading: 'StatsData populaires',
      links: statsdata?.links ?? [],
      categories: statsdata?.categories ?? [],
      menu: statsdata?.menu ?? { variant: 'bar', cards: [] },
    },
    {
      label: 'Sondages',
      href: '/sondages',
      icon: 'polls',
      eyebrow: 'Intentions & opinions',
      menuHeading: 'Sondages populaires',
      links: sondages?.links ?? [],
      categories: sondages?.categories ?? [],
      menu: sondages?.menu ?? { variant: 'pie', cards: [] },
    },
    {
      label: 'Chaînes',
      href: '/chaines',
      icon: 'channels',
      eyebrow: 'Distribution',
      menuHeading: 'Chaînes tendance',
      links: chaines?.links ?? [],
      categories: chaines?.categories ?? [],
      menu: chaines?.menu ?? { variant: 'plane', cards: [] },
    },
  ]
})

defineExpose({ items })
</script>

<template>
  <nav class="hidden items-center gap-3 text-sm font-semibold text-slate-500 lg:flex">
    <div v-for="item in items" :key="item.label">
      <component :is="item.href.startsWith('/') ? RouterLink : 'a'"
        :to="item.href.startsWith('/') ? item.href : undefined"
        :href="item.href.startsWith('/') ? undefined : item.href"
        class="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-white hover:text-slate-900 [&.router-link-active]:text-primary [&.router-link-active]:underline [&.router-link-active]:decoration-2 [&.router-link-active]:underline-offset-8"
        @mouseenter="emit('update:modelValue', item)">
        <span class="flex items-center justify-center text-slate-700">
          <AppNavIcon :kind="item.icon" />
        </span>
        <span>{{ item.label }}</span>
      </component>
    </div>
  </nav>
</template>
