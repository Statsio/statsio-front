<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { fetchDistinctValues, fetchPublicDistinctValues } from '@/api/studio'
import { interpolateTokens } from '@/lib/studio-tokens'
import { loopZoneId } from '@/types/studio'
import type { StudioBlock, BlockFilter } from '@/types/studio'
import BlockRenderer from './BlockRenderer.vue'
import BlockCard from './BlockCard.vue'
import CanvasZone from '@/components/studio/canvas/CanvasZone.vue'

const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()

const HARD_CAP = 50

const zoneId = computed(() => loopZoneId(props.block.id))
const children = computed<StudioBlock[]>(() => studio.blocksByZone[zoneId.value] ?? [])

const loopColumn = computed(() => props.block.fieldMapping.loopColumn ?? '')
const loopVar = computed(() => props.block.fieldMapping.loopVar || 'item')
const limit = computed(() => Math.min(props.block.config.loopLimit ?? 20, HARD_CAP))

const layoutCols = computed(() => {
  switch (props.block.config.loopLayout) {
    case '2-cols': return 2
    case '3-cols': return 3
    default: return 1
  }
})

// ─── Valeurs d'itération ──────────────────────────────────────────────────────

const values = ref<string[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

async function loadValues() {
  const datasetId = props.block.datasetId
  const col = loopColumn.value
  if (!datasetId || !col) {
    values.value = []
    return
  }
  isLoading.value = true
  error.value = null
  try {
    const filters = (props.block.filters ?? [])
      .filter((f: BlockFilter) => f.column && f.value !== '')
      .map((f: BlockFilter) => ({ ...f, value: interpolateTokens(f.value, { ...studio.pageParams, ...props.scope }) }))
    const docSlug = studio.content?.slug
    values.value = props.readonly && docSlug
      ? await fetchPublicDistinctValues(docSlug, datasetId, col, '', filters)
      : await fetchDistinctValues(datasetId, col, '', filters)
  } catch {
    error.value = 'Impossible de charger les valeurs de la boucle.'
    values.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [
    props.block.datasetId,
    loopColumn.value,
    JSON.stringify(props.block.filters ?? []),
    JSON.stringify(props.scope ?? null),
    JSON.stringify(studio.pageParams),
  ].join('|'),
  loadValues,
  { immediate: true },
)

const iterations = computed(() => values.value.slice(0, limit.value))
const overflow = computed(() => Math.max(0, values.value.length - limit.value))

function scopeFor(value: string): Record<string, string> {
  return { ...props.scope, [loopVar.value]: value }
}

const summary = computed(() => {
  if (!props.block.datasetId) return 'Choisir une source et une colonne'
  if (!loopColumn.value) return 'Choisir la colonne à parcourir'
  if (isLoading.value) return 'Chargement des valeurs…'
  if (error.value) return error.value
  if (!values.value.length) return 'Aucune valeur trouvée'
  const preview = values.value.slice(0, 6).join(', ')
  return `${values.value.length} itération${values.value.length > 1 ? 's' : ''} · ${loopVar.value} = ${preview}${values.value.length > 6 ? '…' : ''}`
})
</script>

<template>
  <!-- ══════════ ÉDITEUR ══════════ -->
  <div v-if="!readonly" class="flex flex-col gap-3">
    <div class="flex items-center gap-2 rounded-xl bg-[var(--studio-wash)] px-3 py-2">
      <svg class="h-4 w-4 shrink-0 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
      <span class="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--studio-muted)]">
        Boucle · <span class="font-mono">{{ '{' + '{' + loopVar + '}' + '}' }}</span> — {{ summary }}
      </span>
    </div>

    <!-- La zone gère elle-même le drop palette + le drag des blocs existants ;
         la zone de section parente s'efface quand le drag vise cette zone imbriquée
         (voir CanvasZone.targetsNestedZone). -->
    <div class="rounded-2xl bg-[var(--studio-wash)]/40 p-1" @click.stop>
      <CanvasZone :zone-id="zoneId" :col-index="0" nested />
    </div>
  </div>

  <!-- ══════════ LECTURE SEULE (publié / aperçu) ══════════ -->
  <template v-else>
    <div v-if="isLoading" class="py-6 text-center text-sm text-[#18181f]/45">Chargement…</div>
    <div v-else-if="error" class="py-6 text-center text-sm text-red-500">{{ error }}</div>
    <div v-else-if="!children.length" class="py-6 text-center text-sm text-[#18181f]/45">Boucle vide</div>
    <div v-else-if="!iterations.length" class="py-6 text-center text-sm text-[#18181f]/45">Aucune valeur à parcourir</div>

    <div
      v-else
      class="grid gap-3 sm:gap-4"
      :style="{ gridTemplateColumns: `repeat(${layoutCols}, minmax(0, 1fr))` }"
    >
      <div v-for="value in iterations" :key="value" class="flex min-w-0 flex-col gap-3 sm:gap-4">
        <BlockCard
          v-for="child in children"
          :key="child.id + '::' + value"
          :block="child"
          :scope="scopeFor(value)"
        >
          <BlockRenderer :block="child" :readonly="true" :scope="scopeFor(value)" />
        </BlockCard>
      </div>
    </div>

    <p v-if="overflow > 0" class="mt-2 text-center text-[11px] text-[#18181f]/40">
      + {{ overflow }} itération{{ overflow > 1 ? 's' : '' }} masquée{{ overflow > 1 ? 's' : '' }} (limite {{ limit }})
    </p>
  </template>
</template>
