<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { isTextBlock } from '@/types/studio'
import FormBlockInspector from '@/components/studio/inspector/FormBlockInspector.vue'
import MediaBlockInspector from '@/components/studio/inspector/MediaBlockInspector.vue'
import RichBlockInspector from '@/components/studio/inspector/RichBlockInspector.vue'
import SearchBlockInspector from '@/components/studio/inspector/SearchBlockInspector.vue'
import ParamBlockInspector from '@/components/studio/inspector/ParamBlockInspector.vue'
import DataBlockInspector from '@/components/studio/inspector/DataBlockInspector.vue'
import RecordBlockInspector from '@/components/studio/inspector/RecordBlockInspector.vue'
import SdEmbedBlockInspector from '@/components/studio/inspector/SdEmbedBlockInspector.vue'
import LoopBlockInspector from '@/components/studio/inspector/LoopBlockInspector.vue'
import IfBlockInspector from '@/components/studio/inspector/IfBlockInspector.vue'
import LayoutBlockInspector from '@/components/studio/inspector/LayoutBlockInspector.vue'
import { BLOCK_META, type BlockType } from '@/types/studio'

const studio = useStudioStore()

const block  = computed(() => studio.selectedBlock)
const isText   = computed(() => block.value ? isTextBlock(block.value.type) : false)

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const EDITORIAL_TYPES = ['image', 'video', 'button', 'link-card', 'retenir', 'map', 'field-grid'] as const
const FORM_TYPES = ['choice', 'checkboxes', 'dropdown', 'scale', 'rating'] as const
const RECORD_TYPES = ['record', 'related'] as const

const DATA_TABS      = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'style', label: 'Style' }]
const KPI_TABS       = [{ id: 'data', label: 'Données' }, { id: 'filters', label: 'Filtres' }, { id: 'comparison', label: 'Comparaison' }, { id: 'style', label: 'Style' }]
const LOOP_TABS      = [{ id: 'data', label: 'Boucle' }, { id: 'filters', label: 'Filtres' }, { id: 'style', label: 'Style' }]
const IF_TABS        = [{ id: 'condition', label: 'Condition' }]
const LAYOUT_TABS    = [{ id: 'layout', label: 'Disposition' }]
const TEXT_TABS      = [{ id: 'style', label: 'Style' }]
const SEARCH_TABS    = [{ id: 'config', label: 'Configuration' }]
const PARAM_TABS     = [{ id: 'config', label: 'Configuration' }]
const SDEMBED_TABS   = [{ id: 'config', label: 'Configuration' }]
const EDITORIAL_TABS = [{ id: 'editorial', label: 'Contenu' }]
const FORM_TABS      = [{ id: 'form', label: 'Question' }]

const isSearch    = computed(() => block.value?.type === 'search')
const isParam     = computed(() => block.value?.type === 'param')
const isSdEmbed   = computed(() => block.value?.type === 'sd-embed')
const isLoop      = computed(() => block.value?.type === 'loop')
const isCondition = computed(() => block.value?.type === 'if')
const isLayout    = computed(() => block.value?.type === 'layout')
const isEditorial = computed(() => EDITORIAL_TYPES.includes(block.value?.type as typeof EDITORIAL_TYPES[number]))
const isForm      = computed(() => FORM_TYPES.includes(block.value?.type as typeof FORM_TYPES[number]))
const isRecord    = computed(() => RECORD_TYPES.includes(block.value?.type as typeof RECORD_TYPES[number]))

const currentTabs = computed(() => {
  if (isText.value) return TEXT_TABS
  if (isSearch.value) return SEARCH_TABS
  if (isParam.value) return PARAM_TABS
  if (isSdEmbed.value) return SDEMBED_TABS
  if (isEditorial.value) return EDITORIAL_TABS
  if (isForm.value) return FORM_TABS
  if (isLoop.value) return LOOP_TABS
  if (isCondition.value) return IF_TABS
  if (isLayout.value) return LAYOUT_TABS
  if (isRecord.value) return DATA_TABS
  if (block.value?.type === 'kpi') return KPI_TABS
  return DATA_TABS
})

const activeTab = ref('data')

watch([() => block.value?.id, isText, isSearch, isParam, isSdEmbed, isCondition, isLayout, isEditorial, isForm], () => {
  if (isText.value) activeTab.value = 'style'
  else if (isSearch.value) activeTab.value = 'config'
  else if (isParam.value) activeTab.value = 'config'
  else if (isSdEmbed.value) activeTab.value = 'config'
  else if (isCondition.value) activeTab.value = 'condition'
  else if (isLayout.value) activeTab.value = 'layout'
  else if (isEditorial.value) activeTab.value = 'editorial'
  else if (isForm.value) activeTab.value = 'form'
  else activeTab.value = 'data'
}, { immediate: true })

// ─── Block metadata ───────────────────────────────────────────────────────────

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

      <!-- ══════════════ PARAM BLOCK ══════════════ -->
      <ParamBlockInspector v-if="isParam && block && activeTab === 'config'" :block="block" />

      <!-- ══════════════ BLOC STATSDATA (sd-embed) ══════════════ -->
      <SdEmbedBlockInspector v-if="isSdEmbed && block && activeTab === 'config'" :block="block" />

      <!-- ══════════════ IF BLOCK ══════════════ -->
      <IfBlockInspector v-if="isCondition && block && activeTab === 'condition'" :block="block" />

      <!-- ══════════════ EDITORIAL BLOCKS (image / video / button / link-card / retenir) ══════════════ -->
      <MediaBlockInspector v-if="isEditorial && block && activeTab === 'editorial'" :block="block" />


      <!-- ══════════════ FORM BLOCKS (choice / checkboxes / dropdown / scale / rating) ══════════════ -->
      <FormBlockInspector v-if="isForm && block && activeTab === 'form'" :block="block" />

      <!-- ══════════════ LOOP BLOCK ══════════════ -->
      <LoopBlockInspector v-if="isLoop && block" :block="block" :active-tab="activeTab" />

      <!-- ══════════════ LAYOUT BLOCK (Disposition) ══════════════ -->
      <LayoutBlockInspector v-if="isLayout && block && activeTab === 'layout'" :block="block" />

      <!-- ══════════════ RECORD / RELATED ══════════════ -->
      <RecordBlockInspector v-if="isRecord && block" :block="block" :active-tab="activeTab" />

      <!-- ══════════════ DATA BLOCKS ══════════════ -->
      <DataBlockInspector v-if="!isText && !isSearch && !isParam && !isSdEmbed && !isEditorial && !isForm && !isLoop && !isCondition && !isLayout && !isRecord && block" :block="block" :active-tab="activeTab" />

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
