<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { isTextBlock } from '@/types/studio'
import FormBlockInspector from '@/components/studio/inspector/FormBlockInspector.vue'
import MediaBlockInspector from '@/components/studio/inspector/MediaBlockInspector.vue'
import RichBlockInspector from '@/components/studio/inspector/RichBlockInspector.vue'
import SearchBlockInspector from '@/components/studio/inspector/SearchBlockInspector.vue'
import DataBlockInspector from '@/components/studio/inspector/DataBlockInspector.vue'
import type { BlockType } from '@/types/studio'

const studio = useStudioStore()

const block  = computed(() => studio.selectedBlock)
const isText   = computed(() => block.value ? isTextBlock(block.value.type) : false)

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const EDITORIAL_TYPES = ['image', 'video', 'button', 'link-card', 'retenir'] as const
const FORM_TYPES = ['choice', 'checkboxes', 'dropdown', 'scale', 'rating'] as const

const DATA_TABS      = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'style', label: 'Style' }]
const KPI_TABS       = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'comparison', label: 'Comparaison' }, { id: 'style', label: 'Style' }]
const TEXT_TABS      = [{ id: 'style', label: 'Style' }]
const SEARCH_TABS    = [{ id: 'config', label: 'Configuration' }]
const EDITORIAL_TABS = [{ id: 'editorial', label: 'Contenu' }]
const FORM_TABS      = [{ id: 'form', label: 'Question' }]

const isSearch    = computed(() => block.value?.type === 'search')
const isEditorial = computed(() => EDITORIAL_TYPES.includes(block.value?.type as typeof EDITORIAL_TYPES[number]))
const isForm      = computed(() => FORM_TYPES.includes(block.value?.type as typeof FORM_TYPES[number]))

const currentTabs = computed(() => {
  if (isText.value) return TEXT_TABS
  if (isSearch.value) return SEARCH_TABS
  if (isEditorial.value) return EDITORIAL_TABS
  if (isForm.value) return FORM_TABS
  if (block.value?.type === 'kpi') return KPI_TABS
  return DATA_TABS
})

const activeTab = ref('data')

watch([() => block.value?.id, isText, isSearch, isEditorial, isForm], () => {
  if (isText.value) activeTab.value = 'style'
  else if (isSearch.value) activeTab.value = 'config'
  else if (isEditorial.value) activeTab.value = 'editorial'
  else if (isForm.value) activeTab.value = 'form'
  else activeTab.value = 'data'
}, { immediate: true })

// ─── Block metadata ───────────────────────────────────────────────────────────

