<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchPublicStatsDataDocument } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import { SECTION_LAYOUT_DEFINITIONS } from '@/types/studio'
import type { StudioBlock, StudioDocumentPage } from '@/types/studio'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'

const route = useRoute()
const studio = useStudioStore()

const slug     = String(route.params.slug ?? '')
const pageSlug = String(route.params.pageSlug ?? 'default')

const loading = ref(true)
const error   = ref<string | null>(null)

usePageSeo({
  title: computed(() => studio.content?.title),
})

// Sections of the current page
const pageSections = computed(() => studio.currentPageSections)

// Blocks grouped by zone
const blocksByZone = computed(() => studio.blocksByZone)

function sectionDef(layout: string) {
  return SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === layout) ?? SECTION_LAYOUT_DEFINITIONS[0]!
}

function blocksInZone(sectionId: string, colIdx: number): StudioBlock[] {
  const zoneId = `${sectionId}-${colIdx}`
  return blocksByZone.value[zoneId] ?? []
}

// Other (non-template) pages of the same doc for navigation
const otherPages = computed(() =>
  studio.pages.filter((p: StudioDocumentPage) => p.id !== studio.currentPageId && !p.isTemplate)
)

onMounted(async () => {
  try {
    const doc = await fetchPublicStatsDataDocument(slug)

    // Initialize Studio store with the real document data
    studio.initPage(
      { id: doc.id, type: 'statsdata', title: doc.title, status: doc.status as 'draft' | 'published' },
      doc.sections,
      doc.blocks,
      doc.pages,
    )

    // Find the matching page by slug or id
    const targetPage = studio.pages.find((p: StudioDocumentPage) => p.slug === pageSlug || p.id === pageSlug)
    if (targetPage) {
      studio.switchPage(targetPage.id)
    }

    // Apply URL query params as page params (e.g. ?ville=Paris)
    const query = route.query
    for (const [key, val] of Object.entries(query)) {
      if (typeof val === 'string') {
        studio.setPageParam(key, val)
      }
    }
  } catch {
    error.value = 'Page introuvable ou document non publié.'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  studio.clearPageParams()
})

const currentPage = computed(() => studio.pages.find((p: StudioDocumentPage) => p.id === studio.currentPageId))

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
    <section class="section pb-10">
      <div class="container flex flex-col gap-8">

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-32">
          <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="py-24 text-center text-slate-500">
          <p class="text-lg font-medium">{{ error }}</p>
          <RouterLink :to="`/statsdata/${slug}`" class="mt-4 inline-block text-primary underline">← Retour au document</RouterLink>
        </div>

        <template v-else>
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
            <RouterLink to="/statsdata" class="hover:text-primary transition-colors">StatsData</RouterLink>
            <span>/</span>
            <RouterLink :to="`/statsdata/${slug}`" class="hover:text-primary transition-colors">
              {{ studio.content?.title }}
            </RouterLink>
            <span>/</span>
            <span class="text-slate-600">{{ currentPage?.title ?? pageSlug }}</span>
          </nav>

          <!-- Header -->
          <div class="flex flex-col gap-3 max-w-4xl">
            <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              {{ currentPage?.title ?? studio.content?.title }}
            </h1>
            <p v-if="currentPage?.description" class="text-lg leading-8 text-slate-600">
              {{ currentPage.description }}
            </p>
            <div class="flex items-center gap-4 text-sm text-slate-400">
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

          <!-- Active params banner (when navigated from search block) -->
          <div
            v-if="Object.keys(studio.pageParams).length > 0"
            class="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl"
          >
            <svg class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
            <span class="text-[11px] font-medium text-amber-700">Filtrés par :</span>
            <span
              v-for="[key, val] in Object.entries(studio.pageParams)"
              :key="key"
              class="text-[11px] font-mono bg-amber-100 border border-amber-200 rounded px-2 py-0.5 text-amber-800"
            >
              {{ key }} = <strong>{{ val }}</strong>
            </span>
          </div>

          <!-- Block canvas (read-only) -->
          <div class="flex flex-col gap-4">
            <template v-if="pageSections.length > 0">
              <div
                v-for="section in pageSections"
                :key="section.id"
                class="section-grid gap-4"
                :style="{ '--cols': sectionDef(section.layout).gridCols.map((n: number) => `${n}fr`).join(' ') }"
              >
                <div
                  v-for="(_, colIdx) in sectionDef(section.layout).gridCols"
                  :key="colIdx"
                  class="flex flex-col gap-4 min-w-0"
                >
                  <div
                    v-for="block in blocksInZone(section.id, colIdx)"
                    :key="block.id"
                    class="bg-white rounded-[1.75rem] border border-slate-200 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.15)] overflow-hidden"
                  >
                    <div v-if="block.config.title" class="border-b border-slate-100 px-5 py-3">
                      <p class="text-sm font-semibold text-slate-800">{{ block.config.title }}</p>
                    </div>
                    <div class="p-4">
                      <BlockRenderer :block="block" :readonly="true" />
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Empty page -->
            <div v-else class="py-24 text-center text-slate-400">
              <svg class="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p class="text-sm">Cette page ne contient pas encore de contenu.</p>
            </div>
          </div>

          <!-- Page navigation -->
          <div v-if="otherPages.length > 0" class="border-t border-slate-100 pt-8">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-4">Autres pages</p>
            <div class="flex flex-wrap gap-3">
              <RouterLink
                v-for="page in otherPages"
                :key="page.id"
                :to="`/statsdata/${slug}/${page.slug ?? page.id}`"
                class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-primary hover:text-primary transition-colors"
              >
                {{ page.title }}
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" />
                </svg>
              </RouterLink>
              <RouterLink
                :to="`/statsdata/${slug}`"
                class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Toutes les pages
              </RouterLink>
            </div>
          </div>
        </template>
      </div>
    </section>
  </main>
</template>

<style scoped>
.section-grid {
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 640px) {
  .section-grid {
    grid-template-columns: var(--cols);
  }
}
</style>
