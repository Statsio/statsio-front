<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? 'inflation-ville-france'))

type PageSummary = { slug: string; title: string; description: string }
type StatsDataDetail = {
  slug: string
  title: string
  description: string
  longDescription: string
  theme: string
  rowCount: number
  columnCount: number
  lastUpdated: string
  source: string
  license: string
  channel: string
  pages: PageSummary[]
  columns: { name: string; type: string; description: string }[]
}

const catalog: Record<string, StatsDataDetail> = {
  'inflation-ville-france': {
    slug: 'inflation-ville-france',
    title: 'Inflation par ville en France',
    description: 'Suivi mensuel de l\'inflation au niveau communal depuis 2020.',
    longDescription: 'Cette base couvre l\'évolution de l\'indice des prix à la consommation pour 1 200 communes françaises sur la période 2020–2026. Les données sont issues des relevés mensuels de l\'INSEE, enrichis de corrections saisonnières et de comparaisons avec le panier européen harmonisé (IPCH).',
    theme: 'Économie',
    rowCount: 148_230,
    columnCount: 12,
    lastUpdated: '2026-06-10',
    source: 'INSEE – Indices des prix à la consommation',
    license: 'Licence Ouverte v2.0',
    channel: 'Économie & Finance',
    pages: [
      { slug: 'vue-nationale', title: 'Vue nationale', description: 'Tendance agrégée sur la France entière avec décomposition par poste.' },
      { slug: 'comparatif-villes', title: 'Comparatif villes', description: 'Classement et comparateur interactif entre communes.' },
      { slug: 'serie-longue', title: 'Série longue', description: 'Évolution de 2015 à aujourd\'hui en base 100.' },
    ],
    columns: [
      { name: 'commune_code', type: 'string', description: 'Code INSEE de la commune' },
      { name: 'commune_name', type: 'string', description: 'Nom de la commune' },
      { name: 'period', type: 'date', description: 'Mois de relevé (YYYY-MM)' },
      { name: 'ipc', type: 'float', description: 'Indice des prix à la consommation (base 100 = 2020)' },
      { name: 'variation_m1', type: 'float', description: 'Variation par rapport au mois précédent (%)' },
      { name: 'variation_y1', type: 'float', description: 'Variation sur 12 mois glissants (%)' },
    ],
  },
  'resultats-municipales-2026': {
    slug: 'resultats-municipales-2026',
    title: 'Résultats Municipales 2026',
    description: 'Base complète des résultats par commune, tour par tour.',
    longDescription: 'Résultats officiels des élections municipales 2026 pour l\'ensemble des communes de France métropolitaine et d\'outre-mer. La base comprend les deux tours, les listes en présence, les scores et les taux de participation. Source : Ministère de l\'Intérieur.',
    theme: 'Politique',
    rowCount: 36_000,
    columnCount: 18,
    lastUpdated: '2026-06-18',
    source: 'Ministère de l\'Intérieur – Résultats électoraux',
    license: 'Licence Ouverte v2.0',
    channel: 'Politique & Société',
    pages: [
      { slug: 'carte-nationale', title: 'Carte nationale', description: 'Couleur politique des communes au second tour.' },
      { slug: 'participation', title: 'Participation', description: 'Taux de participation par département et commune.' },
      { slug: 'resultats-commune', title: 'Résultats par commune', description: 'Recherche et détail commune par commune.' },
      { slug: 'bascules', title: 'Bascules politiques', description: 'Communes ayant changé de majorité depuis 2020.' },
      { slug: 'profils-listes', title: 'Profils des listes', description: 'Étiquette, score et nombre de candidats par liste.' },
    ],
    columns: [
      { name: 'code_commune', type: 'string', description: 'Code INSEE de la commune' },
      { name: 'libelle_commune', type: 'string', description: 'Nom de la commune' },
      { name: 'departement', type: 'string', description: 'Département' },
      { name: 'tour', type: 'integer', description: 'Numéro du tour (1 ou 2)' },
      { name: 'liste_label', type: 'string', description: 'Étiquette politique de la liste' },
      { name: 'voix', type: 'integer', description: 'Nombre de voix obtenues' },
      { name: 'pct_exprimes', type: 'float', description: 'Part des exprimés (%)' },
      { name: 'participation', type: 'float', description: 'Taux de participation (%)' },
    ],
  },
}

const fallbackSlug = 'inflation-ville-france'
const detail = computed<StatsDataDetail>(
  () => catalog[slug.value] ?? catalog[fallbackSlug]!,
)

const themeColor: Record<string, string> = {
  Économie: 'bg-blue-50 text-blue-600',
  Politique: 'bg-violet-50 text-violet-600',
  Santé: 'bg-emerald-50 text-emerald-700',
  Climat: 'bg-teal-50 text-teal-700',
  Démographie: 'bg-orange-50 text-orange-600',
  Société: 'bg-rose-50 text-rose-600',
}

