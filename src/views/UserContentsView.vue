<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppOpenStudioButton from '@/components/statsdata/AppOpenStudioButton.vue'
import StatsDataCardDropdown from '@/components/statsdata/StatsDataCardDropdown.vue'
import { useAuthStore } from '@/stores/auth'
import { fetchStatsDataDocuments, deleteStatsDataDocument, fetchTrashedStatsDataDocuments, restoreStatsDataDocument, forceDeleteStatsDataDocument } from '@/api/statsdata-documents'
import type { StatsDataDocumentListItemDto } from '@/types/statsdata-document-api'

type ContentType = 'StatsData'
type ContentStatus = 'Publié'
type ContentVisibility = 'Public' | 'Privé' | 'Équipe'

type UserContentItem = {
  id: string
  type: ContentType
  title: string
  status: ContentStatus
  visibility: ContentVisibility
  to: string
  editTo: string
  settingsTo: string
  actionLabel: string
  createdAtIso: string
  updatedAtIso: string
  createdByLabel: string
  slug: string
}

const authStore = useAuthStore()
const searchQuery = ref('')
const selectedType = ref<'Tous' | ContentType>('Tous')
const selectedStatus = ref<'Tous' | ContentStatus>('Tous')
const selectedVisibility = ref<'Tous' | ContentVisibility>('Tous')
const selectedSort = ref<'recent' | 'alphabetical' | 'type'>('recent')
const viewMode = ref<'active' | 'trash'>('active')

const isLoading = ref(true)
const loadError = ref<string | null>(null)
const contentItems = ref<UserContentItem[]>([])
const trashedItems = ref<UserContentItem[]>([])

function formatIso(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function mapVisibility(v: StatsDataDocumentListItemDto['visibility']): ContentVisibility {
  if (v === 'private') return 'Privé'
  if (v === 'team') return 'Équipe'
  return 'Public'
}

function createdByLabel(doc: StatsDataDocumentListItemDto): string {
  const by = doc.created_by
  if (!by) return '—'
  const first = (by.first_name ?? '').trim()
  const last = (by.last_name ?? '').trim()
  const full = `${first} ${last}`.trim()
  return full || (by.email ?? '—')
}

function toContentItem(doc: StatsDataDocumentListItemDto): UserContentItem {
  return {
    id: doc.id,
    type: 'StatsData',
    title: doc.title || '(Sans titre)',
    status: 'Publié',
    visibility: mapVisibility(doc.visibility),
    to: doc.slug ? `/statsdata/${doc.slug}` : `/statsdata`,
    editTo: `/studio/statsdata/${doc.id}`,
    settingsTo: `/statsdata/${doc.id}/proprietes`,
    actionLabel: 'Ouvrir',
    createdAtIso: doc.created_at,
    updatedAtIso: doc.updated_at,
    createdByLabel: createdByLabel(doc),
    slug: doc.slug,
  }
}

async function loadContents() {
  isLoading.value = true
  loadError.value = null
  try {
    const docs = await fetchStatsDataDocuments()
    contentItems.value = docs.map(toContentItem)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    contentItems.value = []
  } finally {
    isLoading.value = false
  }
}

async function loadTrashedContents() {
  isLoading.value = true
  loadError.value = null
  try {
    const docs = await fetchTrashedStatsDataDocuments()
    trashedItems.value = docs.map(toContentItem)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    trashedItems.value = []
  } finally {
    isLoading.value = false
  }
}

async function handleMoveToTrash(itemId: string) {
  if (!confirm('Voulez-vous vraiment mettre ce contenu à la corbeille ?')) return

  try {
    await deleteStatsDataDocument(itemId)
    await loadContents()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Erreur lors de la suppression')
  }
}

async function handleRestore(itemId: string) {
  try {
    await restoreStatsDataDocument(itemId)
    await loadTrashedContents()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Erreur lors de la restauration')
  }
}

async function handleForceDelete(itemId: string) {
  if (!confirm('Voulez-vous vraiment supprimer définitivement ce contenu ? Cette action est irréversible.')) return

  try {
    await forceDeleteStatsDataDocument(itemId)
    await loadTrashedContents()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Erreur lors de la suppression définitive')
  }
}

onMounted(() => void loadContents())

const createActions = [
  {
    title: 'Nouvel article',
    detail: 'Lancer un format éditorial à partir d’un angle ou d’un signal.',
    to: '/articles',
  },
  {
    title: 'Nouveau sondage',
    detail: 'Préparer une nouvelle vague de réponses et qualifier une audience.',
    to: '/sondages',
  },
  {
    title: 'Nouveau StatsData',
    detail: 'Structurer une base de données exploitable et partageable.',
    to: '/statsdata',
  },
]

const typeFilters: Array<'Tous' | ContentType> = ['Tous', 'StatsData']
const statusOptions: Array<'Tous' | ContentStatus> = ['Tous', 'Publié']
const visibilityOptions: Array<'Tous' | ContentVisibility> = ['Tous', 'Public', 'Privé', 'Équipe']

const statusSelectOptions = computed(() => statusOptions.map((s) => ({ value: s, label: s })))
const visibilitySelectOptions = computed(() => visibilityOptions.map((v) => ({ value: v, label: v })))
const sortSelectOptions = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'alphabetical', label: 'Alphabétique' },
  { value: 'type', label: 'Type de contenu' },
]

