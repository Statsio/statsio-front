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
    label: 'Maladies',
    href: '/medistats/maladies',
    icon: 'disease',
    eyebrow: 'Épidémiologie & pathologies',
    title: 'Suivez l\'évolution des maladies, épidémies et indicateurs de santé publique.',
    description:
      'Accédez aux données épidémiologiques, courbes d\'incidence et comparaisons géographiques pour chaque pathologie.',
    featured: {
      title: 'Pathologies suivies',
      value: '1 240',
      detail: 'Maladies et syndromes référencés dans la base',
    },
    links: ['Maladies infectieuses', 'Maladies chroniques', 'Épidémies', 'Facteurs de risque'],
  },
  {
    label: 'Médicaments',
    href: '/medistats/medicaments',
    icon: 'medicine',
    eyebrow: 'Pharmacologie & traitements',
    title: 'Explorez les médicaments, interactions et données de prescription.',
    description:
      'Comparez les traitements, consultez les essais cliniques et suivez les tendances de prescription par région.',
    featured: {
      title: 'Médicaments référencés',
      value: '14 800',
      detail: 'Spécialités pharmaceutiques dans la base',
    },
    links: ['Médicaments remboursés', 'Essais cliniques', 'Interactions', 'Génériques'],
  },
  {
    label: 'Services médicaux',
    href: '/medistats/services',
    icon: 'medical-service',
    eyebrow: 'Offre de soins',
    title: 'Cartographiez l\'offre de soins et les indicateurs de performance des établissements.',
    description:
      'Hôpitaux, cliniques, médecins de ville — analysez la densité de l\'offre, les délais et les taux d\'occupation.',
    featured: {
      title: 'Établissements suivis',
      value: '3 100',
      detail: 'Hôpitaux et cliniques référencés en France',
    },
    links: ['Hôpitaux', 'Cliniques', 'Médecine de ville', 'Urgences'],
  },
  {
    label: 'Chaînes',
    href: '/chaines',
    icon: 'channels',
    eyebrow: 'Distribution éditoriale',
    title: 'Centralisez vos canaux de diffusion santé et leurs performances.',
    description:
      'Connectez newsletters médicales, réseaux et flux éditoriaux pour comparer la portée et l\'engagement.',
    featured: {
      title: 'Canaux suivis',
      value: '08 sources',
      detail: 'Newsletters, social, flux et partenaires santé',
    },
    links: ['Newsletters', 'Réseaux sociaux', 'Partenaires', 'Automatisations'],
  },
]
</script>

<template>
  <nav class="hidden items-center gap-3 text-sm font-semibold text-slate-500 lg:flex">
    <div v-for="item in items" :key="item.label">
      <component
        :is="item.href.startsWith('/') ? RouterLink : 'a'"
        :to="item.href.startsWith('/') ? item.href : undefined"
        :href="item.href.startsWith('/') ? undefined : item.href"
        class="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-white hover:text-slate-900"
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