const columnTypeColor: Record<string, string> = {
  string: 'bg-slate-100 text-slate-500',
  integer: 'bg-blue-50 text-blue-600',
  float: 'bg-cyan-50 text-cyan-600',
  date: 'bg-green-50 text-green-700',
}

const formatRows = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-10">
      <div class="container flex flex-col gap-10">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-slate-400">
          <RouterLink to="/statsdata" class="hover:text-primary transition-colors">StatsData</RouterLink>
          <span>/</span>
          <span class="text-slate-600">{{ detail.title }}</span>
        </nav>

        <!-- Header -->
        <div class="flex flex-col gap-5">
          <div class="flex items-center gap-3">
            <span
              class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              :class="themeColor[detail.theme] ?? 'bg-slate-100 text-slate-500'"
            >
              {{ detail.theme }}
            </span>
            <span class="text-sm text-slate-400">{{ detail.channel }}</span>
          </div>
          <div class="flex max-w-5xl flex-col gap-4">
            <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              {{ detail.title }}
            </h1>
            <p class="max-w-3xl text-lg leading-8 text-slate-600">{{ detail.longDescription }}</p>
          </div>

          <!-- Key figures -->
          <div class="grid gap-4 sm:grid-cols-4 mt-2">
            <div class="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.15)]">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Lignes</p>
              <p class="mt-2 text-2xl font-semibold text-slate-950">{{ formatRows(detail.rowCount) }}</p>
            </div>
            <div class="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.15)]">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Colonnes</p>
              <p class="mt-2 text-2xl font-semibold text-slate-950">{{ detail.columnCount }}</p>
            </div>
            <div class="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.15)]">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Pages</p>
              <p class="mt-2 text-2xl font-semibold text-slate-950">{{ detail.pages.length }}</p>
            </div>
            <div class="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.15)]">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mise à jour</p>
              <p class="mt-2 text-lg font-semibold text-slate-950">{{ detail.lastUpdated }}</p>
            </div>
          </div>
        </div>

        <!-- Content grid -->
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-start">
          <div class="flex flex-col gap-8">
            <!-- Pages -->
            <div class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.15)]">
              <div class="border-b border-slate-100 px-7 py-5">
                <h2 class="text-base font-bold text-slate-900">Pages d'exploration</h2>
              </div>
              <div class="divide-y divide-slate-100">
                <RouterLink
                  v-for="page in detail.pages"
                  :key="page.slug"
                  :to="`/statsdata/${detail.slug}/${page.slug}`"
                  class="group flex items-center gap-4 px-7 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">{{ page.title }}</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ page.description }}</p>
                  </div>
                  <svg class="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" />
                  </svg>
                </RouterLink>
              </div>
            </div>

            <!-- Schema -->
            <div class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_12px_40px_-20px_rgba(15,23,42,0.12)]">
              <div class="border-b border-slate-100 px-7 py-5">
                <h2 class="text-base font-bold text-slate-900">Schéma des données</h2>
                <p class="text-xs text-slate-400 mt-0.5">{{ detail.columnCount }} colonnes au total — aperçu des principales</p>
              </div>
              <div class="divide-y divide-slate-100">
                <div
                  v-for="col in detail.columns"
                  :key="col.name"
                  class="flex items-center gap-4 px-7 py-3"
                >
                  <span class="font-mono text-sm text-slate-700 shrink-0 w-44 truncate">{{ col.name }}</span>
                  <span
                    class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded shrink-0"
                    :class="columnTypeColor[col.type] ?? 'bg-slate-100 text-slate-400'"
                  >{{ col.type }}</span>
                  <span class="text-xs text-slate-500 truncate">{{ col.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <aside class="flex flex-col gap-4">
            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-4">Informations</p>
              <dl class="flex flex-col gap-3">
                <div>
                  <dt class="text-[11px] text-slate-400 uppercase tracking-wider">Source</dt>
                  <dd class="text-sm text-slate-700 mt-0.5">{{ detail.source }}</dd>
                </div>
                <div>
                  <dt class="text-[11px] text-slate-400 uppercase tracking-wider">Licence</dt>
                  <dd class="text-sm text-slate-700 mt-0.5">{{ detail.license }}</dd>
                </div>
                <div>
                  <dt class="text-[11px] text-slate-400 uppercase tracking-wider">Dernière mise à jour</dt>
                  <dd class="text-sm text-slate-700 mt-0.5">{{ detail.lastUpdated }}</dd>
                </div>
              </dl>
              <AppButton as="router-link" :to="`/statsdata/${detail.slug}/${detail.pages[0]?.slug}`" variant="primary" size="sm" class="mt-5 w-full justify-center">
                Ouvrir la première page
              </AppButton>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </main>
</template>