const filteredContentItems = computed(() => {
  const items = viewMode.value === 'active' ? contentItems.value : trashedItems.value
  const normalizedSearch = searchQuery.value.trim().toLowerCase()

  const filtered = items.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.type.toLowerCase().includes(normalizedSearch)

    const matchesType = selectedType.value === 'Tous' || item.type === selectedType.value
    const matchesStatus = selectedStatus.value === 'Tous' || item.status === selectedStatus.value
    const matchesVisibility =
      selectedVisibility.value === 'Tous' || item.visibility === selectedVisibility.value

    return matchesSearch && matchesType && matchesStatus && matchesVisibility
  })

  if (selectedSort.value === 'alphabetical') {
    return [...filtered].sort((left, right) => left.title.localeCompare(right.title, 'fr'))
  }

  if (selectedSort.value === 'type') {
    return [...filtered].sort((left, right) => left.type.localeCompare(right.type, 'fr'))
  }

  return filtered
})

const counters = computed(() => {
  const total = contentItems.value.length
  const published = contentItems.value.filter((item) => item.status === 'Publié').length

  return [
    { label: 'Total contenus', value: String(total) },
    { label: 'Publiés', value: String(published) },
    { label: 'Brouillons', value: '—' },
    { label: 'En revue', value: '—' },
  ]
})

