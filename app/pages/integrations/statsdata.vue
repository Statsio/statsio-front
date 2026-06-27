<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Intégration StatsData',
  robots: 'noindex,nofollow',
})
import { computed, ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { fetchPublicStatsDataCatalog, type StatsDataDocument } from '@/api/studio'

const loading = ref(true)
const docs = ref<StatsDataDocument[]>([])
const searchQuery = ref('')

onMounted(async () => {
  try {
    docs.value = await fetchPublicStatsDataCatalog()
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  if (!searchQuery.value.trim()) return docs.value
  const q = searchQuery.value.toLowerCase()
  return docs.value.filter((d: StatsDataDocument) => d.title.toLowerCase().includes(q))
})

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function firstPageLink(doc: StatsDataDocument) {
  if (!doc.slug) return `/statsdata/${doc.id}` // fallback for old docs without slug
  if (doc.pages && doc.pages.length > 0) {
    const first = doc.pages[0]!
    return `/statsdata/${doc.slug}/${first.slug ?? first.id}`
  }
  return `/statsdata/${doc.slug}`
}

const editorialPoints = [
  { title: 'Données sourcées', detail: 'Chaque StatsData référence ses sources primaires et le protocole de collecte utilisé.' },
  { title: 'Mises à jour continues', detail: 'Les bases sont enrichies au fil des nouvelles publications sans perdre l\'historique.' },
  { title: 'Pages thématiques', detail: 'Un StatsData peut comporter plusieurs pages avec des angles d\'analyse distincts.' },
]
</script>

<template>
  <main class="pb-24 pt-4">
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

          <!-- Search -->
          <div class="relative w-full max-w-sm">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher dans le catalogue…"
              class="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-24">
            <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>

          <template v-else>
            <!-- Grid -->
            <div v-if="filtered.length > 0" class="grid gap-4 sm:grid-cols-2">
              <RouterLink
                v-for="doc in filtered"
                :key="doc.id"
                :to="firstPageLink(doc)"
                class="group flex flex-col gap-4 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.2)] transition-all hover:shadow-[0_20px_60px_-28px_rgba(15,23,42,0.3)] hover:-translate-y-0.5"
              >
                <div class="flex items-start justify-between gap-3">
                  <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                    StatsData
                  </span>
                  <span class="text-[11px] text-slate-400">
                    {{ (doc.pages?.length ?? 0) + 1 }} page{{ ((doc.pages?.length ?? 0) + 1) > 1 ? 's' : '' }}
                  </span>
                </div>

                <div class="flex flex-col gap-2">
                  <h2 class="text-base font-semibold leading-snug text-slate-900 group-hover:text-primary transition-colors">
                    {{ doc.title }}
                  </h2>
                  <p v-if="doc.slug" class="text-[11px] font-mono text-slate-400">{{ doc.slug }}</p>
                </div>

                <div class="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <span>{{ (doc.sections ?? []).length }} section{{ (doc.sections ?? []).length > 1 ? 's' : '' }}</span>
                  <span>MAJ {{ formatDate((doc as any).updated_at) }}</span>
                </div>
              </RouterLink>
            </div>

            <!-- Empty catalog -->
            <div v-else class="py-20 text-center">
              <svg class="w-12 h-12 mx-auto mb-4 opacity-20 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              <p class="text-slate-400 text-sm">
                {{ searchQuery ? 'Aucun résultat pour cette recherche.' : 'Aucun StatsData publié pour le moment.' }}
              </p>
            </div>
          </template>
        </div>

        <!-- Sidebar -->
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

          <!-- Live count -->
          <div v-if="!loading" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Dans le catalogue</p>
            <p class="mt-2 text-3xl font-bold text-slate-950">{{ docs.length }}</p>
            <p class="text-sm text-slate-500 mt-1">dataset{{ docs.length > 1 ? 's' : '' }} publié{{ docs.length > 1 ? 's' : '' }}</p>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
