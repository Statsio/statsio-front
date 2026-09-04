<script setup lang="ts">
import { computed } from 'vue'
import AppHeaderNavBar from '@/components/layout/brands/AppHeaderNavBar.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'
import {
  loadMaladiesMenu,
  loadMedicamentsMenu,
  loadSoinsMenu,
  loadDossiersMenu,
  loadChannelsMenu,
} from '@/composables/useHeaderMegaMenuData'

defineProps<{
  modelValue: HeaderNavItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: HeaderNavItem | null]
}>()

const categoryPalette = ['#991b1b', '#7c3aed', '#d97706', '#0891b2', '#ef4444']

const { data } = useAsyncData('medistats-header-nav', () =>
  Promise.all([
    loadMaladiesMenu(categoryPalette),
    loadMedicamentsMenu(categoryPalette),
    loadSoinsMenu(categoryPalette),
    loadDossiersMenu(categoryPalette, 'medistats'),
    loadChannelsMenu(categoryPalette, 'medistats'),
  ]),
)

const items = computed<HeaderNavItem[]>(() => {
  const [maladies, medicaments, soins, dossiers, chaines] = data.value ?? []

  return [
    {
      label: 'Maladies',
      href: '/medistats/maladies',
      icon: 'disease',
      eyebrow: 'Épidémiologie & pathologies',
      menuHeading: 'À la une',
      categoryHeading: 'Catégories',
      links: maladies?.links ?? [],
      categories: maladies?.categories ?? [],
      menu: maladies?.menu ?? { variant: 'bar', cards: [] },
    },
    {
      label: 'Médicaments',
      href: '/medistats/medicaments',
      icon: 'medicine',
      eyebrow: 'Pharmacologie & traitements',
      menuHeading: 'À la une',
      categoryHeading: 'Formes',
      links: medicaments?.links ?? [],
      categories: medicaments?.categories ?? [],
      menu: medicaments?.menu ?? { variant: 'bar', cards: [] },
    },
    {
      label: 'Soins',
      href: '/medistats/soins',
      icon: 'medical-service',
      eyebrow: 'Systèmes de santé',
      menuHeading: 'À la une',
      categoryHeading: 'Indicateurs',
      links: soins?.links ?? [],
      categories: soins?.categories ?? [],
      menu: soins?.menu ?? { variant: 'bar', cards: [] },
    },
    {
      label: 'Dossiers',
      href: '/medistats/dossiers',
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
      href: '/medistats/chaines',
      icon: 'channels',
      eyebrow: 'Distribution éditoriale',
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
