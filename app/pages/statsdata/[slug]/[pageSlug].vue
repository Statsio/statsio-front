<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchPublicStatsDataDocument } from '@/api/studio'
import type { StatsDataDocument as ApiDoc } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import { SECTION_LAYOUT_DEFINITIONS } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'

const route  = useRoute()
const router = useRouter()
const studio = useStudioStore()

const docSlug  = computed(() => String(route.params.slug ?? ''))
const pageSlug = computed(() => route.params.pageSlug as string | undefined)

const doc     = ref<ApiDoc | null>(null)
const loading = ref(true)
const error   = ref<string | null>(null)

// Active page = the one matching pageSlug param, or first non-template
const activePage = computed(() => {
  if (!studio.pages.length) return null
  if (pageSlug.value) {
    const match = studio.pages.find(
      (p) => p.slug === pageSlug.value || p.id === pageSlug.value,
    )
    if (match) return match
  }
  return studio.pages.find((p) => !p.isTemplate) ?? studio.pages[0] ?? null
})

const publicPages = computed(() => studio.pages.filter((p) => !p.isTemplate))
const pageSections = computed(() => studio.currentPageSections)

// Helper: extract string-typed query params as pageParams
function queryToParams(q: import('vue-router').LocationQuery): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(q)) {
    if (typeof val === 'string') result[key] = val
  }
  return result
}

// Finds the first non-template page to use as fallback / redirect target
function defaultExplorationPage() {
  return studio.pages.find((p) => !p.isTemplate) ?? studio.pages[0] ?? null
}

// Redirects to the default exploration page (replaces history entry so Back works)
function redirectToDefault() {
  const fallback = defaultExplorationPage()
  if (!fallback) return
  const ps = fallback.slug ?? fallback.id
  router.replace(`/statsdata/${route.params.slug}/${ps}`)
}

// When pageSlug URL param changes, switch the active page
watch(pageSlug, (slug) => {
  if (!studio.pages.length) return
  const target = slug
    ? (studio.pages.find((p) => p.slug === slug || p.id === slug) ?? studio.pages.find((p) => !p.isTemplate) ?? studio.pages[0])
    : (studio.pages.find((p) => !p.isTemplate) ?? studio.pages[0])
  if (!target) return

  const urlParams = queryToParams(route.query)
  const hasMemoryParams = Object.keys(studio.pageParams).length > 0

  // Same-session URL navigation: params were already set by onSelect → preserve them
  if (target.isTemplate && hasMemoryParams) {
    studio.switchPageKeepParams(target.id)
    for (const [k, v] of Object.entries(urlParams)) studio.setPageParam(k, v)
    return
  }

  // Template accessed without any params (direct URL, no prior selection) → redirect
  if (target.isTemplate && !Object.keys(urlParams).length) {
    redirectToDefault()
    return
  }

  // Normal navigation: full reset + restore URL params
  studio.switchPage(target.id)
  studio.setPageParams(urlParams)
})

// When only query changes (same template page, new result selected via URL)
watch(() => route.query, (q) => {
  if (!studio.pages.length) return
  const currentPage = studio.pages.find((p) => p.id === studio.currentPageId)
  if (!currentPage?.isTemplate) return
  for (const [k, v] of Object.entries(q)) {
    if (typeof v === 'string') studio.setPageParam(k, v)
  }
}, { deep: true })

function sectionDef(layout: string) {
  return SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === layout) ?? SECTION_LAYOUT_DEFINITIONS[0]!
}

