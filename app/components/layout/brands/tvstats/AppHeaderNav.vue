<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'
import { loadAudiencesMenu, loadProgrammeTvMenu, loadChannelsMenu } from '@/composables/useHeaderMegaMenuData'

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
    loadChannelsMenu(categoryPalette),
  ]),
)

const items = computed<HeaderNavItem[]>(() => {
  const [audiences, programmeTv, chaines] = data.value ?? []

  return [
    {
      label: 'Audiences',
      href: '/tvstats/audiences',
      icon: 'stats',
      eyebrow: 'Mesures & séries',
      menuHeading: 'Audiences populaires',
      links: audiences?.links ?? [],
      categories: audiences?.categories ?? [],
      menu: audiences?.menu ?? { variant: 'bar', cards: [] },
    },
    {
      label: 'Programme TV',
      href: '/tvstats/programme-tv',
      icon: 'remote',
      eyebrow: 'Programmation',
      menuHeading: 'Programme du moment',
      links: programmeTv?.links ?? [],
      categories: programmeTv?.categories ?? [],
      menu: programmeTv?.menu ?? { variant: 'doc', cards: [] },
    },
    {
      label: 'Chaînes',
      href: '/chaines',
      icon: 'channels',
      eyebrow: 'Réseau TV',
      menuHeading: 'Chaînes suivies',
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
