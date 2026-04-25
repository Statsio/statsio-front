<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppOpenStudioButton from '@/components/statsdata/AppOpenStudioButton.vue'
import { useAuthStore } from '@/stores/auth'
import { studioDataSourcesKey, studioStatsDataWidgetKey, studioPageFiltersKey } from '@/lib/studio-inject-keys'
import { resolveStudioBlock } from '@/components/studio/blocks/studio-block-registry'
import { blockToPayload } from '@/types/studio-document'
import type { StatsDataDocumentDto } from '@/types/statsdata-document-api'
import { executeStatsDataQuery } from '@/api/statsdata-sources'
import type { StatsDataAnyQueryRequest } from '@/types/statsdata-query'

const props = defineProps<{
  document: StatsDataDocumentDto
}>()

const route = useRoute()
const router = useRouter()
const currentPageIndex = ref(0)
const pageFilters = ref<Record<string, string>>({})

const visiblePages = computed(() => {
  const pages = props.document.pages || []
  return pages
    .map((page, index) => ({ ...page, originalIndex: index }))
    .filter(page => page.visible_in_tabs !== false)
    .sort((a, b) => (a.order ?? a.originalIndex) - (b.order ?? b.originalIndex))
})

const allPagesSorted = computed(() => {
  const pages = props.document.pages || []
  return pages
    .map((page, index) => ({ ...page, originalIndex: index }))
    .sort((a, b) => (a.order ?? a.originalIndex) - (b.order ?? b.originalIndex))
})

const currentPage = computed(() => {
  // Essayer d'abord dans les pages visibles
  const visiblePage = visiblePages.value[currentPageIndex.value]
  if (visiblePage) return visiblePage

  // Sinon, chercher dans toutes les pages (pour les pages masquées accessibles via navigation)
  return allPagesSorted.value[currentPageIndex.value] || null
})

function selectPage(index: number) {
  currentPageIndex.value = index
}

function normalizeQueryString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  if (Array.isArray(value)) {
    const firstString = value.find((entry) => typeof entry === 'string' && entry.trim().length > 0)
    return typeof firstString === 'string' ? firstString.trim() : null
  }
  return null
}

function getPageIndexFromQuery(): number {
  const rawPage = normalizeQueryString(route.query.page)
  const pageNumber = rawPage ? Number.parseInt(rawPage, 10) : 1
  if (!Number.isFinite(pageNumber) || pageNumber < 1) return 0
  const maxIndex = Math.max(allPagesSorted.value.length - 1, 0)
  return Math.min(pageNumber - 1, maxIndex)
}

function getFiltersFromQuery(): Record<string, string> {
  const nextFilters: Record<string, string> = {}
  Object.entries(route.query).forEach(([key, value]) => {
    if (key === 'page') return
    const normalized = normalizeQueryString(value)
    if (normalized != null) {
      nextFilters[key] = normalized
    }
  })
  return nextFilters
}

function syncStateFromRouteQuery() {
  currentPageIndex.value = getPageIndexFromQuery()
  pageFilters.value = getFiltersFromQuery()
}

async function syncRouteQueryFromState() {
  const nextQuery: Record<string, string> = {}
  const nextPage = currentPageIndex.value + 1

  if (nextPage > 1) {
    nextQuery.page = String(nextPage)
  }

  Object.entries(pageFilters.value).forEach(([key, value]) => {
    const normalized = String(value ?? '').trim()
    if (normalized.length) {
      nextQuery[key] = normalized
    }
  })

  const currentQuery = Object.fromEntries(
    Object.entries(route.query)
      .map(([key, value]) => [key, normalizeQueryString(value)])
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )

  const currentKeys = Object.keys(currentQuery).sort()
  const nextKeys = Object.keys(nextQuery).sort()
  const sameQuery =
    currentKeys.length === nextKeys.length &&
    currentKeys.every((key, index) => key === nextKeys[index] && currentQuery[key] === nextQuery[key])

  if (sameQuery) return

  await router.replace({
    query: nextQuery,
  })
}

watch(
  () => [route.query, allPagesSorted.value.length] as const,
  () => {
    syncStateFromRouteQuery()
  },
  { immediate: true, deep: true },
)

watch(
  () => [currentPageIndex.value, pageFilters.value] as const,
  () => {
    void syncRouteQueryFromState()
  },
  { deep: true },
)

