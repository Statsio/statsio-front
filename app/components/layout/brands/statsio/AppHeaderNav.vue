<script setup lang="ts">
import { computed } from 'vue'
import AppHeaderNavBar from '@/components/layout/brands/AppHeaderNavBar.vue'
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
    loadArticleMenu(undefined, categoryPalette, ''),
    loadStatsDataMenu(undefined, categoryPalette, ''),
    loadSurveyMenu(undefined, categoryPalette, ''),
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
      menuHeading: 'À la une',
      categoryHeading: 'Rubriques',
      links: articles?.links ?? [],
      categories: articles?.categories ?? [],
      menu: articles?.menu ?? { variant: 'doc', cards: [] },
    },
    {
      label: 'StatsData',
      href: '/statsdata',
      icon: 'stats',
      eyebrow: 'Base de données',
      menuHeading: 'À la une',
      categoryHeading: 'Thèmes',
      links: statsdata?.links ?? [],
      categories: statsdata?.categories ?? [],
      menu: statsdata?.menu ?? { variant: 'bar', cards: [] },
    },
    {
      label: 'Sondages',
      href: '/sondages',
      icon: 'polls',
      eyebrow: 'Intentions & opinions',
      menuHeading: 'À la une',
      categoryHeading: 'Types',
      links: sondages?.links ?? [],
      categories: sondages?.categories ?? [],
      menu: sondages?.menu ?? { variant: 'pie', cards: [] },
    },
    {
      label: 'Chaînes',
      href: '/chaines',
      icon: 'channels',
      eyebrow: 'Distribution',
      menuHeading: 'À la une',
      categoryHeading: 'Découvrir',
      links: chaines?.links ?? [],
      categories: chaines?.categories ?? [],
      menu: chaines?.menu ?? { variant: 'plane', cards: [] },
    },
  ]
})

defineExpose({ items })
</script>

<template>
  <AppHeaderNavBar :items="items" @hover="emit('update:modelValue', $event)" />
</template>
