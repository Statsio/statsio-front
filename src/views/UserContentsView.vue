<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

type ContentStatus = 'published' | 'draft' | 'archived'
type ContentType = 'statsdata'

type UserContent = {
  id: string
  slug: string
  title: string
  description: string
  type: ContentType
  status: ContentStatus
  rowCount?: number
  pagesCount: number
  updatedAt: string
}

const activeTab = ref<'all' | ContentStatus>('all')
const searchQuery = ref('')

const mockContents: UserContent[] = [
  {
    id: '1',
    slug: 'inflation-ville-france',
    title: 'Inflation par ville en France',
    description: 'Suivi mensuel de l\'inflation au niveau communal depuis 2020.',
    type: 'statsdata',
    status: 'published',
    rowCount: 148_230,
    pagesCount: 3,
    updatedAt: '2026-06-10',
  },
  {
    id: '2',
    slug: 'analyse-emploi-2026',
    title: 'Analyse emploi Q1 2026',
    description: 'Données d\'emploi et chômage par secteur pour le premier trimestre 2026.',
    type: 'statsdata',
    status: 'draft',
    rowCount: 22_400,
    pagesCount: 1,
    updatedAt: '2026-06-15',
  },
  {
    id: '3',
    slug: 'budget-communes-2025',
    title: 'Budgets communaux 2025',
    description: 'Recettes et dépenses des communes de plus de 5 000 habitants.',
    type: 'statsdata',
    status: 'published',
    rowCount: 8_900,
    pagesCount: 2,
    updatedAt: '2026-05-20',
  },
  {
    id: '4',
    slug: 'mobilite-travail-france',
    title: 'Mobilité domicile-travail',
    description: 'Distances et modes de transport des actifs par zone d\'emploi.',
    type: 'statsdata',
    status: 'archived',
    rowCount: 54_000,
    pagesCount: 2,
    updatedAt: '2026-03-01',
  },
]

const tabs: { value: typeof activeTab.value; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'archived', label: 'Archivés' },
]

const filtered = computed(() => {
  let list = activeTab.value === 'all'
    ? mockContents
    : mockContents.filter((c) => c.status === activeTab.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
  }
  return list
})

const statusBadge: Record<ContentStatus, { label: string; classes: string }> = {
  published: { label: 'Publié', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  draft: { label: 'Brouillon', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  archived: { label: 'Archivé', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
}

const formatRows = (n?: number) => {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M lignes`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k lignes`
  return `${n} lignes`
}

const stats = computed(() => ({
  total: mockContents.length,
  published: mockContents.filter((c) => c.status === 'published').length,
  draft: mockContents.filter((c) => c.status === 'draft').length,
}))
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-10">
      <div class="container flex flex-col gap-8">
        <!-- Header -->
        <div class="flex flex-col gap-4">
          <p class="eyebrow text-primary">Espace éditorial</p>
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex flex-col gap-1">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Mes contenus
              </h1>
              <p class="text-lg text-slate-600">
                Bonjour {{ auth.user?.profile?.first_name ?? 'vous' }}, retrouvez ici tous vos datasets et pages d'exploration.
              </p>
            </div>
            <AppButton as="router-link" to="/studio" variant="primary" size="md">
              <svg class="w-4 h-4 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nouveau StatsData
            </AppButton>
          </div>
        </div>

        <!-- KPI row -->
        <div class="grid grid-cols-3 gap-4 max-w-lg">
          <div class="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
            <p class="mt-1.5 text-2xl font-bold text-slate-950">{{ stats.total }}</p>
          </div>
          <div class="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Publiés</p>
            <p class="mt-1.5 text-2xl font-bold text-emerald-600">{{ stats.published }}</p>
          </div>
          <div class="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Brouillons</p>
            <p class="mt-1.5 text-2xl font-bold text-amber-600">{{ stats.draft }}</p>
          </div>
        </div>

        <!-- Search + tabs -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex gap-1 bg-slate-100 rounded-xl p-1 self-start">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              :class="activeTab === tab.value
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'"
              @click="activeTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="relative w-full sm:w-64">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher un contenu…"
              class="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <!-- Content list -->
        <div class="flex flex-col gap-3">
          <div
            v-for="content in filtered"
            :key="content.id"
            class="group flex items-center gap-5 rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5 shadow-sm hover:shadow-[0_12px_40px_-20px_rgba(15,23,42,0.15)] transition-all"
          >
            <!-- Icon -->
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <RouterLink
                  :to="`/statsdata/${content.slug}`"
                  class="text-sm font-semibold text-slate-900 hover:text-primary transition-colors truncate"
                >
                  {{ content.title }}
                </RouterLink>
                <span
                  class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0"
                  :class="statusBadge[content.status].classes"
                >
                  {{ statusBadge[content.status].label }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5 truncate">{{ content.description }}</p>
              <div class="flex items-center gap-4 mt-1.5 text-[11px] text-slate-400">
                <span>{{ formatRows(content.rowCount) }}</span>
                <span>{{ content.pagesCount }} page{{ content.pagesCount > 1 ? 's' : '' }}</span>
                <span>MAJ {{ content.updatedAt }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <RouterLink
                :to="`/studio/${content.id}`"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Studio
              </RouterLink>
              <RouterLink
                :to="`/statsdata/${content.id}/proprietes`"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Propriétés
              </RouterLink>
            </div>
          </div>

          <div v-if="!filtered.length" class="py-16 text-center text-slate-400">
            <p class="text-sm">Aucun contenu ne correspond à votre recherche.</p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
