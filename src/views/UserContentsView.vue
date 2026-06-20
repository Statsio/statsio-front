<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { fetchUserStatsDataDocuments, type StatsDataDocument } from '@/api/studio'

const auth = useAuthStore()

type StatusFilter = 'all' | 'published' | 'draft'

const activeTab = ref<StatusFilter>('all')
const searchQuery = ref('')
const loading = ref(true)
const docs = ref<StatsDataDocument[]>([])

onMounted(async () => {
  try {
    docs.value = await fetchUserStatsDataDocuments()
  } finally {
    loading.value = false
  }
})

const tabs: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
]

const filtered = computed(() => {
  let list = activeTab.value === 'all'
    ? docs.value
    : docs.value.filter((c) => (c.status ?? 'draft') === activeTab.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((c) => c.title.toLowerCase().includes(q))
  }
  return list
})

const statusBadge: Record<string, { label: string; classes: string }> = {
  published: { label: 'Publié',    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  draft:     { label: 'Brouillon', classes: 'bg-amber-50  text-amber-700  border-amber-200'   },
}

function getBadge(status?: string): { label: string; classes: string } {
  return statusBadge[status ?? 'draft'] ?? statusBadge['draft']!
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const stats = computed(() => ({
  total:     docs.value.length,
  published: docs.value.filter((c) => c.status === 'published').length,
  draft:     docs.value.filter((c) => !c.status || c.status === 'draft').length,
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
        <div v-if="!loading" class="grid grid-cols-3 gap-4 max-w-lg">
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

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-32">
          <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <template v-else>
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
                    :to="content.slug ? `/statsdata/${content.slug}` : `/studio/${content.id}`"
                    class="text-sm font-semibold text-slate-900 hover:text-primary transition-colors truncate"
                  >
                    {{ content.title }}
                  </RouterLink>
                  <span
                    class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0"
                    :class="getBadge(content.status).classes"
                  >
                    {{ getBadge(content.status).label }}
                  </span>
                </div>
                <div class="flex items-center gap-4 mt-1.5 text-[11px] text-slate-400">
                  <span v-if="content.pages?.length">{{ content.pages.length }} page{{ content.pages.length > 1 ? 's' : '' }}</span>
                  <span v-if="content.sections?.length">{{ content.sections.length }} section{{ content.sections.length > 1 ? 's' : '' }}</span>
                  <span v-if="content.slug" class="font-mono">{{ content.slug }}</span>
                  <span>MAJ {{ formatDate((content as any).updated_at) }}</span>
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

            <!-- Empty states -->
            <div v-if="!filtered.length && !docs.length" class="py-20 text-center">
              <p class="text-slate-400 text-sm mb-4">Vous n'avez pas encore créé de contenu.</p>
              <AppButton as="router-link" to="/studio" variant="primary" size="sm">
                Créer mon premier StatsData
              </AppButton>
            </div>
            <div v-else-if="!filtered.length" class="py-16 text-center text-slate-400">
              <p class="text-sm">Aucun contenu ne correspond à votre recherche.</p>
            </div>
          </div>
        </template>
      </div>
    </section>
  </main>
</template>
