<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

const navItems = [
  {
    label: 'Articles',
    href: '#',
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
    href: '#',
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
    href: '#',
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
] as const

const activeMenu = ref<(typeof navItems)[number]['label'] | null>(null)

const getItemByLabel = (label: (typeof navItems)[number]['label'] | null) =>
  navItems.find((item) => item.label === label) ?? null
</script>

<template>
  <header
    class="fixed inset-x-0 top-14 z-40 border-b border-slate-200 bg-white/80 backdrop-blur"
    @mouseleave="activeMenu = null"
  >
    <div class="container flex items-center justify-between py-1">
      <div class="flex items-center gap-4">
        <img src="@/assets/brand/statsio-logo.svg" alt="Statsio" class="h-10 w-10 rounded-xl bg-white" />
        <p class="text-primary text-xl font-bold uppercase font-mono">Stats<span class="text-accent">io</span></p>
      </div>

      <nav class="hidden items-center gap-3 text-sm font-semibold text-slate-500 lg:flex">
        <div v-for="item in navItems" :key="item.label">
          <a
            :href="item.href"
            @mouseenter="activeMenu = item.label"
            class="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-white hover:text-slate-900"
          >
            <span class="flex items-center justify-center text-slate-700">
              <svg v-if="item.icon === 'articles'" viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5 6.5C5 5.67 5.67 5 6.5 5H14L19 10V17.5C19 18.33 18.33 19 17.5 19H6.5C5.67 19 5 18.33 5 17.5V6.5Z"
                  class="fill-secondary" />
                <path d="M14 5L19 10H15.5C14.67 10 14 9.33 14 8.5V5Z" class="fill-primary" />
                <path d="M8 11.25H15.25M8 14.25H13" class="stroke-accent" stroke-width="1.7" stroke-linecap="round" />
              </svg>

              <svg v-else-if="item.icon === 'stats'" viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <rect x="4.5" y="12" width="3.5" height="7" rx="1" class="fill-accent" transform="rotate(-18 4.5 12)" />
                <rect x="10.25" y="8.75" width="3.5" height="10.25" rx="1" class="fill-primary"
                  transform="rotate(-18 10.25 8.75)" />
                <rect x="16" y="5.5" width="3.5" height="13.5" rx="1" class="fill-accent"
                  transform="rotate(-18 16 5.5)" />
              </svg>

              <svg v-else-if="item.icon === 'polls'" viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12L12 4C7.58 4 4 7.58 4 12H12Z" class="fill-primary" />
                <path d="M12 12L4 12C4 16.42 7.58 20 12 20V12Z" class="fill-secondary" />
                <path d="M12 12L17.66 6.34C16.21 4.89 14.21 4 12 4V12Z" class="fill-accent" />
              </svg>

              <svg v-else viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7" cy="8" r="2.5" class="fill-accent" />
                <circle cx="17" cy="6.5" r="2" class="fill-primary" />
                <circle cx="15.5" cy="16.5" r="2.5" class="fill-secondary" />
                <path d="M8.9 8.4L15.1 6.9M8.5 9.8L14.1 15M16.7 8.3L16 14" class="stroke-primary" stroke-width="1.6"
                  stroke-linecap="round" />
              </svg>
            </span>

            <span>{{ item.label }}</span>
          </a>
        </div>
      </nav>

      <div class="flex items-center gap-3">
        <AppButton variant="outline" size="md" class="hidden md:inline-flex">Connexion</AppButton>
        <AppButton variant="primary" size="md" icon-position="right">
          Lancez-vous !
          <template #icon>→</template>
        </AppButton>
      </div>
    </div>

    <div
      v-if="getItemByLabel(activeMenu)"
      class="absolute left-0 top-full z-30 w-full border-y border-slate-200 bg-white/95 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur"
      @mouseenter="activeMenu = activeMenu"
    >
      <div class="container grid grid-cols-[minmax(0,1.35fr)_minmax(260px,0.75fr)] gap-12 py-10">
        <div class="space-y-5">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {{ getItemByLabel(activeMenu)?.eyebrow }}
          </p>
          <div class="max-w-2xl space-y-3">
            <h3 class="text-3xl font-semibold leading-tight text-slate-950">
              {{ getItemByLabel(activeMenu)?.title }}
            </h3>
            <p class="text-base leading-7 font-medium text-slate-500">
              {{ getItemByLabel(activeMenu)?.description }}
            </p>
          </div>

          <div class="grid max-w-3xl grid-cols-2 gap-4">
            <a
              v-for="link in getItemByLabel(activeMenu)?.links"
              :key="link"
              href="#"
              class="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-white hover:text-slate-950"
            >
              {{ link }}
            </a>
          </div>
        </div>

        <aside class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            {{ getItemByLabel(activeMenu)?.featured.title }}
          </p>
          <p class="mt-4 text-4xl font-semibold">{{ getItemByLabel(activeMenu)?.featured.value }}</p>
          <p class="mt-3 max-w-xs text-sm leading-6 text-slate-300">
            {{ getItemByLabel(activeMenu)?.featured.detail }}
          </p>

          <div class="mt-8 rounded-3xl bg-white/10 p-4">
            <div class="flex items-end gap-2">
              <div class="h-10 w-3 rounded-full bg-accent"></div>
              <div class="h-16 w-3 rounded-full bg-primary"></div>
              <div class="h-24 w-3 rounded-full bg-white"></div>
              <div class="h-12 w-3 rounded-full bg-primary/70"></div>
            </div>
            <p class="mt-4 text-xs uppercase tracking-[0.22em] text-slate-400">Vue synthétique</p>
          </div>
        </aside>
      </div>
    </div>
  </header>
</template>
