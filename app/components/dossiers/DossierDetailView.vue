<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { fetchDossierDetail } from '@/api/dossiers'
import DossierDetailAside from '@/components/dossiers/detail/DossierDetailAside.vue'
import DossierDetailHero from '@/components/dossiers/detail/DossierDetailHero.vue'
import DossierDetailItems from '@/components/dossiers/detail/DossierDetailItems.vue'
import DossierDetailRelated from '@/components/dossiers/detail/DossierDetailRelated.vue'
import DossierDetailToolbar from '@/components/dossiers/detail/DossierDetailToolbar.vue'
import { useDossierFollows } from '@/composables/useDossierFollows'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { formatRelativePublished } from '@/lib/catalog-format'
import { canonicalContentPath, publicContentPath, publicDossierListPath } from '@/lib/content-display'
import { CONTENT_UNIT, dossierTypeMeta } from '@/lib/dossiers-listing'
import {
  buildDossierFrise,
  dossierChannels,
  dossierContentType,
  dossierEntryPoint,
  filterDossierItems,
  formatDossierOpened,
  groupDossierByMonth,
  orderDossierItems,
  type DossierDetailSort,
  type DossierDetailViewMode,
} from '@/lib/dossier-detail'
import { breadcrumbNode, collectionNode } from '@/lib/structured-data'
import type { ContentType } from '@/types/content-creation'
import type { DossierContentType } from '@/types/dossier'

const route = useRoute()
const requestUrl = useRequestURL()
const slug = computed(() => String(route.params.slug))
const basePath = useContentBasePath()

const { data, error } = await useAsyncData(
  'dossier-detail',
  () => fetchDossierDetail(slug.value),
  { watch: [slug] },
)

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Dossier introuvable', fatal: true })
}

const detail = computed(() => data.value!)
const dossier = computed(() => detail.value.dossier)

const homePath = computed(() => basePath.value || '/')
const listPath = computed(() => publicDossierListPath(basePath.value))
const canonicalPath = computed(() => canonicalContentPath(route.path))

usePageSeo({
  title: () => dossier.value.name,
  description: () =>
    dossier.value.description ?? `Tous les contenus Statsio du dossier « ${dossier.value.name} ».`,
  image: () => dossier.value.image_url ?? undefined,
  canonical: canonicalPath,
  jsonLd: computed(() => {
    const current = dossier.value
    const url = `${requestUrl.origin}${canonicalPath.value}`
    return [
      breadcrumbNode(
        [
          { name: 'Accueil', path: '/' },
          { name: 'Dossiers', path: '/dossiers' },
          ...(current.category
            ? [{ name: current.category.label, path: `/dossiers?category=${current.category.slug}` }]
            : []),
          { name: current.name, path: canonicalPath.value },
        ],
        requestUrl.origin,
      ),
      collectionNode(
        {
          url,
          name: current.name,
          description: current.description ?? undefined,
          image: current.image_url ?? undefined,
          dateModified: current.updated_at ?? undefined,
          items: detail.value.items.map((item) => ({
            url: `${requestUrl.origin}${publicContentPath((item.type ?? 'statsdata') as ContentType, item.slug)}`,
            name: item.title,
          })),
        },
        requestUrl.origin,
      ),
    ]
  }),
})

const typeFilter = ref<DossierContentType | ''>('')
const query = ref('')
const sort = ref<DossierDetailSort>('new')
const view = useStorage<DossierDetailViewMode>('statsio-dossier-view', 'feed')
if (view.value !== 'feed' && view.value !== 'grid') view.value = 'feed'

const { isFollowing, toggle } = useDossierFollows()
const following = computed(() => isFollowing(slug.value))

const counts = computed(() => ({
  statsdata: detail.value.counts.statsdata,
  article: detail.value.counts.article,
  survey: detail.value.counts.survey,
}))
const formats = computed(
  () => Object.values(counts.value).filter((count) => count > 0).length,
)

const filtered = computed(() =>
  orderDossierItems(filterDossierItems(detail.value.items, typeFilter.value, query.value), sort.value),
)
const groups = computed(() => groupDossierByMonth(filtered.value, dossier.value.opened_at))
const visibleIds = computed(() => new Set(filtered.value.map((item) => item.id)))
const pile = computed(() => orderDossierItems(detail.value.items, 'new'))
const frise = computed(() => buildDossierFrise(detail.value.items))
const channels = computed(() => dossierChannels(detail.value.items))

