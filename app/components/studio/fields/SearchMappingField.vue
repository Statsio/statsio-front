<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { columnRefLabel, primarySourceId } from '@/lib/studio-columns'
import { blockDatasetIds } from '@/lib/studio-block-sources'
import type { ResultPart, StudioBlock } from '@/types/studio'
import StudioField from './StudioField.vue'
import ResultPartsField from './ResultPartsField.vue'
import SearchColumnsPicker from './SearchColumnsPicker.vue'

const props = defineProps<{ block: StudioBlock }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const fm = computed(() => props.block.fieldMapping)
const searchColumns = computed<string[]>(() => fm.value.searchColumns ?? [])
const searchAltColumns = computed<string[]>(() => fm.value.searchAltColumns ?? [])
const titleParts = computed<ResultPart[]>(() => fm.value.resultTitleParts ?? [])
const descParts = computed<ResultPart[]>(() => fm.value.resultDescParts ?? [])
const separator = computed(() => props.block.config.resultTitleSeparator ?? ' ')

const hasSource = computed(() => Boolean(primarySourceId(props.block)))

watch(
  () => [props.block.id, JSON.stringify(props.block.sources ?? []), JSON.stringify(props.block.joins ?? [])].join('|'),
  () => blockDatasetIds(props.block).forEach((id) => datasets.loadSchema(id)),
  { immediate: true },
)

const label = (ref: string) => columnRefLabel(ref, props.block, datasets)

function setSearchColumns(refs: string[]) {
  studio.updateBlockFieldMapping(props.block.id, { searchColumns: refs.length ? refs : undefined })
}
function setSearchAltColumns(refs: string[]) {
  studio.updateBlockFieldMapping(props.block.id, { searchAltColumns: refs.length ? refs : undefined })
}

function setTitleParts(parts: ResultPart[]) {
  studio.updateBlockFieldMapping(props.block.id, { resultTitleParts: parts.length ? parts : undefined })
}
function setDescParts(parts: ResultPart[]) {
  studio.updateBlockFieldMapping(props.block.id, { resultDescParts: parts.length ? parts : undefined })
}
function setSeparator(v: string) {
  studio.updateBlockConfig(props.block.id, { resultTitleSeparator: v === ' ' ? undefined : v })
}

const titlePreview = computed(() => {
  if (!titleParts.value.length) return searchColumns.value.length ? `‹ ${label(searchColumns.value[0]!)} ›` : '‹ colonne ›'
  return titleParts.value
    .map((p) => `${p.prefix ?? ''}${label(p.ref) || '…'}${p.suffix ?? ''}`)
    .join(separator.value)
})

const SEP_OPTS = [
  { value: ' ', label: 'espace' },
  { value: ' — ', label: '— tiret' },
  { value: ', ', label: ', virgule' },
  { value: ' · ', label: '· point' },
  { value: ' / ', label: '/ slash' },
]
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="!hasSource" class="rounded-xl bg-[var(--studio-note)] px-3.5 py-3 text-[12px] leading-[1.5] text-[var(--studio-faint)]">
      Choisissez d'abord une source de données ci-dessus.
    </p>

    <template v-else>
      <div class="flex flex-col gap-2.5">
        <SearchColumnsPicker
          :block="block"
          :model-value="searchColumns"
          label="Colonnes de recherche"
          hint="forme l'URL"
          add-label="+ Choisir les colonnes"
          @update:model-value="setSearchColumns"
        >
          <template #help>
            Chaque mot tapé doit apparaître dans l'une de ces colonnes. Ex. « prénom » +
            « nom » → recherche « jean dupond ». Ces colonnes forment aussi l'adresse
            de la page générée (<code class="font-mono">/…/jean-dupond</code>).
          </template>
        </SearchColumnsPicker>

        <div class="flex items-center gap-2 py-0.5">
          <span class="h-px flex-1 bg-[var(--studio-line)]" />
          <span class="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--studio-faint)]">ou</span>
          <span class="h-px flex-1 bg-[var(--studio-line)]" />
        </div>

        <SearchColumnsPicker
          :block="block"
          :model-value="searchAltColumns"
          label="Autres colonnes"
          hint="facultatif"
          add-label="+ Colonnes complémentaires"
          :exclude="searchColumns"
          @update:model-value="setSearchAltColumns"
        >
          <template #help>
            Un résultat matche aussi si <strong>toute</strong> la requête est retrouvée
            dans ce groupe (email, SIRET, téléphone…). N'affecte pas l'URL ni l'affichage.
          </template>
        </SearchColumnsPicker>
      </div>

      <StudioField label="Titre du résultat">
        <div class="flex flex-col gap-2">
          <ResultPartsField
            :block="block"
            :model-value="titleParts"
            mode="title"
            @update:model-value="setTitleParts"
          />
          <div v-if="titleParts.length > 1" class="flex items-center gap-2">
            <span class="w-[78px] shrink-0 text-[12px] font-semibold text-[var(--studio-muted)]">Séparateur</span>
            <select
              class="studio-input min-w-0 flex-1 !py-1.5 !text-[12px]"
              :value="separator"
              @change="setSeparator(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="o in SEP_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <p class="rounded-lg bg-[var(--studio-note)] px-2.5 py-1.5 text-[11.5px] text-[var(--studio-faint)]">
            Aperçu : <span class="font-semibold text-[var(--studio-muted)]">{{ titlePreview }}</span>
          </p>
        </div>
      </StudioField>

      <StudioField label="Description" hint="sous le titre">
        <ResultPartsField
          :block="block"
          :model-value="descParts"
          mode="desc"
          @update:model-value="setDescParts"
        />
      </StudioField>
    </template>
  </div>
</template>
