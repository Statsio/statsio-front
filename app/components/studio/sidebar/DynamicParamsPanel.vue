<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useActiveEditor } from '@/composables/useActiveEditor'
import type { StudioDocumentPage, StudioBlock } from '@/types/studio'

const studio   = useStudioStore()
const datasets = useStudioDatasetsStore()
const { insertToken } = useActiveEditor()

const currentPage = computed(() => studio.pages.find((p: StudioDocumentPage) => p.id === studio.currentPageId))
const isTemplate  = computed(() => !!currentPage.value?.isTemplate)

// All search blocks targeting this template page
const searchBlocks = computed(() => {
  if (!isTemplate.value) return []
  const thisPageId = studio.currentPageId
  return studio.blocks.filter(
    (b: StudioBlock) => b.type === 'search' && b.fieldMapping.targetPageId === thisPageId,
  )
})

// Load schemas for every source dataset referenced by those search blocks
watch(searchBlocks, (blocks: StudioBlock[]) => {
  for (const block of blocks) {
    for (const src of block.fieldMapping.searchSources ?? []) {
      if (src.datasetId) datasets.loadSchema(src.datasetId)
    }
    if (block.datasetId) datasets.loadSchema(block.datasetId)
  }
}, { immediate: true })

// ALL columns from ALL source datasets (not just the search columns)
const availableTokens = computed((): string[] => {
  if (!isTemplate.value) return []
  const tokens = new Set<string>()
  for (const block of searchBlocks.value) {
    // New multi-source config → use full schema of each source dataset
    for (const src of block.fieldMapping.searchSources ?? []) {
      const schema = src.datasetId ? datasets.getSchema(src.datasetId) : null
      if (schema) {
        for (const col of schema.columns) tokens.add(col.name)
      } else {
        // Schema not yet loaded — show configured search columns as fallback
        for (const col of src.columns) tokens.add(col)
      }
    }
    // Legacy single-column config
    if (block.datasetId && block.fieldMapping.searchColumn) {
      const schema = datasets.getSchema(block.datasetId)
      if (schema) {
        for (const col of schema.columns) tokens.add(col.name)
      } else {
        tokens.add(block.fieldMapping.searchColumn)
      }
    }
  }
  return Array.from(tokens).sort()
})

function tokenDisplay(name: string) {
  return '{' + '{' + name + '}' + '}'
}
</script>

<template>
  <div v-if="isTemplate && availableTokens.length > 0" class="border-t border-slate-100 px-3 py-2.5 shrink-0">
    <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Variables disponibles</p>
    <div class="flex flex-wrap gap-1">
      <button
        v-for="token in availableTokens"
        :key="token"
        class="group flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all text-[11px] font-mono font-semibold select-none"
        :class="studio.pageParams[token]
          ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700'"
        :title="studio.pageParams[token] ? `= ${studio.pageParams[token]}` : 'Cliquer pour insérer dans le champ actif'"
        @mousedown.prevent="insertToken(token)"
      >
        {{ tokenDisplay(token) }}
        <span
          v-if="studio.pageParams[token]"
          class="text-[9px] font-sans font-normal text-amber-600 max-w-[60px] truncate"
        >= {{ studio.pageParams[token] }}</span>
      </button>
    </div>
  </div>
</template>
