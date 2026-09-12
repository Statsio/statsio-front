<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { columnRefLabel, primarySourceId } from '@/lib/studio-columns'
import { blockDatasetIds } from '@/lib/studio-block-sources'
import {
  isUnionBlock,
  mergeResultPartsForSource,
  mergeSearchColumnsForSource,
  resultPartsForSource,
  searchColumnsForSource,
  unionSourceIds,
} from '@/lib/studio-search'
import type { BlockSource, ResultPart, StudioBlock } from '@/types/studio'
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
const primaryId = computed(() => primarySourceId(props.block))

const hasSource = computed(() => Boolean(primaryId.value))
const unionMode = computed(() => isUnionBlock(props.block))
const unionSources = computed(() => {
  const byId = new Map((props.block.sources ?? []).map((s) => [s.id, s]))
  return unionSourceIds(props.block)
    .map((id) => byId.get(id))
    .filter((s): s is BlockSource => Boolean(s))
})

watch(
  () => [props.block.id, JSON.stringify(props.block.sources ?? []), JSON.stringify(props.block.joins ?? [])].join('|'),
  () => blockDatasetIds(props.block).forEach((id) => datasets.loadSchema(id)),
  { immediate: true },
)

const label = (ref: string) => columnRefLabel(ref, props.block, datasets)

function sourceLabel(s: BlockSource): string {
  return s.alias || datasets.readyDatasets.find((d) => d.id === s.datasetId)?.name || s.id
}

function setSearchColumns(refs: string[]) {
  studio.updateBlockFieldMapping(props.block.id, { searchColumns: refs.length ? refs : undefined })
}
function setSearchColumnsForSource(sourceId: string, refs: string[]) {
  setSearchColumns(mergeSearchColumnsForSource(searchColumns.value, sourceId, refs, primaryId.value))
}
function setSearchAltColumns(refs: string[]) {
  studio.updateBlockFieldMapping(props.block.id, { searchAltColumns: refs.length ? refs : undefined })
}

function setTitleParts(parts: ResultPart[]) {
  studio.updateBlockFieldMapping(props.block.id, { resultTitleParts: parts.length ? parts : undefined })
}
function setTitlePartsForSource(sourceId: string, parts: ResultPart[]) {
  setTitleParts(mergeResultPartsForSource(titleParts.value, sourceId, parts, primaryId.value))
}
function setDescParts(parts: ResultPart[]) {
  studio.updateBlockFieldMapping(props.block.id, { resultDescParts: parts.length ? parts : undefined })
}
function setDescPartsForSource(sourceId: string, parts: ResultPart[]) {
  setDescParts(mergeResultPartsForSource(descParts.value, sourceId, parts, primaryId.value))
}
function setSeparator(v: string) {
  studio.updateBlockConfig(props.block.id, { resultTitleSeparator: v === ' ' ? undefined : v })
}

function titlePreviewFor(parts: ResultPart[], fallbackRefs: string[]): string {
  if (!parts.length) return fallbackRefs.length ? `‹ ${label(fallbackRefs[0]!)} ›` : '‹ colonne ›'
  return parts
    .map((p) => `${p.prefix ?? ''}${label(p.ref) || '…'}${p.suffix ?? ''}`)
    .join(separator.value)
}

const titlePreview = computed(() => titlePreviewFor(titleParts.value, searchColumns.value))

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
        <template v-if="unionMode">
          <p class="text-[11px] leading-relaxed text-[var(--studio-faint)]">
            Mode UNION : colonnes d'identité, titre et description se configurent par source.
            Au clic, seuls les paramètres de la source d'origine sont posés.
          </p>
          <SearchColumnsPicker
            v-for="s in unionSources"
            :key="s.id"
            :block="block"
            :source-id="s.id"
            :model-value="searchColumnsForSource(block, s.id)"
            :label="`Colonnes de recherche — ${sourceLabel(s)}`"
            hint="forme l'URL de cette source"
            add-label="+ Choisir les colonnes"
            @update:model-value="setSearchColumnsForSource(s.id, $event)"
          />
        </template>
        <SearchColumnsPicker
          v-else
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

      <template v-if="unionMode">
        <div
          v-for="s in unionSources"
          :key="`display-${s.id}`"
          class="flex flex-col gap-3 rounded-xl border border-[var(--studio-line)] p-3"
        >
          <span class="text-[12px] font-extrabold text-[var(--studio-ink)]">{{ sourceLabel(s) }}</span>
          <StudioField :label="`Titre — ${sourceLabel(s)}`">
            <div class="flex flex-col gap-2">
              <ResultPartsField
                :block="block"
                :source-id="s.id"
                :model-value="resultPartsForSource(titleParts, s.id, primaryId)"
                mode="title"
                @update:model-value="setTitlePartsForSource(s.id, $event)"
              />
              <div
                v-if="resultPartsForSource(titleParts, s.id, primaryId).length > 1"
                class="flex items-center gap-2"
              >
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
                Aperçu :
                <span class="font-semibold text-[var(--studio-muted)]">
                  {{ titlePreviewFor(resultPartsForSource(titleParts, s.id, primaryId), searchColumnsForSource(block, s.id)) }}
                </span>
              </p>
            </div>
          </StudioField>
          <StudioField :label="`Description — ${sourceLabel(s)}`" hint="sous le titre">
            <ResultPartsField
              :block="block"
              :source-id="s.id"
              :model-value="resultPartsForSource(descParts, s.id, primaryId)"
              mode="desc"
              @update:model-value="setDescPartsForSource(s.id, $event)"
            />
          </StudioField>
        </div>
      </template>
      <template v-else>
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
    </template>
  </div>
</template>
