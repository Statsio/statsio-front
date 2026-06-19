<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

type ContentType = 'Article' | 'StatsData' | 'Sondage'
type HistoryItem = {
  id: string
  type: ContentType
  title: string
  slug: string
  viewedAt: string
  duration?: string
  thumbnail?: string
  channel?: string
}

const searchQuery = ref('')
const selectedType = ref<'Tous' | ContentType>('Tous')
const selectedPeriod = ref<'all' | 'today' | 'week' | 'month'>('all')

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    type: 'Article',
    title: 'Présidentielle 2027 : cartographie des indécis',
    slug: 'presidentielle-2027-cartographie-indecis',
    viewedAt: '2026-05-01T12:30:00Z',
    duration: '8 min',
    channel: 'Politique & Société',
  },
  {
    id: '2',
    type: 'StatsData',
    title: 'Inflation par ville en France',
    slug: 'inflation-ville-france',
    viewedAt: '2026-05-01T09:15:00Z',
    duration: '15 min',
    channel: 'Économie',
  },
  {
    id: '3',
    type: 'Sondage',
    title: 'Réforme des retraites : opinion consolidée',
    slug: 'reforme-retraites-opinion',
    viewedAt: '2026-04-30T18:45:00Z',
    duration: '5 min',
    channel: 'Baromètres',
  },
  {
    id: '4',
    type: 'Article',
    title: 'Hôpitaux : l\'impact des déserts médicaux',
    slug: 'hopitaux-deserts-medicaux',
    viewedAt: '2026-04-30T14:20:00Z',
    duration: '12 min',
    channel: 'Santé',
  },
  {
    id: '5',
    type: 'StatsData',
    title: 'Évolution du chômage par région',
    slug: 'chomage-region',
    viewedAt: '2026-04-29T16:30:00Z',
    duration: '10 min',
    channel: 'Emploi',
  },
  {
    id: '6',
    type: 'Article',
    title: 'Transition énergétique : où en est la France ?',
    slug: 'transition-energetique-france',
    viewedAt: '2026-04-28T11:00:00Z',
    duration: '14 min',
    channel: 'Environnement',
  },
  {
    id: '7',
    type: 'Sondage',
    title: 'Confiance dans les institutions',
    slug: 'confiance-institutions',
    viewedAt: '2026-04-27T15:45:00Z',
    duration: '6 min',
    channel: 'Baromètres',
  },
  {
    id: '8',
    type: 'StatsData',
    title: 'Prix de l\'immobilier : grandes villes',
    slug: 'prix-immobilier-grandes-villes',
    viewedAt: '2026-04-26T10:20:00Z',
    duration: '18 min',
    channel: 'Immobilier',
  },
]

const typeFilters: Array<'Tous' | ContentType> = ['Tous', 'Article', 'StatsData', 'Sondage']

