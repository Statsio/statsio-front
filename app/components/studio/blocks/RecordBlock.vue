<script setup lang="ts">
import { computed } from 'vue'
import { useBlockData, rowKey } from '@/composables/useBlockData'
import { formatDisplayValue } from '@/utils/statsDataFormat'
import type { StudioBlock } from '@/types/studio'

/**
 * Fiche d'un enregistrement unique : applique les filtres + le tri du bloc et
 * prend la première ligne (min/max = tri asc/desc). `recordTitleColumn` = titre,
 * les autres colonnes = paires libellé / valeur.
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()

const { data, isLoading, error } = useBlockData(
  () => props.block, props.readonly, () => props.scope,
  () => ({ limit: 1 }),
)

const row = computed<Record<string, unknown> | null>(() => data.value?.rows?.[0] ?? null)

const cols = computed(() => {
  const c = props.block.fieldMapping.columns
  if (c?.length) return c
  return row.value ? Object.keys(row.value) : []
})
const titleCol = computed(() => props.block.fieldMapping.recordTitleColumn ?? cols.value[0] ?? '')
/** Valeur de ligne pour une ref (nue ou `col@<sourceId>`). */
const cellValue = (ref: string) => row.value?.[rowKey(data.value, ref)]
const titleValue = computed(() => cellValue(titleCol.value))
const fields = computed(() =>
  cols.value
    .filter((c) => c !== titleCol.value && cellValue(c) != null && cellValue(c) !== '')
    .map((c) => ({ label: props.block.fieldMapping.columnLabels?.[c] ?? c, value: formatDisplayValue(cellValue(c)) })),
)
</script>

<template>
  <div>
    <div v-if="isLoading" class="py-6 text-center text-sm text-[var(--studio-faint)]">Chargement…</div>
    <div v-else-if="error" class="py-6 text-center text-sm text-red-500">{{ error }}</div>
    <div v-else-if="!block.datasetId" class="py-6 text-center text-xs text-[var(--studio-faint)]">Configurer les données →</div>
    <div v-else-if="!row" class="py-6 text-center text-sm text-[var(--studio-faint)]">Aucun enregistrement</div>

    <template v-else>
      <p v-if="titleCol && titleValue" class="text-[17px] font-extrabold tracking-[-0.01em] text-[var(--studio-ink)]">
        {{ formatDisplayValue(titleValue) }}
      </p>
      <dl class="mt-3 flex flex-col divide-y divide-[var(--studio-line)]">
        <div v-for="f in fields" :key="f.label" class="flex items-baseline justify-between gap-4 py-2">
          <dt class="text-[11.5px] text-[color:color-mix(in_srgb,var(--studio-ink)_55%,transparent)]">{{ f.label }}</dt>
          <dd class="mono min-w-0 truncate text-right text-[12.5px] font-semibold text-[var(--studio-ink)]">{{ f.value }}</dd>
        </div>
      </dl>
    </template>
  </div>
</template>
