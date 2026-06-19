<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? 'inflation-ville-france'))
const pageSlug = computed(() => String(route.params.pageSlug ?? 'vue-nationale'))

type BlockType = 'bar' | 'line' | 'kpi' | 'table' | 'text'
type MockBlock = {
  id: string
  type: BlockType
  title: string
  span?: 'full' | 'half'
}

type MockPage = {
  title: string
  description: string
  parentTitle: string
  parentSlug: string
  updatedAt: string
  blocks: MockBlock[]
  relatedPages: { slug: string; title: string }[]
}

const pages: Record<string, MockPage> = {
  'vue-nationale': {
    title: 'Vue nationale',
    description: 'Tendance agrégée de l\'inflation sur la France entière avec décomposition par poste de consommation.',
    parentTitle: 'Inflation par ville en France',
    parentSlug: 'inflation-ville-france',
    updatedAt: '2026-06-10',
    blocks: [
      { id: 'k1', type: 'kpi', title: 'Inflation annuelle (mai 2026)', span: 'half' },
      { id: 'k2', type: 'kpi', title: 'Variation mensuelle', span: 'half' },
      { id: 'b1', type: 'line', title: 'Évolution de l\'IPC – 2020 à 2026', span: 'full' },
      { id: 'b2', type: 'bar', title: 'Contribution par poste de consommation', span: 'full' },
      { id: 'b3', type: 'table', title: 'Données brutes mensuelles', span: 'full' },
    ],
    relatedPages: [
      { slug: 'comparatif-villes', title: 'Comparatif villes' },
      { slug: 'serie-longue', title: 'Série longue' },
    ],
  },
  'carte-nationale': {
    title: 'Carte nationale',
    description: 'Couleur politique des communes au second tour des municipales 2026.',
    parentTitle: 'Résultats Municipales 2026',
    parentSlug: 'resultats-municipales-2026',
    updatedAt: '2026-06-18',
    blocks: [
      { id: 'k1', type: 'kpi', title: 'Communes analysées', span: 'half' },
      { id: 'k2', type: 'kpi', title: 'Taux de participation moyen', span: 'half' },
      { id: 'b1', type: 'bar', title: 'Répartition des communes par couleur politique', span: 'full' },
      { id: 'b2', type: 'table', title: 'Top 20 communes par taux de participation', span: 'full' },
    ],
    relatedPages: [
      { slug: 'participation', title: 'Participation' },
      { slug: 'bascules', title: 'Bascules politiques' },
    ],
  },
}

const fallback = pages['vue-nationale']!
const page = computed<MockPage>(() => pages[pageSlug.value] ?? fallback)

const blockIcon: Record<BlockType, string> = {
  bar: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
  line: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941',
  kpi: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  table: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125H9.375m3.75-3.75H9.375m3.75 0h-3.75M12 10.875c0 .621.504 1.125 1.125 1.125H15m-3.75 3.75h3.75m-3.75 0c0 .621-.504 1.125-1.125 1.125H9.375m3.75 0h.375a1.125 1.125 0 0 0 1.125-1.125V15m0 0h3.75',
  text: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12',
}

const mockKpiValues = ['2,8 %', '+0,2 pt', '148 231', '67,4 %']
let kpiIdx = 0

function getKpiValue(idx: number) {
  return mockKpiValues[idx % mockKpiValues.length]
}

const isCopied = ref(false)

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    isCopied.value = true
    setTimeout(() => { isCopied.value = false }, 2000)
  })
}
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-10">
      <div class="container flex flex-col gap-8">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
          <RouterLink to="/statsdata" class="hover:text-primary transition-colors">StatsData</RouterLink>
          <span>/</span>
          <RouterLink :to="`/statsdata/${slug}`" class="hover:text-primary transition-colors">
            {{ page.parentTitle }}
          </RouterLink>
          <span>/</span>
          <span class="text-slate-600">{{ page.title }}</span>
        </nav>

        <!-- Header -->
        <div class="flex flex-col gap-4 max-w-4xl">
          <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {{ page.title }}
          </h1>
          <p class="text-lg leading-8 text-slate-600">{{ page.description }}</p>
          <div class="flex items-center gap-4 text-sm text-slate-400">
            <span>Mise à jour {{ page.updatedAt }}</span>
            <button
              class="flex items-center gap-1.5 hover:text-slate-600 transition-colors"
              @click="copyLink"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              {{ isCopied ? 'Lien copié !' : 'Partager' }}
            </button>
          </div>
        </div>

        <!-- Block canvas (read-only mock) -->
        <div class="grid grid-cols-12 gap-4">
          <template v-for="(block, i) in page.blocks" :key="block.id">
            <!-- KPI block: half width -->
            <div
              v-if="block.type === 'kpi'"
              class="col-span-12 sm:col-span-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.15)]"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{{ block.title }}</p>
              <p class="mt-3 text-4xl font-bold tracking-tight text-slate-950">{{ getKpiValue(i) }}</p>
            </div>

            <!-- Other blocks: full width -->
            <div
              v-else
              class="col-span-12 rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.15)] overflow-hidden"
            >
              <div class="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <svg class="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="blockIcon[block.type]" />
                  </svg>
                </div>
                <p class="text-sm font-semibold text-slate-800">{{ block.title }}</p>
              </div>

              <!-- Chart placeholder -->
              <div v-if="block.type === 'bar' || block.type === 'line'" class="px-6 py-8">
                <div class="flex items-end gap-2 h-48">
                  <div
                    v-for="n in 8"
                    :key="n"
                    class="flex-1 rounded-t-lg bg-primary/20 transition-all"
                    :style="{ height: `${20 + (n * 11) % 80}%` }"
                  />
                </div>
                <p class="text-center text-xs text-slate-400 mt-4">Connectez un dataset pour afficher les données réelles</p>
              </div>

              <!-- Table placeholder -->
              <div v-else-if="block.type === 'table'" class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-slate-50">
                      <th v-for="col in ['Période', 'Valeur', 'Variation M-1', 'Variation A-1']" :key="col" class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="row in 5" :key="row" class="text-slate-500">
                      <td class="px-5 py-3">2026-0{{ row }}</td>
                      <td class="px-5 py-3 font-mono">{{ (100 + row * 2.3).toFixed(1) }}</td>
                      <td class="px-5 py-3 font-mono text-emerald-600">+{{ (row * 0.2).toFixed(1) }}%</td>
                      <td class="px-5 py-3 font-mono text-blue-600">+{{ (2 + row * 0.3).toFixed(1) }}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>

        <!-- Related pages -->
        <div v-if="page.relatedPages.length" class="border-t border-slate-100 pt-8">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-4">Autres pages de ce StatsData</p>
          <div class="flex flex-wrap gap-3">
            <RouterLink
              v-for="rel in page.relatedPages"
              :key="rel.slug"
              :to="`/statsdata/${slug}/${rel.slug}`"
              class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >
              {{ rel.title }}
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" />
              </svg>
            </RouterLink>
            <RouterLink
              :to="`/statsdata/${slug}`"
              class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Voir toutes les pages
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
