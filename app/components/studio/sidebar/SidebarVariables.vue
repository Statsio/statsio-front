<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useActiveEditor } from '@/composables/useActiveEditor'
import type { StudioDocumentPage, StudioBlock, DatasetMeta, DatasetColumn, SearchSource } from '@/types/studio'

const studio   = useStudioStore()
const datasets = useStudioDatasetsStore()
const { insertToken } = useActiveEditor()

// ─── Current page ──────────────────────────────────────────────────────────────

const currentPage = computed(() => studio.pages.find((p: StudioDocumentPage) => p.id === studio.currentPageId))
const isTemplate  = computed(() => !!currentPage.value?.isTemplate)

// ─── All search blocks + which page they target ────────────────────────────────

interface SearchBlockInfo {
  blockId: string
  targetPageId: string
  targetPageTitle: string
  sources: { datasetId: string; datasetName: string; searchColumns: string[] }[]
}

const searchBlockInfos = computed((): SearchBlockInfo[] => {
  return studio.blocks
    .filter((b: StudioBlock) => b.type === 'search' && !!b.fieldMapping.targetPageId)
    .map((b: StudioBlock) => {
      const targetPage = studio.pages.find((p: StudioDocumentPage) => p.id === b.fieldMapping.targetPageId)
      const sources = (b.fieldMapping.searchSources ?? [])
        .filter((s: SearchSource) => s.datasetId)
        .map((s: SearchSource) => ({
          datasetId: s.datasetId,
          datasetName: datasets.readyDatasets.find((d: DatasetMeta) => d.id === s.datasetId)?.name ?? s.datasetId,
          searchColumns: s.columns,
        }))
      // Legacy single-column
      if (sources.length === 0 && b.datasetId && b.fieldMapping.searchColumn) {
        sources.push({
          datasetId: b.datasetId,
          datasetName: datasets.readyDatasets.find((d: DatasetMeta) => d.id === b.datasetId)?.name ?? b.datasetId,
          searchColumns: [b.fieldMapping.searchColumn],
        })
      }
      return {
        blockId: b.id,
        targetPageId: b.fieldMapping.targetPageId!,
        targetPageTitle: targetPage?.title ?? '—',
        sources,
      }
    })
})

// Load all source schemas
watch(searchBlockInfos, (infos: SearchBlockInfo[]) => {
  for (const info of infos) {
    for (const src of info.sources) {
      if (src.datasetId) datasets.loadSchema(src.datasetId)
    }
  }
}, { immediate: true })

// ─── Groups: one per (targetPage + dataset) ────────────────────────────────────

interface VarGroup {
  key: string
  targetPageId: string
  targetPageTitle: string
  isCurrentTemplate: boolean
  datasetId: string
  datasetName: string
  searchColumns: string[]
  allColumns: string[]
}

const varGroups = computed((): VarGroup[] => {
  const groups: VarGroup[] = []
  const seen = new Set<string>()

  for (const info of searchBlockInfos.value) {
    for (const src of info.sources) {
      const key = `${info.targetPageId}::${src.datasetId}`
      if (seen.has(key)) continue
      seen.add(key)

      const schema = datasets.getSchema(src.datasetId)
      const allColumns = schema
        ? schema.columns.map((c: DatasetColumn) => c.name)
        : src.searchColumns // fallback while loading

      groups.push({
        key,
        targetPageId:      info.targetPageId,
        targetPageTitle:   info.targetPageTitle,
        isCurrentTemplate: info.targetPageId === studio.currentPageId && isTemplate.value,
        datasetId:         src.datasetId,
        datasetName:       src.datasetName,
        searchColumns:     src.searchColumns,
        allColumns,
      })
    }
  }

  // Sort: current template page first
  return groups.sort((a, b) => Number(b.isCurrentTemplate) - Number(a.isCurrentTemplate))
})

function tokenDisplay(name: string) {
  return '{' + '{' + name + '}' + '}'
}

function goToPage(pageId: string) {
  studio.switchPage(pageId)
}
</script>

<template>
  <div class="flex flex-col h-full">

    <!-- Empty state: no search block configured -->
    <div v-if="varGroups.length === 0" class="flex flex-col items-center justify-center gap-3 h-full py-16 px-5 text-center">
      <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
        <svg class="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      </div>
      <div>
        <p class="text-sm font-semibold text-slate-700">Aucune variable</p>
        <p class="text-xs text-slate-400 mt-1 leading-relaxed">
          Ajoutez un bloc Recherche sur une page et configurez une page cible template pour créer des variables dynamiques.
        </p>
      </div>
    </div>

    <!-- Variable groups -->
    <div v-else class="flex flex-col">

      <!-- Info banner -->
      <div class="px-4 py-3 bg-amber-50/60 border-b border-amber-100">
        <p class="text-[11px] text-amber-700 leading-relaxed">
          Cliquez sur un token pour l'insérer dans le champ actif. Utilisez-les dans les filtres, titres de blocs et blocs texte.
        </p>
      </div>

      <div v-for="group in varGroups" :key="group.key" class="border-b border-slate-100 last:border-0">

        <!-- Group header -->
        <div class="px-4 pt-4 pb-2 flex flex-col gap-0.5">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <div
                class="w-2 h-2 rounded-full shrink-0"
                :class="group.isCurrentTemplate ? 'bg-amber-400' : 'bg-slate-300'"
              />
              <p class="text-[11px] font-bold text-slate-700 truncate">{{ group.targetPageTitle }}</p>
              <span
                v-if="group.isCurrentTemplate"
                class="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full"
              >page active</span>
            </div>
            <button
              v-if="!group.isCurrentTemplate"
              class="shrink-0 text-[10px] text-slate-400 hover:text-primary transition-colors"
              @click="goToPage(group.targetPageId)"
            >Aller →</button>
          </div>
          <p class="text-[10px] text-slate-400 pl-3.5 truncate">{{ group.datasetName }}</p>
        </div>

        <!-- Tokens -->
        <div class="px-4 pb-4 flex flex-wrap gap-1.5">
          <button
            v-for="col in group.allColumns"
            :key="col"
            class="group relative flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-all"
            :class="[
              group.searchColumns.includes(col)
                ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                : 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50/60 hover:text-amber-700',
              studio.pageParams[col] ? 'ring-1 ring-amber-300' : '',
            ]"
            :title="studio.pageParams[col] ? `Valeur active : ${studio.pageParams[col]}` : 'Cliquer pour insérer'"
            @mousedown.prevent="insertToken(col)"
          >
            <!-- Search column indicator -->
            <span
              v-if="group.searchColumns.includes(col)"
              class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
              title="Colonne de recherche"
            />
            {{ tokenDisplay(col) }}
            <!-- Active value badge -->
            <span
              v-if="studio.pageParams[col]"
              class="ml-0.5 text-[9px] font-sans font-normal text-amber-600 bg-amber-100 rounded px-1 max-w-[50px] truncate"
            >{{ studio.pageParams[col] }}</span>
          </button>
        </div>

        <!-- Legend -->
        <div v-if="group.allColumns.length > 0" class="px-4 pb-3 flex items-center gap-3">
          <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span class="text-[9px] text-slate-400">Colonne de recherche</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-3 h-px bg-slate-200 rounded" />
            <span class="text-[9px] text-slate-400">Colonne disponible</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