function handleBlockAction(action: any, context: Record<string, unknown>) {
  console.log('handleBlockAction called', { action, context })
  if (action.type === 'navigate_to_page') {
    const targetPageId = action.targetPageId
    console.log('Navigating to page:', targetPageId)

    // Appliquer les filtres passés via passColumns
    if (action.passColumns && Array.isArray(action.passColumns)) {
      const newFilters: Record<string, string> = {}
      action.passColumns.forEach((col: string) => {
        if (context[col] !== undefined) {
          newFilters[col] = String(context[col])
        }
      })
      pageFilters.value = newFilters
      console.log('Applied filters:', newFilters)
    } else {
      // Réinitialiser les filtres si aucune colonne n'est passée
      pageFilters.value = {}
    }

    // Chercher dans toutes les pages, pas seulement les visibles
    const allPages = props.document.pages || []
    const targetPageOriginalIndex = allPages.findIndex(p => p.id === targetPageId)

    if (targetPageOriginalIndex !== -1) {
      // Trouver l'index dans visiblePages si la page est visible
      const visibleIndex = visiblePages.value.findIndex(p => p.id === targetPageId)

      if (visibleIndex !== -1) {
        // La page est visible dans les tabs, naviguer normalement
        selectPage(visibleIndex)
      } else {
        // La page est masquée des tabs, l'afficher quand même temporairement
        console.log('Page is hidden from tabs, showing it anyway')
        // Trouver l'index dans le tableau complet trié
        const sortedPages = allPages
          .map((page, index) => ({ ...page, originalIndex: index }))
          .sort((a, b) => (a.order ?? a.originalIndex) - (b.order ?? b.originalIndex))

        const sortedIndex = sortedPages.findIndex(p => p.id === targetPageId)

        // Afficher temporairement toutes les pages pour permettre la navigation
        currentPageIndex.value = sortedIndex
      }
    } else {
      console.warn('Page not found! Target:', targetPageId)
    }
  } else if (action.type === 'set_filters') {
    // Appliquer les filtres sans changer de page
    pageFilters.value = { ...action.filters }
    console.log('Set filters:', action.filters)
  }
}

const heroStats = computed(() => {
  const totalBlocks = props.document.pages?.reduce((sum, page) => sum + (page.blocks?.length ?? 0), 0) ?? 0
  return [
    { label: 'Pages', value: String(props.document.pages?.length ?? 0) },
    { label: 'Blocs', value: String(totalBlocks) },
    { label: 'Sources', value: String(props.document.dataSources?.length ?? 0) },
    { label: 'Mise à jour', value: formatUpdated(props.document.updated_at) },
  ]
})

const featurePanels = [
  {
    title: 'Comparaisons rapides',
    detail: 'Basculez entre territoires, périodes et segments sans casser la lecture.',
  },
  {
    title: 'Blocs réutilisables',
    detail: 'Tableaux, graphiques et exports dans un même flux.',
  },
  {
    title: 'Connexion éditoriale',
    detail: 'Chaque StatsData peut alimenter un article, une note interne ou un baromètre public.',
  },
]

const quickSignals = computed(() => [
  {
    label: 'Auteur',
    title: authorLabel.value ?? '—',
    detail: props.document.visibility ? `Visibilité: ${props.document.visibility}` : 'Visibilité: —',
  },
  {
    label: 'Identifiant',
    title: props.document.slug || '—',
    detail: props.document.id ? `ID: ${props.document.id}` : 'ID: —',
  },
  {
    label: 'Édition',
    title: canEdit.value ? 'Vous pouvez modifier' : 'Lecture seule',
    detail: canEdit.value ? 'Accès au studio et aux propriétés.' : 'Connectez-vous pour modifier si vous êtes l’auteur.',
  },
])

const authStore = useAuthStore()

const canEdit = computed(() => {
  const uid = authStore.user?.id
  const createdById = props.document.created_by?.id
  if (uid == null || !createdById) return false
  return String(uid) === String(createdById)
})

provide(studioDataSourcesKey, computed(() => props.document.dataSources ?? []))

provide(
  studioStatsDataWidgetKey,
  computed(() => ({
    enabled: true,
    documentId: props.document.id,
    executeQuery: async (body: StatsDataAnyQueryRequest) => executeStatsDataQuery(props.document.id, body),
  })),
)

