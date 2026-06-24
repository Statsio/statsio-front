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
    label: 'Actus',
    href: '/tvstats',
    icon: 'articles',
    eyebrow: 'Actualités média et people',
    title:
      'Explorez des dossiers, décryptages et chroniques construites autour des tendances qui montent vraiment.',
    description:
      'Explorez des dossiers, décryptages et chroniques construites autour des tendances qui montent vraiment.',
    featured: {
      title: 'Émission en hausse',
      value: '+21%',
      detail: 'Progression hebdomadaire sur les formats prime time',
    },
    links: ['Talk-shows', 'JT', 'Magazines', 'Prime time'],
  },
  {
    label: 'Audiences',
    href: '/tvstats/audiences',
    icon: 'stats',
    eyebrow: 'Mesures & séries',
    title: 'Analysez les audiences, courbes et signaux de performance de vos formats TV.',
    description:
      'Accédez à des pages data dédiées aux volumes, pics d’attention, historiques et comparaisons par chaîne.',
    featured: {
      title: 'Pic d’audience',
      value: '6.4M',
      detail: 'Audience consolidée sur le dernier direct analysé',
    },
    links: ['Minutes vues', 'Parts d’audience', 'Historique', 'Segments'],
  },
  {
    label: 'Programme TV',
    href: 'tvstats/programme-tv',
    icon: 'remote',
    eyebrow: 'Programmation',
    title: 'Pilotez vos rendez-vous de diffusion avec une lecture claire des dynamiques par créneau.',
    description:
      'Comparez les cases, identifiez les zones de tension et repérez les opportunités de reprogrammation.',
    featured: {
      title: 'Créneau chaud',
      value: '20h45',
      detail: 'Fenêtre où la progression d’audience est la plus forte',
    },
    links: ['Prime', 'Access', 'Daytime', 'Late'],
  },
  {
    label: 'Chaînes',
    href: '/chaines',
    icon: 'channels',
    eyebrow: 'Réseau TV',
    title: 'Cartographiez vos chaînes, régies et partenaires de diffusion dans un même espace.',
    description:
      'Comparez les lignes éditoriales, performances relatives et complémentarités entre antennes.',
    featured: {
      title: 'Chaînes suivies',
      value: '12 antennes',
      detail: 'Périmètre consolidé pour les comparaisons cross-channel',
    },
    links: ['Généralistes', 'Info', 'Divertissement', 'Partenaires'],
  },
]

defineExpose({ items })
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
