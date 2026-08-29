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

// Blocs qui alimentent un paramètre de la page courante : blocs `param` posés sur
// la page + blocs `search` qui la ciblent (ou n'ont pas de cible = filtrent la page).
const feedingBlocks = computed(() => {
  const pageId = studio.currentPageId
  return studio.blocks.filter((b: StudioBlock) => {
    if (b.type === 'param') return true
    if (b.type === 'search') return !b.fieldMapping.targetPageId || b.fieldMapping.targetPageId === pageId
    return false
  })
})

watch(feedingBlocks, (blocks: StudioBlock[]) => {
  for (const block of blocks) {
    if (block.datasetId) datasets.loadSchema(block.datasetId)
    for (const src of block.fieldMapping.searchSources ?? []) {
      if (src.datasetId) datasets.loadSchema(src.datasetId)
    }
  }
}, { immediate: true })

const availableTokens = computed((): string[] => {
  const tokens = new Set<string>()
  // Paramètres déclarés sur la page (bloc « Paramètre », migration template…).
  for (const p of currentPage.value?.params ?? []) if (p.name) tokens.add(p.name)
  if (currentPage.value?.paramName) tokens.add(currentPage.value.paramName)
  // Colonnes des sources de recherche (elles deviennent des params au clic sur un résultat).
  for (const block of feedingBlocks.value) {
    for (const src of block.fieldMapping.searchSources ?? []) {
      const schema = src.datasetId ? datasets.getSchema(src.datasetId) : null
      if (schema) for (const col of schema.columns) tokens.add(col.name)
      else for (const col of src.columns) tokens.add(col)
    }
    if (block.datasetId && block.fieldMapping.searchColumn) tokens.add(block.fieldMapping.searchColumn)
  }
  return Array.from(tokens).sort()
})

function tokenDisplay(name: string) {
  return '{' + '{' + name + '}' + '}'
}
</script>

<template>
  <div v-if="availableTokens.length > 0" class="shrink-0 border-t border-[var(--studio-line)] px-3 py-2.5">
    <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--studio-faint)]">Paramètres de la page</p>
    <div class="flex flex-wrap gap-1">
      <button
        v-for="token in availableTokens"
        :key="token"
        class="group flex select-none items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-mono font-semibold transition-all"
        :class="studio.pageParams[token]
          ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
          : 'border-[var(--studio-line-strong)] bg-[var(--studio-note)] text-[var(--studio-muted)] hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'"
        :title="studio.pageParams[token] ? `= ${studio.pageParams[token]}` : 'Cliquer pour insérer dans le champ actif'"
        @mousedown.prevent="insertToken(token)"
      >
        {{ tokenDisplay(token) }}
        <span
          v-if="studio.pageParams[token]"
          class="max-w-[60px] truncate font-sans text-[9px] font-normal text-amber-600"
        >= {{ studio.pageParams[token] }}</span>
      </button>
    </div>
  </div>
</template>
