<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'

type StatsDataItem = {
  id: string
  slug: string
  title: string
  description: string
  theme: string
  rowCount: number
  updatedAt: string
  pagesCount: number
  channel: string
}

const filters = ['Tous', 'Économie', 'Politique', 'Santé', 'Société', 'Climat', 'Démographie']
const activeFilter = ref('Tous')

const mockStatsData: StatsDataItem[] = [
  {
    id: '1',
    slug: 'inflation-ville-france',
    title: 'Inflation par ville en France',
    description: 'Suivi mensuel de l\'inflation au niveau communal depuis 2020, croisé avec les indices INSEE et les relevés locaux.',
    theme: 'Économie',
    rowCount: 148_230,
    updatedAt: '2026-06-10',
    pagesCount: 3,
    channel: 'Économie & Finance',
  },
  {
    id: '2',
    slug: 'resultats-municipales-2026',
    title: 'Résultats Municipales 2026',
    description: 'Base complète des résultats par commune, tour par tour, avec taux de participation et scores par liste.',
    theme: 'Politique',
    rowCount: 36_000,
    updatedAt: '2026-06-18',
    pagesCount: 5,
    channel: 'Politique & Société',
  },
  {
    id: '3',
    slug: 'esperance-vie-departement',
    title: 'Espérance de vie par département',
    description: 'Séries longues de l\'espérance de vie à la naissance et à 65 ans, désagrégées par sexe et territoire.',
    theme: 'Santé',
    rowCount: 9_880,
    updatedAt: '2026-05-28',
    pagesCount: 2,
    channel: 'Santé Publique',
  },
  {
    id: '4',
    slug: 'emissions-co2-secteurs',
    title: 'Émissions CO₂ par secteur',
    description: 'Inventaire national des émissions de gaz à effet de serre ventilé par secteur d\'activité et par année.',
    theme: 'Climat',
    rowCount: 24_500,
    updatedAt: '2026-04-15',
    pagesCount: 4,
    channel: 'Environnement',
  },
  {
    id: '5',
    slug: 'population-active-region',
    title: 'Population active par région',
    description: 'Structure de la population active, taux d\'emploi et chômage par tranche d\'âge et niveau d\'étude.',
    theme: 'Démographie',
    rowCount: 62_000,
    updatedAt: '2026-03-20',
    pagesCount: 3,
    channel: 'Économie & Finance',
  },
  {
    id: '6',
    slug: 'satisfaction-services-publics',
    title: 'Satisfaction envers les services publics',
    description: 'Résultats agrégés des baromètres de satisfaction administrés par les collectivités et l\'État.',
    theme: 'Société',
    rowCount: 15_200,
    updatedAt: '2026-06-01',
    pagesCount: 2,
    channel: 'Institutions',
  },
]

const filtered = computed(() =>
  activeFilter.value === 'Tous'
    ? mockStatsData
    : mockStatsData.filter((d) => d.theme === activeFilter.value),
)

const formatRows = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M lignes`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k lignes`
  return `${n} lignes`
}

const themeColor: Record<string, string> = {
  Économie: 'bg-blue-50 text-blue-600',
  Politique: 'bg-violet-50 text-violet-600',
  Santé: 'bg-emerald-50 text-emerald-700',
  Climat: 'bg-teal-50 text-teal-700',
  Démographie: 'bg-orange-50 text-orange-600',
  Société: 'bg-rose-50 text-rose-600',
}

const editorialPoints = [
  { title: 'Données sourcées', detail: 'Chaque StatsData référence ses sources primaires et le protocole de collecte utilisé.' },
  { title: 'Mises à jour continues', detail: 'Les bases sont enrichies au fil des nouvelles publications sans perdre l\'historique.' },
  { title: 'Pages thématiques', detail: 'Un StatsData peut comporter plusieurs pages avec des angles d\'analyse distincts.' },
]
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-10">
      <div class="container grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-start">
        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-5">
            <p class="eyebrow text-primary">Données & indicateurs</p>
            <div class="flex max-w-4xl flex-col gap-4">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Des bases de données lisibles, sourcées et prêtes à analyser.
              </h1>
              <p class="max-w-3xl text-lg leading-8 text-slate-600">
                StatsData rassemble des jeux de données vérifiés, des séries longues et des indicateurs territoriaux.
                Chaque entrée est enrichie de pages d'analyse et de comparateurs interactifs.
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="f in filters"
              :key="f"
              class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
              :class="activeFilter === f
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'"
              @click="activeFilter = f"
            >
              {{ f }}
            </button>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <RouterLink
              v-for="item in filtered"
              :key="item.id"
              :to="`/statsdata/${item.slug}`"
              class="group flex flex-col gap-4 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.2)] transition-all hover:shadow-[0_20px_60px_-28px_rgba(15,23,42,0.3)] hover:-translate-y-0.5"
            >
              <div class="flex items-start justify-between gap-3">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  :class="themeColor[item.theme] ?? 'bg-slate-100 text-slate-500'"
                >
                  {{ item.theme }}
                </span>
                <span class="text-[11px] text-slate-400">{{ formatRows(item.rowCount) }}</span>
              </div>

              <div class="flex flex-col gap-2">
                <h2 class="text-base font-semibold leading-snug text-slate-900 group-hover:text-primary transition-colors">
                  {{ item.title }}
                </h2>
                <p class="text-sm leading-6 text-slate-500 line-clamp-2">{{ item.description }}</p>
              </div>

              <div class="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                <span>{{ item.pagesCount }} page{{ item.pagesCount > 1 ? 's' : '' }}</span>
                <span>MAJ {{ item.updatedAt }}</span>
              </div>
            </RouterLink>
          </div>

          <div v-if="!filtered.length" class="py-16 text-center text-slate-400">
            Aucun dataset pour ce filtre.
          </div>
        </div>

        <aside class="flex flex-col gap-4">
          <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Format StatsData</p>
            <div class="mt-5 flex flex-col gap-5">
              <div
                v-for="item in editorialPoints"
                :key="item.title"
                class="rounded-[1.5rem] bg-white/8 p-4"
              >
                <p class="text-sm font-semibold text-white">{{ item.title }}</p>
                <p class="mt-1 text-xs leading-5 text-slate-400">{{ item.detail }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Publier un dataset</p>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              Importez un CSV, XLSX ou JSON. Statsio génère automatiquement le schéma, l'aperçu et les pages d'exploration.
            </p>
            <AppButton as="router-link" to="/contenus" variant="primary" size="sm" class="mt-4 w-full justify-center">
              Accéder à mes contenus
            </AppButton>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
