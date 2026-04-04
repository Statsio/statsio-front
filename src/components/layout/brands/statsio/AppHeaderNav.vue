<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'

defineProps<{
  modelValue: HeaderNavItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: HeaderNavItem | null]
}>()

const items: HeaderNavItem[] = [
  {
    label: 'Articles',
    href: '/articles',
    icon: 'articles',
    eyebrow: 'Analyses & formats',
    title: 'Des formats éditoriaux enrichis par vos signaux data.',
    description:
      'Explorez des dossiers, décryptages et chroniques construites autour des tendances qui montent vraiment.',
    featured: {
      title: 'A la une',
      value: '24 analyses',
      detail: 'Nouveaux formats publiés cette semaine',
    },
    links: ['Décryptages', 'Tribunes', 'Fact-checking', 'Formats longs'],
  },
  {
    label: 'StatsData',
    href: '/statsdata',
    icon: 'stats',
    eyebrow: 'Base de données',
    title: 'Un cockpit pour suivre les signaux, métriques et séries temporelles.',
    description:
      'Croisez les volumes, tendances et historiques sur une interface pensée pour l’exploration rapide.',
    featured: {
      title: 'Signal live',
      value: '+18.4%',
      detail: 'Croissance hebdomadaire des requêtes suivies',
    },
    links: ['Tableaux de bord', 'API datasets', 'Comparateurs', 'Exports'],
  },
  {
    label: 'Sondages',
    href: '#',
    icon: 'polls',
    eyebrow: 'Intentions & opinions',
    title: 'Pilotez vos baromètres et suivez les écarts en temps réel.',
    description:
      'Accédez à des synthèses claires, des intentions de vote et des dynamiques par période ou segment.',
    featured: {
      title: 'Baromètre actif',
      value: '12k réponses',
      detail: 'Dernière vague consolidée',
    },
    links: ['Intentions de vote', 'Baromètres', 'Segments', 'Historique'],
  },
  {
    label: 'Chaînes',
    href: '/chaines',
    icon: 'channels',
    eyebrow: 'Distribution',
    title: 'Centralisez vos canaux de diffusion et leurs performances.',
    description:
      'Connectez newsletters, réseaux et flux éditoriaux pour comparer la portée et l’engagement.',
    featured: {
      title: 'Canaux suivis',
      value: '08 sources',
      detail: 'Newsletters, social, flux et partenaires',
    },
    links: ['Newsletters', 'Réseaux sociaux', 'Partenaires', 'Automatisations'],
  },
]
</script>

<template>
  <nav class="hidden items-center gap-3 text-sm font-semibold text-slate-500 lg:flex">
    <div v-for="item in items" :key="item.label">
      <component :is="item.href.startsWith('/') ? RouterLink : 'a'"
        :to="item.href.startsWith('/') ? item.href : undefined"
        :href="item.href.startsWith('/') ? undefined : item.href"
        class="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-white hover:text-slate-900"
        @mouseenter="emit('update:modelValue', item)">
        <span class="flex items-center justify-center text-slate-700">
          <AppNavIcon :kind="item.icon" />
        </span>
        <span>{{ item.label }}</span>
      </component>
    </div>
  </nav>
</template>