const entry = computed(() => {
  const featured = dossierEntryPoint(detail.value.items)
  if (!featured || query.value.trim() || sort.value !== 'new') return null
  if (typeFilter.value && dossierContentType(featured) !== typeFilter.value) return null
  return featured
})

const active = computed(() => Boolean(typeFilter.value || query.value.trim()))
const unit = computed(() =>
  typeFilter.value ? dossierTypeMeta(typeFilter.value) : CONTENT_UNIT,
)
const context = computed(
  () =>
    `${sort.value === 'new' ? 'Du plus récent au plus ancien' : 'Du plus ancien au plus récent'} · ${
      view.value === 'feed' ? 'fil par mois' : 'grille'
    }`,
)

const tools = ref<{ focus: () => void } | null>(null)
const shareState = ref<'idle' | 'copied'>('idle')

function setType(type: DossierContentType | '') {
  typeFilter.value = type
}
function toggleType(type: DossierContentType) {
  typeFilter.value = typeFilter.value === type ? '' : type
  document.getElementById('dd-tools')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
}
function resetFilters() {
  typeFilter.value = ''
  query.value = ''
}

async function openItem(id: string) {
  const item = detail.value.items.find((entry) => entry.id === id)
  if (!item) return
  if (typeFilter.value && typeFilter.value !== dossierContentType(item)) typeFilter.value = ''
  if (query.value) query.value = ''
  await nextTick()
  const node = document.getElementById(`dd-${id}`)
  node?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  node?.classList.remove('is-hit')
  if (node) void node.offsetWidth
  node?.classList.add('is-hit')
}

async function share() {
  const url = import.meta.client ? window.location.href : ''
  if (import.meta.client && typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({ title: dossier.value.name, url })
      return
    } catch {
      /* annulé */
    }
  }
  if (import.meta.client && navigator.clipboard) {
    await navigator.clipboard.writeText(url)
    shareState.value = 'copied'
    setTimeout(() => (shareState.value = 'idle'), 1800)
  }
}

function onKey(event: KeyboardEvent) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
  const tag = (event.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  event.preventDefault()
  tools.value?.focus()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="dd ds-scope">
    <section>
      <div class="ds-max">
        <nav class="dd-crumbs" aria-label="Fil d'Ariane">
          <NuxtLink :to="homePath">Accueil</NuxtLink>
          <span aria-hidden="true">/</span>
          <NuxtLink :to="listPath">Dossiers</NuxtLink>
          <template v-if="dossier.category">
            <span aria-hidden="true">/</span>
            <NuxtLink :to="`${listPath}?category=${dossier.category.slug}`">{{ dossier.category.label }}</NuxtLink>
          </template>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{{ dossier.name }}</span>
        </nav>

        <DossierDetailHero
          :name="dossier.name"
          :description="dossier.description ?? null"
          :category="dossier.category?.label ?? null"
          :opened="formatDossierOpened(dossier.opened_at)"
          :counts="counts"
          :content-count="dossier.content_count"
          :contributors="dossier.contributors_count"
          :updated="formatRelativePublished(dossier.updated_at)"
          :following="following"
          :share-label="shareState === 'copied' ? 'Lien copié' : 'Partager'"
          :type="typeFilter"
          :pile="pile"
          :frise="frise"
          :visible-ids="visibleIds"
          @toggle-type="toggleType"
          @follow="toggle(slug)"
          @share="share"
          @open="openItem"
        />
      </div>
    </section>

    <DossierDetailToolbar
      ref="tools"
      v-model:query="query"
      v-model:sort="sort"
      v-model:view="view"
      :type="typeFilter"
      :counts="detail.counts"
      @set-type="setType"
    />

    <section>
      <div class="ds-max">
        <div class="dd-main">
          <DossierDetailItems
            :items="filtered"
            :groups="groups"
            :overall="detail.counts.all"
            :unit="unit"
            :context="context"
            :query="query"
            :filtered="active"
            :view="view"
            :entry="entry"
            @reset="resetFilters"
          />
          <DossierDetailAside
            :counts="counts"
            :total="dossier.content_count"
            :formats="formats"
            :following="following"
            :channels="channels"
            @follow="toggle(slug)"
            @set-type="setType"
          />
        </div>
        <DossierDetailRelated :name="dossier.name" :items="detail.related" />
      </div>
    </section>
  </div>
</template>

<style src="../../assets/dossier-detail.css"></style>
