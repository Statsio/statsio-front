<script setup lang="ts">
import { computed } from 'vue'
import AppHeaderNavBar from '@/components/layout/brands/AppHeaderNavBar.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'
import {
  loadAudiencesMenu,
  loadProgrammeTvMenu,
  loadDossiersMenu,
  loadChannelsMenu,
} from '@/composables/useHeaderMegaMenuData'

defineProps<{
  modelValue: HeaderNavItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: HeaderNavItem | null]
}>()

const categoryPalette = ['#166534', '#7c3aed', '#22c55e', '#d97706', '#0891b2']

const { data } = useAsyncData('tvstats-header-nav', () =>
  Promise.all([
    loadAudiencesMenu(categoryPalette),
    loadProgrammeTvMenu(categoryPalette),
    loadDossiersMenu(categoryPalette),
    loadChannelsMenu(categoryPalette),
  ]),
)

const items = computed<HeaderNavItem[]>(() => {
  const [audiences, programmeTv, dossiers, chaines] = data.value ?? []

  return [
    {
      label: 'Audiences',
      href: '/tvstats/audiences',
      icon: 'stats',
      eyebrow: 'Mesures & séries',
      menuHeading: 'À la une',
      categoryHeading: 'Chaînes',
      links: audiences?.links ?? [],
      categories: audiences?.categories ?? [],
      menu: audiences?.menu ?? { variant: 'bar', cards: [] },
    },
    {
      label: 'Programme TV',
      href: '/tvstats/programme-tv',
      icon: 'remote',
      eyebrow: 'Programmation',
      menuHeading: 'À la une',
      categoryHeading: 'Genres',
      links: programmeTv?.links ?? [],
      categories: programmeTv?.categories ?? [],
      menu: programmeTv?.menu ?? { variant: 'doc', cards: [] },
    },
    {
      label: 'Dossiers',
      href: '/dossiers',
      icon: 'dossiers',
      eyebrow: 'Sujets suivis',
      menuHeading: 'Dossiers récents',
      categoryHeading: 'Catégories',
      links: dossiers?.links ?? [],
      categories: dossiers?.categories ?? [],
      menu: dossiers?.menu ?? { variant: 'plane', cards: [] },
    },
    {
      label: 'Chaînes',
      href: '/chaines',
      icon: 'channels',
      eyebrow: 'Réseau TV',
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