const BLOCK_META: Record<BlockType, { label: string; colorClass: string; iconPath: string }> = {
  bar:       { label: 'Barres',     colorClass: 'bg-violet-100 text-violet-600',   iconPath: 'M3 13.5V21h4.5v-7.5H3zm6.75-9V21H14.25V4.5H9.75zm6.75 4.5V21H21v-12h-4.5z' },
  line:      { label: 'Lignes',     colorClass: 'bg-blue-100 text-blue-600',       iconPath: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941' },
  pie:       { label: 'Camembert',  colorClass: 'bg-emerald-100 text-emerald-600', iconPath: 'M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z' },
  table:     { label: 'Tableau',    colorClass: 'bg-amber-100 text-amber-600',     iconPath: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375' },
  kpi:       { label: 'KPI',        colorClass: 'bg-rose-100 text-rose-600',       iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
  heading:   { label: 'Titre',      colorClass: 'bg-slate-100 text-slate-600',     iconPath: 'M4 6h16M4 12h8m-8 6h16' },
  paragraph: { label: 'Paragraphe', colorClass: 'bg-slate-100 text-slate-600',     iconPath: 'M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5' },
  quote:     { label: 'Citation',   colorClass: 'bg-slate-100 text-slate-600',     iconPath: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z' },
  callout:   { label: 'Encadré',    colorClass: 'bg-slate-100 text-slate-600',     iconPath: 'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' },
  search:    { label: 'Recherche',  colorClass: 'bg-cyan-100 text-cyan-600',       iconPath: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' },
  image:     { label: 'Image',      colorClass: 'bg-pink-100 text-pink-600',       iconPath: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z' },
  video:     { label: 'Vidéo',      colorClass: 'bg-red-100 text-red-600',         iconPath: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.328l5.603 3.113z' },
  button:    { label: 'Bouton',     colorClass: 'bg-violet-100 text-violet-600',   iconPath: 'M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5' },
  'link-card': { label: 'Lien',    colorClass: 'bg-blue-100 text-blue-600',       iconPath: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
  retenir:   { label: 'À retenir', colorClass: 'bg-emerald-100 text-emerald-600', iconPath: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z' },
  choice:     { label: 'Choix unique',      colorClass: 'bg-indigo-100 text-indigo-600', iconPath: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z' },
  checkboxes: { label: 'Cases à cocher',    colorClass: 'bg-indigo-100 text-indigo-600', iconPath: 'M9 12.75 11.25 15 15 9.75M3.75 12c0-4.556 3.694-8.25 8.25-8.25s8.25 3.694 8.25 8.25-3.694 8.25-8.25 8.25S3.75 16.556 3.75 12Z' },
  dropdown:   { label: 'Liste déroulante', colorClass: 'bg-indigo-100 text-indigo-600', iconPath: 'M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9' },
  scale:      { label: 'Échelle linéaire', colorClass: 'bg-indigo-100 text-indigo-600', iconPath: 'M3 6.75h18M3 12h18M3 17.25h18M6 6.75v0M12 12v0M18 17.25v0' },
  rating:     { label: 'Avis',              colorClass: 'bg-amber-100 text-amber-600',   iconPath: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z' },
}
const blockMeta = computed(() => block.value ? BLOCK_META[block.value.type as BlockType] : null)

// ─── Filters (tab badge counts) ──────────────────────────────────────────────

const filters     = computed<import('@/types/studio').BlockFilter[]>(() => block.value?.filters ?? [])
const compFilters = computed<import('@/types/studio').BlockFilter[]>(() => block.value?.comparisonFilters ?? [])

</script>

<template>
  <!-- ─── Block selected ──────────────────────────────────────────────────── -->
  <div v-if="block" class="flex h-full flex-col overflow-hidden font-sans">

    <!-- Header -->
    <div class="flex shrink-0 items-center gap-3 px-5 pb-3.5 pt-[18px]">
      <span class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[var(--studio-tag)]">
        <svg class="h-4 w-4 text-[var(--studio-tag-ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="blockMeta?.iconPath" />
        </svg>
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[16px] font-extrabold text-[var(--studio-ink)]">{{ blockMeta?.label }}</p>
        <p class="text-[12.5px] text-[var(--studio-muted)]">Configuration du bloc</p>
      </div>
      <button
        class="shrink-0 text-[16px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
        aria-label="Fermer"
        @click="studio.selectBlock(null)"
      >✕</button>
    </div>

    <!-- Tab bar -->
    <div v-if="currentTabs.length > 1" class="shrink-0 px-4 pb-1">
      <div class="flex gap-1 rounded-full bg-[var(--studio-wash)] p-[5px]">
        <button
          v-for="tab in currentTabs" :key="tab.id"
          class="flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full py-[9px] text-[12.5px] font-bold transition-colors"
          :class="activeTab === tab.id ? 'bg-white text-[var(--studio-ink)] shadow-[0_1px_2px_rgba(20,20,30,0.12)]' : 'text-[var(--studio-muted)] hover:text-[var(--studio-ink)]'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.id === 'filters' && filters.length > 0"
            class="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold text-white">{{ filters.length }}</span>
          <span v-if="tab.id === 'comparison' && compFilters.length > 0"
            class="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{{ compFilters.length }}</span>
        </button>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto min-h-0">

      <!-- ══════════════ SEARCH BLOCK ══════════════ -->
      <SearchBlockInspector v-if="isSearch && block && activeTab === 'config'" :block="block" />

      <!-- ══════════════ EDITORIAL BLOCKS (image / video / button / link-card / retenir) ══════════════ -->
      <MediaBlockInspector v-if="isEditorial && block && activeTab === 'editorial'" :block="block" />


      <!-- ══════════════ FORM BLOCKS (choice / checkboxes / dropdown / scale / rating) ══════════════ -->
      <FormBlockInspector v-if="isForm && block && activeTab === 'form'" :block="block" />

      <!-- ══════════════ DATA BLOCKS ══════════════ -->
      <DataBlockInspector v-if="!isText && !isSearch && !isEditorial && !isForm && block" :block="block" :active-tab="activeTab" />

      <!-- ══════════════ TEXT BLOCKS ══════════════ -->
      <RichBlockInspector v-if="isText && block && activeTab === 'style'" :block="block" />

    </div>

    <!-- Footer: duplicate / delete -->
    <div class="px-3 py-3 border-t border-[var(--studio-line)] shrink-0 flex gap-2">
      <button
        class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[var(--studio-muted)] hover:bg-[var(--studio-wash)] rounded-xl transition-colors"
        @click="studio.duplicateBlock(block.id)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
        </svg>
        Dupliquer
      </button>
      <button
        class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        @click="studio.removeBlock(block.id)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        Supprimer
      </button>
    </div>

  </div>

  <!-- ─── Empty state ─────────────────────────────────────────────────────── -->
  <div v-else class="flex h-full flex-col items-center justify-center px-6 text-center">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--studio-tag)]">
      <svg class="h-8 w-8 text-[var(--studio-tag-ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
      </svg>
    </div>
    <p class="text-sm font-bold text-[var(--studio-ink)]">Aucun bloc sélectionné</p>
    <p class="mt-1.5 text-xs leading-relaxed text-[var(--studio-faint)]">Cliquez sur un bloc du canevas<br />pour accéder à sa configuration</p>
  </div>
</template>
