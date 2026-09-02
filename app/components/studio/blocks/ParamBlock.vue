<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { fetchDistinctValues, fetchPublicDistinctValues } from '@/api/studio'
import { blockSourceParams } from '@/composables/useBlockData'
import type { StudioBlock } from '@/types/studio'

/**
 * Bloc « Paramètre » : un sélecteur (pastilles ou liste) alimenté par les
 * valeurs distinctes d'une colonne, qui écrit `studio.pageParams[nom]`. Tous les
 * blocs de la page qui filtrent sur `{{nom}}` se rechargent alors (voir
 * `useBlockData`). Socle de la Brique 1 du plan Statsdata v2.
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()

const datasetId = computed(() => props.block.datasetId)
const column = computed(() => props.block.fieldMapping.paramColumn ?? '')
const paramName = computed(() => props.block.fieldMapping.paramName || column.value)
const control = computed(() => props.block.config.paramControl ?? 'segmented')
const label = computed(() => props.block.config.title || paramName.value || 'Paramètre')
const allowAll = computed(() => props.block.config.paramAllowAll === true)
const allLabel = computed(() => props.block.config.paramAllLabel || 'Tout')
const isConfigured = computed(() => Boolean(datasetId.value && column.value && paramName.value))

const values = ref<string[]>([])
const isLoading = ref(false)
const loadError = ref<string | null>(null)

async function loadValues() {
  const sp = blockSourceParams(props.block)
  if (!sp.urlDatasetId || !column.value) {
    values.value = []
    return
  }
  isLoading.value = true
  loadError.value = null
  try {
    const ctx = { sources: sp.sources, primarySourceId: sp.primarySourceId, joins: sp.joins }
    const docSlug = studio.content?.slug
    values.value = props.readonly && docSlug
      ? await fetchPublicDistinctValues(docSlug, sp.urlDatasetId, column.value, '', [], ctx)
      : await fetchDistinctValues(sp.urlDatasetId, column.value, '', [], ctx)
  } catch {
    loadError.value = 'Valeurs indisponibles'
    values.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [datasetId.value, column.value, JSON.stringify(props.block.sources ?? []), JSON.stringify(props.block.joins ?? [])].join('|'),
  loadValues,
  { immediate: true },
)

const current = computed<string>(() => (paramName.value ? studio.pageParams[paramName.value] ?? '' : ''))

// Amorce la valeur par défaut si le paramètre n'a pas encore été fixé (chargement
// public direct, ou aperçu Studio) — évite une page « vide » tant qu'aucun choix.
watch(
  () => [paramName.value, props.block.config.paramDefault, current.value].join('|'),
  () => {
    const name = paramName.value
    const def = props.block.config.paramDefault
    if (name && def && !current.value) studio.setPageParam(name, def)
  },
  { immediate: true },
)

function select(value: string) {
  const name = paramName.value
  if (!name) return
  if (value === '') {
    const next = { ...studio.pageParams }
    delete next[name]
    studio.setPageParams(next)
  } else {
    studio.setPageParam(name, value)
  }
}

const options = computed(() => {
  const opts = values.value.map((v) => ({ value: v, label: v }))
  return allowAll.value ? [{ value: '', label: allLabel.value }, ...opts] : opts
})
</script>

<template>
  <div class="w-full min-w-0">
    <!-- Non configuré (édition) -->
    <div
      v-if="!isConfigured"
      class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--studio-line-strong)] bg-[var(--studio-note)] py-6 text-[var(--studio-faint)]"
    >
      <svg class="h-7 w-7 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
      </svg>
      <span class="text-xs">Choisir une source et une colonne →</span>
    </div>

    <!-- Contrôle -->
    <div
      v-else
      class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[16px] bg-white px-[18px] py-3.5 shadow-[var(--studio-shadow-card)]"
      :class="readonly ? '' : 'ring-1 ring-[var(--studio-line)]'"
    >
      <span class="shrink-0 text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">{{ label }}</span>

      <span v-if="isLoading" class="text-xs text-[#18181f]/40">Chargement…</span>
      <span v-else-if="loadError" class="text-xs text-red-500">{{ loadError }}</span>
      <span v-else-if="!options.length" class="text-xs text-[#18181f]/40">Aucune valeur</span>

      <!-- Pastilles -->
      <div v-else-if="control === 'segmented'" class="flex flex-wrap gap-1.5">
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="rounded-full border-[1.5px] px-3.5 py-1.5 text-[12.5px] font-bold transition-colors"
          :class="current === opt.value
            ? 'border-transparent bg-[var(--color-primary)] text-white'
            : 'border-[var(--studio-line-strong)] bg-white text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
          @click="select(opt.value)"
        >{{ opt.label }}</button>
      </div>

      <!-- Liste déroulante -->
      <select
        v-else
        class="min-w-0 flex-1 rounded-lg border-[1.5px] border-[#18181f]/12 bg-white px-3 py-1.5 text-[13px] font-semibold text-[#18181f] focus:border-[var(--color-primary)] focus:outline-none"
        :value="current"
        @change="select(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>
  </div>
</template>