function blocksInZone(sectionId: string, colIdx: number): StudioBlock[] {
  return studio.blocksByZone[`${sectionId}-${colIdx}`] ?? []
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatRows(n?: number) {
  if (!n) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M lignes`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k lignes`
  return `${n} lignes`
}

function pageLink(page: { id: string; slug?: string }) {
  const ps = page.slug ?? page.id
  return `/statsdata/${docSlug.value}/${ps}`
}

onMounted(async () => {
  try {
    const data = await fetchPublicStatsDataDocument(docSlug.value)
    doc.value = data
    studio.initPage(
      { id: data.id, type: 'statsdata', title: data.title, status: data.status as 'draft' | 'published' },
      data.sections, data.blocks, data.pages,
    )
    // Switch to the page matching pageSlug param, else first non-template
    const target = pageSlug.value
      ? (studio.pages.find((p) => p.slug === pageSlug.value || p.id === pageSlug.value) ?? studio.pages.find((p) => !p.isTemplate) ?? studio.pages[0])
      : (studio.pages.find((p) => !p.isTemplate) ?? studio.pages[0])
    if (target) {
      const urlParams = queryToParams(route.query)
      // Template accessed directly without URL params → redirect to default page
      if (target.isTemplate && !Object.keys(urlParams).length) {
        redirectToDefault()
        return
      }
      studio.switchPage(target.id)
      studio.setPageParams(urlParams)
    }
  } catch {
    error.value = 'Document introuvable ou non publié.'
  } finally {
    loading.value = false
  }
})

function resolveToken(str: string): string {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => studio.pageParams[key] ?? match)
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
  <main class="pb-24 pt-4">
    <section class="py-8">
      <div class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 flex flex-col gap-6">

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-40">
          <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="py-24 text-center text-slate-500">
          <p class="text-lg font-medium">{{ error }}</p>
          <RouterLink to="/statsdata" class="mt-4 inline-block text-primary underline text-sm">← Retour au catalogue</RouterLink>
        </div>

        <template v-else-if="doc">
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-2 text-sm text-slate-400">
            <RouterLink to="/statsdata" class="hover:text-primary transition-colors">StatsData</RouterLink>
            <span>/</span>
            <RouterLink :to="`/statsdata/${docSlug}`" class="hover:text-primary transition-colors">{{ doc.title }}</RouterLink>
            <template v-if="activePage && pageSlug">
              <span>/</span>
              <span class="text-slate-600">{{ activePage.title }}</span>
            </template>
          </nav>

          <!-- Header -->
          <div class="flex items-start justify-between gap-6 flex-wrap">
            <div class="flex flex-col gap-2 max-w-3xl">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">{{ doc.title }}</h1>
              <p v-if="activePage && pageSlug && activePage.title !== doc.title" class="text-lg font-medium text-primary">
                {{ activePage.title }}
              </p>
              <p v-if="doc.description" class="text-base text-slate-500 leading-7">{{ doc.description }}</p>
            </div>
            <button
              class="flex items-center gap-1.5 shrink-0 text-sm text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
              @click="copyLink"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              {{ isCopied ? 'Copié !' : 'Partager' }}
            </button>
          </div>

          <!-- 2/3 + 1/3 layout -->
          <div class="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(260px,380px)] lg:items-start">

            <!-- LEFT — active page content -->
            <div class="flex flex-col gap-4">
              <template v-if="pageSections.length > 0">
                <div
                  v-for="section in pageSections"
                  :key="section.id"
                  class="grid gap-4"
                  :style="{ gridTemplateColumns: sectionDef(section.layout).gridCols.map((n) => `${n}fr`).join(' ') }"
                >
                  <div
                    v-for="(_, colIdx) in sectionDef(section.layout).gridCols"
                    :key="colIdx"
                    class="flex flex-col gap-4 min-w-0"
                  >
                    <div
                      v-for="block in blocksInZone(section.id, colIdx)"
                      :key="block.id"
                      class="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <div v-if="block.config.title" class="border-b border-slate-100 px-5 py-3">
                        <p class="text-sm font-semibold text-slate-800">{{ resolveToken(block.config.title) }}</p>
                      </div>
                      <div class="p-4">
                        <BlockRenderer :block="block" :readonly="true" />
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <div v-else class="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 py-20 text-center text-slate-400">
                <svg class="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
                </svg>
                <p class="text-sm">Aucun contenu sur cette page.</p>
              </div>
            </div>

            <!-- RIGHT — metadata sidebar (stable across page changes) -->
            <aside class="flex flex-col gap-4">

              <!-- Author + dates -->
              <div class="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div class="border-b border-slate-100 px-5 py-4">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">À propos</p>
                </div>
                <div class="px-5 py-4 flex flex-col gap-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {{ doc.author?.name?.charAt(0)?.toUpperCase() ?? '?' }}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-slate-800">{{ doc.author?.name ?? 'Anonyme' }}</p>
                      <p class="text-xs text-slate-400">Auteur</p>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Créé le</p>
                      <p class="text-xs font-semibold text-slate-700 mt-0.5">{{ formatDate(doc.created_at) }}</p>
                    </div>
                    <div class="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Mis à jour</p>
                      <p class="text-xs font-semibold text-slate-700 mt-0.5">{{ formatDate(doc.updated_at) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Exploration pages (non-template) -->
              <div v-if="publicPages.length > 1" class="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div class="border-b border-slate-100 px-5 py-4">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Pages d'exploration</p>
                </div>
                <div class="divide-y divide-slate-100">
                  <RouterLink
                    v-for="page in publicPages"
                    :key="page.id"
                    :to="pageLink(page)"
                    class="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                    :class="activePage?.id === page.id ? 'bg-primary/5' : ''"
                  >
                    <div
                      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
                      :class="activePage?.id === page.id ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-400'"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-slate-800 truncate">{{ page.title }}</p>
                      <p v-if="page.description" class="text-xs text-slate-400 truncate mt-0.5">{{ page.description }}</p>
                    </div>
                    <svg
                      class="w-3.5 h-3.5 shrink-0 transition-colors"
                      :class="activePage?.id === page.id ? 'text-primary' : 'text-slate-300'"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" />
                    </svg>
                  </RouterLink>
                </div>
              </div>

              <!-- Data sources -->
              <div v-if="doc.datasets && doc.datasets.length > 0" class="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div class="border-b border-slate-100 px-5 py-4">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Sources de données</p>
                </div>
                <div class="divide-y divide-slate-100">
                  <div v-for="dataset in doc.datasets" :key="dataset.id" class="flex items-center gap-3 px-5 py-3.5">
                    <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-slate-800 truncate">{{ dataset.name }}</p>
                      <p v-if="formatRows(dataset.row_count)" class="text-xs text-slate-400">{{ formatRows(dataset.row_count) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Public URL -->
              <div v-if="doc.slug" class="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm px-5 py-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1.5">Lien public</p>
                <p class="text-xs font-mono text-slate-500 break-all">/statsdata/{{ doc.slug }}</p>
              </div>
            </aside>
          </div>
        </template>
      </div>
    </section>
  </main>
</template>
