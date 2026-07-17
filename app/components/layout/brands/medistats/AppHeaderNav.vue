<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'
import { loadMaladiesMenu, loadMedicamentsMenu, loadSoinsMenu, loadChannelsMenu } from '@/composables/useHeaderMegaMenuData'

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
    loadChannelsMenu(categoryPalette),
  ]),
)

const items = computed<HeaderNavItem[]>(() => {
  const [maladies, medicaments, soins, chaines] = data.value ?? []

  return [
    {
      label: 'Maladies',
      href: '/medistats/maladies',
      icon: 'disease',
      eyebrow: 'Épidémiologie & pathologies',
      menuHeading: 'Indicateurs de santé publique',
      links: maladies?.links ?? [],
      categories: maladies?.categories ?? [],
      menu: maladies?.menu ?? { variant: 'bar', cards: [] },
    },
    {
      label: 'Médicaments',
      href: '/medistats/medicaments',
      icon: 'medicine',
      eyebrow: 'Pharmacologie & traitements',
      menuHeading: 'Données pharmacologiques',
      links: medicaments?.links ?? [],
      categories: medicaments?.categories ?? [],
      menu: medicaments?.menu ?? { variant: 'bar', cards: [] },
    },
    {
      label: 'Soins',
      href: '/medistats/soins',
      icon: 'medical-service',
      eyebrow: 'Systèmes de santé',
      menuHeading: 'Systèmes de santé',
      links: soins?.links ?? [],
      categories: soins?.categories ?? [],
      menu: soins?.menu ?? { variant: 'bar', cards: [] },
    },
    {
      label: 'Chaînes',
      href: '/chaines',
      icon: 'channels',
      eyebrow: 'Distribution éditoriale',
      menuHeading: 'Chaînes santé suivies',
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
      <component
        :is="item.href.startsWith('/') ? RouterLink : 'a'"
        :to="item.href.startsWith('/') ? item.href : undefined"
        :href="item.href.startsWith('/') ? undefined : item.href"
        class="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-white hover:text-slate-900 [&.router-link-active]:text-primary [&.router-link-active]:underline [&.router-link-active]:decoration-2 [&.router-link-active]:underline-offset-8"
        @mouseenter="emit('update:modelValue', item)"
      >
        <span class="flex items-center justify-center text-slate-700">
          <AppNavIcon :kind="item.icon" />
        </span>
        <span>{{ item.label }}</span>
      </component>
    </div>
  </nav>
</template>