const periodOptions = [
  { value: 'all', label: 'Tout l\'historique' },
  { value: 'today', label: 'Aujourd\'hui' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois-ci' },
]

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours} h`
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  }).format(date)
}

const getContentRoute = (item: HistoryItem): string => {
  switch (item.type) {
    case 'Article':
      return `/articles/${item.slug}`
    case 'StatsData':
      return `/statsdata/${item.slug}`
    case 'Sondage':
      return `/sondages/${item.slug}`
    default:
      return '/'
  }
}

const getTypeColor = (type: ContentType): string => {
  switch (type) {
    case 'Article':
      return 'bg-primary/10 text-primary'
    case 'StatsData':
      return 'bg-accent/15 text-accent'
    case 'Sondage':
      return 'bg-secondary/70 text-slate-900'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const filterByPeriod = (item: HistoryItem): boolean => {
  if (selectedPeriod.value === 'all') return true

  const itemDate = new Date(item.viewedAt)
  const now = new Date()
  const diffMs = now.getTime() - itemDate.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  switch (selectedPeriod.value) {
    case 'today':
      return diffDays === 0
    case 'week':
      return diffDays < 7
    case 'month':
      return diffDays < 30
    default:
      return true
  }
}

const filteredHistory = computed(() => {
  const normalizedSearch = searchQuery.value.trim().toLowerCase()

  return mockHistory.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.type.toLowerCase().includes(normalizedSearch) ||
      item.channel?.toLowerCase().includes(normalizedSearch)

    const matchesType = selectedType.value === 'Tous' || item.type === selectedType.value
    const matchesPeriod = filterByPeriod(item)

    return matchesSearch && matchesType && matchesPeriod
  })
})

const groupedHistory = computed(() => {
  const groups: Record<string, HistoryItem[]> = {}

  filteredHistory.value.forEach((item) => {
    const date = new Date(item.viewedAt)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

    let groupKey: string
    if (diffDays === 0) groupKey = 'Aujourd\'hui'
    else if (diffDays === 1) groupKey = 'Hier'
    else if (diffDays < 7) groupKey = 'Cette semaine'
    else if (diffDays < 30) groupKey = 'Ce mois-ci'
    else groupKey = 'Plus ancien'

    if (!groups[groupKey]) groups[groupKey] = []
    groups[groupKey].push(item)
  })

  return groups
})

const stats = computed(() => ({
  total: mockHistory.length,
  articles: mockHistory.filter(item => item.type === 'Article').length,
  statsdata: mockHistory.filter(item => item.type === 'StatsData').length,
  sondages: mockHistory.filter(item => item.type === 'Sondage').length,
}))

const resetFilters = () => {
  searchQuery.value = ''
  selectedType.value = 'Tous'
  selectedPeriod.value = 'all'
}

const clearHistory = () => {
  if (confirm('Voulez-vous vraiment effacer tout votre historique ? Cette action est irréversible.')) {
    alert('Fonctionnalité de suppression d\'historique à implémenter')
  }
}
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-8">
      <div class="container flex flex-col gap-8">
        <div class="flex flex-col gap-5">
          <p class="eyebrow text-primary">Mon activité</p>
          <div class="max-w-4xl">
            <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Historique
            </h1>
            <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Retrouvez tous les articles, StatsData et sondages que vous avez consultés.
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Total vus</p>
            <p class="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{{ stats.total }}</p>
          </article>
          <article class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Articles</p>
            <p class="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{{ stats.articles }}</p>
          </article>
          <article class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">StatsData</p>
            <p class="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{{ stats.statsdata }}</p>
          </article>
          <article class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Sondages</p>
            <p class="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{{ stats.sondages }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section pt-4">
      <div class="container flex flex-col gap-6">
        <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.42)] sm:p-6">
          <div class="flex flex-col gap-5">
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
              <div class="flex flex-col gap-2">
                <label for="history-search" class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Rechercher
                </label>
                <div class="flex items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-primary/30 focus-within:bg-white">
                  <svg viewBox="0 0 24 24" class="h-5 w-5 text-slate-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <input
                    id="history-search"
                    v-model="searchQuery"
                    type="search"
                    placeholder="Titre, type, chaîne..."
                    class="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <label class="flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Période</span>
                <AppSelect v-model="selectedPeriod" :options="periodOptions" aria-label="Période" />
              </label>

              <div class="flex items-end">
                <AppButton variant="outline" size="md" class="w-full" @click="clearHistory">
                  Effacer l'historique
                </AppButton>
              </div>
            </div>

            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="filter in typeFilters"
                  :key="filter"
                  type="button"
                  class="inline-flex rounded-full border px-4 py-2 text-sm font-semibold transition"
                  :class="
                    selectedType === filter
                      ? 'border-primary/20 bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  "
                  @click="selectedType = filter"
                >
                  {{ filter }}
                </button>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-slate-500">
                  {{ filteredHistory.length }} résultat{{ filteredHistory.length > 1 ? 's' : '' }}
                </span>
                <AppButton variant="ghost" size="md" @click="resetFilters">
                  Réinitialiser
                </AppButton>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredHistory.length === 0" class="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Aucun résultat</p>
          <h2 class="mt-3 text-2xl font-semibold text-slate-950">Aucun contenu trouvé</h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Aucun élément ne correspond à vos critères. Ajustez vos filtres ou explorez de nouveaux contenus.
          </p>
          <div class="mt-6">
            <AppButton variant="secondary" size="md" @click="resetFilters">
              Réinitialiser les filtres
            </AppButton>
          </div>
        </div>

        <div v-else class="flex flex-col gap-8">
          <div v-for="(items, groupName) in groupedHistory" :key="groupName" class="flex flex-col gap-4">
            <h2 class="text-lg font-semibold text-slate-950">{{ groupName }}</h2>

            <div class="grid gap-4 lg:grid-cols-2">
              <RouterLink
                v-for="item in items"
                :key="item.id"
                :to="getContentRoute(item)"
                class="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_26px_80px_-54px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/20"
              >
                <div class="flex flex-col gap-4">
                  <div class="flex items-start justify-between gap-3">
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                      :class="getTypeColor(item.type)"
                    >
                      {{ item.type }}
                    </span>
                    <span class="text-xs font-medium text-slate-400">{{ formatDate(item.viewedAt) }}</span>
                  </div>

                  <div>
                    <h3 class="text-xl font-semibold leading-tight tracking-[-0.02em] text-slate-950 group-hover:text-primary">
                      {{ item.title }}
                    </h3>
                    <div class="mt-2 flex items-center gap-3 text-sm text-slate-500">
                      <span v-if="item.channel">{{ item.channel }}</span>
                      <span v-if="item.duration">• {{ item.duration }}</span>
                    </div>
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