const resultLabel = computed(() => {
  const count = filteredContentItems.value.length

  return `${count} contenu${count > 1 ? 's' : ''}`
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedType.value = 'Tous'
  selectedStatus.value = 'Tous'
  selectedVisibility.value = 'Tous'
  selectedSort.value = 'recent'
}
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-8">
      <div class="container flex flex-col gap-8">
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
          <div class="flex flex-col gap-5">
            <p class="eyebrow text-primary">Studio créateur</p>
            <div class="max-w-4xl">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Mes contenus
              </h1>
              <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                Retrouvez tous vos articles, sondages et StatsData dans une seule vue pour chercher, filtrer,
                reprendre et publier plus vite.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span class="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700">
                {{ authStore.displayName }}
              </span>
              <span>Organisation claire, reprise rapide, actions directes.</span>
            </div>
          </div>

          <aside class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_28px_80px_-48px_rgba(15,23,42,0.55)]">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ajouter un contenu</p>
            <div class="mt-5 flex flex-col gap-3">
              <RouterLink
                v-for="action in createActions"
                :key="action.title"
                :to="action.to"
                class="group rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-base font-semibold text-white">{{ action.title }}</p>
                    <p class="mt-2 text-sm leading-6 text-slate-300">{{ action.detail }}</p>
                  </div>
                  <span class="pt-0.5 text-lg text-white transition group-hover:translate-x-0.5">+</span>
                </div>
              </RouterLink>
            </div>
          </aside>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="counter in counters"
            :key="counter.label"
            class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ counter.label }}</p>
            <p class="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{{ counter.value }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section pt-4">
      <div class="container flex flex-col gap-6">
        <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-58px_rgba(15,23,42,0.42)] sm:p-6">
          <div class="flex flex-col gap-5">
            <div class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_220px_220px_220px]">
              <div class="flex flex-col gap-2">
                <label for="content-search" class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
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
                    id="content-search"
                    v-model="searchQuery"
                    type="search"
                    placeholder="Titre, type de contenu..."
                    class="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <label class="flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Statut</span>
                <AppSelect v-model="selectedStatus" :options="statusSelectOptions" aria-label="Statut" />
              </label>

              <label class="flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Visibilité</span>
                <AppSelect v-model="selectedVisibility" :options="visibilitySelectOptions" aria-label="Visibilité" />
              </label>

              <label class="flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Trier par</span>
                <AppSelect v-model="selectedSort" :options="sortSelectOptions" aria-label="Trier par" />
              </label>
            </div>

            <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
                  :class="
                    viewMode === 'active'
                      ? 'border-primary/20 bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  "
                  @click="viewMode = 'active'; loadContents()"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Contenus actifs
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
                  :class="
                    viewMode === 'trash'
                      ? 'border-primary/20 bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  "
                  @click="viewMode = 'trash'; loadTrashedContents()"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Corbeille
                </button>
              </div>
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

              <div class="flex flex-wrap items-center gap-3">
                <span class="text-sm font-medium text-slate-500">{{ resultLabel }}</span>
                <AppButton variant="ghost" size="md" @click="resetFilters">Réinitialiser</AppButton>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="isLoading"
          class="rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
        >
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Chargement</p>
          <h2 class="mt-3 text-2xl font-semibold text-slate-950">On récupère vos contenus.</h2>
        </div>

        <div
          v-else-if="loadError"
          class="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
        >
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Erreur</p>
          <h2 class="mt-3 text-2xl font-semibold text-slate-950">Impossible de charger vos contenus.</h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm leading-7 text-rose-900/80">{{ loadError }}</p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <AppButton variant="secondary" size="md" @click="resetFilters">Réinitialiser</AppButton>
          </div>
        </div>

        <div v-else-if="filteredContentItems.length" class="grid gap-5 lg:grid-cols-2">
          <article
            v-for="item in filteredContentItems"
            :key="item.id"
            class="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_26px_80px_-54px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:border-primary/20"
          >
            <div class="flex flex-col gap-5">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    {{ item.type }}
                  </span>
                  <span class="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {{ item.visibility }}
                  </span>
                </div>

                <div class="flex items-center gap-3">
                  <template v-if="viewMode === 'active'">
                    <AppOpenStudioButton :to="item.editTo" label="Studio" size="sm" />
                    <RouterLink :to="item.settingsTo" class="text-sm font-semibold text-slate-700 hover:text-slate-950">
                      Propriétés
                    </RouterLink>
                    <RouterLink :to="item.to" class="text-sm font-semibold text-primary transition group-hover:translate-x-0.5">
                      {{ item.actionLabel }}
                    </RouterLink>
                    <StatsDataCardDropdown
                      :document-id="item.id"
                      :document-slug="item.slug"
                      @move-to-trash="handleMoveToTrash(item.id)"
                    />
                  </template>
                  <template v-else>
                    <AppButton variant="secondary" size="sm" @click="handleRestore(item.id)">
                      Restaurer
                    </AppButton>
                    <AppButton variant="danger" size="sm" @click="handleForceDelete(item.id)">
                      Supprimer définitivement
                    </AppButton>
                  </template>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <h2 class="text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                  {{ item.title }}
                </h2>
                <p class="text-sm leading-7 text-slate-600">
                  Créé par <span class="font-semibold text-slate-900">{{ item.createdByLabel }}</span>
                </p>
              </div>

              <div class="grid gap-3 rounded-[1.5rem] bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Créé le</p>
                  <p class="mt-2 text-sm font-semibold text-slate-900">{{ formatIso(item.createdAtIso) }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Modifié le</p>
                  <p class="mt-2 text-sm font-semibold text-slate-900">{{ formatIso(item.updatedAtIso) }}</p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div
          v-else
          class="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
        >
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Aucun contenu trouvé</p>
          <h2 class="mt-3 text-2xl font-semibold text-slate-950">Ajustez la recherche ou recréez une vue plus large.</h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Aucun élément ne correspond à vos filtres actuels. Vous pouvez réinitialiser la vue ou repartir sur une
            nouvelle création.
          </p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <AppButton variant="secondary" size="md" @click="resetFilters">Réinitialiser les filtres</AppButton>
            <AppButton as="router-link" to="/statsdata" variant="primary" size="md">Ajouter un StatsData</AppButton>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
