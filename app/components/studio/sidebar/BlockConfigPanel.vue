<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useBlockConfigTabs } from '@/composables/useBlockConfigTabs'
import FormBlockInspector from '@/components/studio/inspector/FormBlockInspector.vue'
import MediaBlockInspector from '@/components/studio/inspector/MediaBlockInspector.vue'
import RichBlockInspector from '@/components/studio/inspector/RichBlockInspector.vue'
import SearchBlockInspector from '@/components/studio/inspector/SearchBlockInspector.vue'
import ParamBlockInspector from '@/components/studio/inspector/ParamBlockInspector.vue'
import DataBlockInspector from '@/components/studio/inspector/DataBlockInspector.vue'
import MapBlockInspector from '@/components/studio/inspector/MapBlockInspector.vue'
import RecordBlockInspector from '@/components/studio/inspector/RecordBlockInspector.vue'
import SdEmbedBlockInspector from '@/components/studio/inspector/SdEmbedBlockInspector.vue'
import LoopBlockInspector from '@/components/studio/inspector/LoopBlockInspector.vue'
import IfBlockInspector from '@/components/studio/inspector/IfBlockInspector.vue'
import LayoutBlockInspector from '@/components/studio/inspector/LayoutBlockInspector.vue'
import FilterDrillInPanel from '@/components/studio/filters/FilterDrillInPanel.vue'
import ColumnDrillInPanel from '@/components/studio/filters/ColumnDrillInPanel.vue'
import SourceDrillInPanel from '@/components/studio/filters/SourceDrillInPanel.vue'
import { BLOCK_META, type BlockType } from '@/types/studio'
import { readFilterGroups, countConditions } from '@/lib/studio-filter-groups'
import { DATA_BLOCK_TYPES } from '@/lib/studio-palette'
import { useStudioToast } from '@/composables/useStudioToast'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'

const studio = useStudioStore()

const {
  block,
  isText,
  isSearch,
  isParam,
  isMap,
  isSdEmbed,
  isLoop,
  isCondition,
  isLayout,
  isEditorial,
  isForm,
  isRecord,
  currentTabs,
  activeTab,
} = useBlockConfigTabs()

// ─── Block metadata ───────────────────────────────────────────────────────────

const blockMeta = computed(() => block.value ? BLOCK_META[block.value.type as BlockType] : null)
const isData = computed(() => (block.value ? DATA_BLOCK_TYPES.has(block.value.type) : false))

/** « Bloc · <section> » et « nᵉ de la section » pour l'en-tête et le pied. */
const sectionOf = computed(() => {
  const b = block.value
  if (!b) return null
  return studio.sections.find((s) => b.zoneId.startsWith(`${s.id}-`)) ?? null
})
const sectionLabel = computed(() => {
  const s = sectionOf.value
  const raw = (s?.kicker || s?.title || '').replace(/<[^>]+>/g, '').trim()
  return raw || (studio.content?.type === 'survey' ? 'étape' : 'section')
})
const position = computed(() => {
  const b = block.value
  if (!b) return 0
  return (studio.blocksByZone[b.zoneId] ?? []).findIndex((x) => x.id === b.id) + 1
})

const { show } = useStudioToast()
function removeSelected() {
  const b = block.value
  if (!b) return
  const label = blockMeta.value?.label ?? 'Bloc'
  studio.removeBlock(b.id)
  show(`Bloc « ${label} » supprimé`, 'Annuler', () => studio.undo())
}

// ─── Filters (tab badge counts) ──────────────────────────────────────────────

const filtersCount     = computed(() => (block.value ? countConditions(readFilterGroups(block.value, 'primary')) : 0))
const compFiltersCount = computed(() => (block.value ? countConditions(readFilterGroups(block.value, 'comparison')) : 0))

</script>

<template>
  <!-- ─── Block selected ──────────────────────────────────────────────────── -->
  <div v-if="block" class="flex h-full flex-col overflow-hidden font-sans">

    <!-- En-tête -->
    <div class="flex shrink-0 flex-col gap-3.5 px-4 pt-4">
      <div class="st-ins-h">
        <span class="st-tg" :class="{ 'st-tg--data': isData }">
          <DsTypeGlyph v-if="block.type === 'sd-embed'" kind="statsdata" :size="20" mono />
          <StudioIcon v-else :name="block.type" :size="20" />
        </span>
        <div class="min-w-0 flex-1">
          <span class="st-lbl block truncate">Bloc · {{ sectionLabel }}</span>
          <h2 class="st-h2 truncate">{{ blockMeta?.label }}</h2>
        </div>
        <button class="st-ibtn" type="button" aria-label="Fermer (Échap)" title="Fermer (Échap)" @click="studio.selectBlock(null)">
          <StudioIcon name="x" :size="16" />
        </button>
      </div>

      <!-- Onglets -->
      <div v-if="currentTabs.length > 1" class="flex gap-1 border-b-2 border-[var(--ds-divide)]" role="tablist">
        <button
          v-for="tab in currentTabs" :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          class="-mb-[2px] flex items-center gap-1.5 whitespace-nowrap border-b-[3px] px-2.5 py-2 text-[13px] font-bold transition-colors"
          :class="activeTab === tab.id ? 'border-[var(--ds-ol)] text-[var(--ds-accent)]' : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--ds-accent)]'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.id === 'filters' && filtersCount > 0" class="st-badge !mt-0">{{ filtersCount }}</span>
          <span v-if="tab.id === 'comparison' && compFiltersCount > 0" class="st-badge !mt-0">{{ compFiltersCount }}</span>
        </button>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="relative flex-1 min-h-0">

      <!-- Drill-in (recouvre le corps de l'inspecteur) -->
      <FilterDrillInPanel />
      <ColumnDrillInPanel />
      <SourceDrillInPanel />

      <div class="h-full overflow-y-auto">

      <!-- ══════════════ SEARCH BLOCK ══════════════ -->
      <SearchBlockInspector v-if="isSearch && block" :block="block" :active-tab="activeTab" />

      <!-- ══════════════ PARAM BLOCK ══════════════ -->
      <ParamBlockInspector v-if="isParam && block" :block="block" :active-tab="activeTab" />

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

      <!-- ══════════════ MAP BLOCK ══════════════ -->
      <MapBlockInspector v-if="isMap && block" :block="block" :active-tab="activeTab" />

      <!-- ══════════════ DATA BLOCKS ══════════════ -->
      <DataBlockInspector v-if="!isText && !isSearch && !isParam && !isSdEmbed && !isEditorial && !isForm && !isLoop && !isCondition && !isLayout && !isRecord && !isMap && block" :block="block" :active-tab="activeTab" />

      <!-- ══════════════ TEXT BLOCKS ══════════════ -->
      <RichBlockInspector v-if="isText && block && activeTab === 'style'" :block="block" />

      </div>
    </div>

    <!-- Pied -->
    <div class="st-ins-foot mx-4 mb-3 shrink-0">
      <span class="st-meta">#{{ block.id.slice(0, 6) }} · {{ position }}ᵉ de {{ studio.content?.type === 'survey' ? 'l’étape' : 'la section' }}</span>
      <span class="flex items-center gap-3">
        <button type="button" class="st-addl !py-0" :disabled="block.locked" @click="studio.duplicateBlock(block.id)">
          <StudioIcon name="dup" :size="14" />Dupliquer
        </button>
        <button type="button" class="st-danger" :disabled="block.locked" @click="removeSelected">
          <StudioIcon name="trash" :size="14" />Supprimer
        </button>
      </span>
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