provide(studioPageFiltersKey, pageFilters)

function formatUpdated(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
}

const authorLabel = computed(() => {
  const c = props.document.created_by
  if (!c) return null
  const name = [c.first_name, c.last_name].filter((x) => typeof x === 'string' && x.trim().length > 0).join(' ')
  return name || c.email || null
})
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-10">
      <div class="container grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-start">
        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-5">
            <p class="eyebrow text-accent">StatsData & exploration</p>
            <div class="flex max-w-4xl flex-col gap-4">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                {{ document.title || 'Sans titre' }}
              </h1>
              <p v-if="document.subtitle" class="max-w-3xl text-lg leading-8 text-slate-600">
                {{ document.subtitle }}
              </p>
              <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span>Mis à jour le {{ formatUpdated(document.updated_at) }}</span>
                <span v-if="authorLabel">par {{ authorLabel }}</span>
                <span v-if="document.visibility">• {{ document.visibility }}</span>
              </div>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <div
              v-for="stat in heroStats"
              :key="stat.label"
              class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]"
            >
              <div class="flex flex-col gap-3">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ stat.label }}</p>
                <p class="text-2xl font-semibold text-slate-950">{{ stat.value }}</p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <AppButton as="router-link" to="/statsdata" variant="secondary" size="md">
              Revenir au catalogue
            </AppButton>
            <AppOpenStudioButton
              v-if="canEdit"
              :to="{ name: 'studio-statsdata-edit', params: { id: document.id } }"
              label="Modifier dans Studio"
            />
            <AppButton
              v-if="canEdit"
              as="router-link"
              :to="{ name: 'statsdata-settings', params: { id: document.id } }"
              variant="outline"
              size="md"
            >
              Propriétés
            </AppButton>
            <AppButton v-else-if="!authStore.hasSession" as="router-link" to="/login" variant="outline" size="md">
              Se connecter pour modifier
            </AppButton>
          </div>

          <article
            class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_40px_110px_-58px_rgba(59,130,246,0.45)]"
          >
            <div class="p-7 sm:p-9">
              <div
                v-if="!document.pages?.length || !document.pages.some(p => p.blocks?.length)"
                class="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center text-sm leading-relaxed text-slate-500"
              >
                Cette StatsData ne contient pas encore de blocs.
                <AppOpenStudioButton
                  v-if="canEdit"
                  :to="{ name: 'studio-statsdata-edit', params: { id: document.id } }"
                  size="sm"
                />
              </div>
              <div v-else class="flex flex-col gap-8">
                <!-- Tabs navigation -->
                <div v-if="visiblePages.length > 1" class="flex gap-2 border-b border-slate-200">
                  <button
                    v-for="(page, index) in visiblePages"
                    :key="page.id"
                    @click="selectPage(index)"
                    :class="[
                      'px-4 py-2 text-sm font-medium transition-colors border-b-2',
                      currentPageIndex === index
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    ]"
                  >
                    {{ page.name }}
                  </button>
                </div>

                <!-- Current page content -->
                <section v-if="currentPage" class="flex flex-col gap-10 lg:gap-12">
                  <component
                    v-for="block in currentPage.blocks"
                    :key="block.id"
                    :is="resolveStudioBlock(block.type)"
                    :payload="blockToPayload(block)"
                    :field-id="block.id"
                    :editable="false"
                    @action="handleBlockAction"
                  />
                </section>
              </div>
            </div>
          </article>
        </div>

        <aside class="flex flex-col gap-4">
          <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pourquoi ça marche</p>
            <div class="mt-5 flex flex-col gap-5">
              <div v-for="panel in featurePanels" :key="panel.title" class="rounded-[1.5rem] bg-white/8 p-4">
                <div class="flex flex-col gap-2">
                  <p class="text-sm font-semibold text-white">{{ panel.title }}</p>
                  <p class="text-sm leading-6 text-slate-300">{{ panel.detail }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">À propos</p>
            <div class="mt-5 flex flex-col gap-4">
              <div v-for="item in quickSignals" :key="item.title" class="rounded-[1.5rem] bg-slate-50 p-4">
                <div class="flex flex-col gap-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{{ item.label }}</p>
                  <p class="text-base font-semibold text-slate-950">{{ item.title }}</p>
                  <p class="text-sm leading-6 text-slate-500">{{ item.detail }}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
