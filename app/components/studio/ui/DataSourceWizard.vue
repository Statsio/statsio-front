<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { StudioBlock, DatasetMeta, BlockJoin, BlockSource } from '@/types/studio'
import { BLOCK_META } from '@/types/studio'
import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'
import ColumnButton from '@/components/studio/ui/ColumnButton.vue'
import { primarySourceId } from '@/lib/studio-columns'
import { blockDatasetIds, suggestJoinKeys } from '@/lib/studio-block-sources'

const props = defineProps<{ show: boolean; block: StudioBlock }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const step = ref<1 | 2>(1)
const dsFilter = ref('')

const blockSources = computed<BlockSource[]>(() => props.block.sources ?? [])
const primaryId = computed(() => primarySourceId(props.block))
const joins = computed<BlockJoin[]>(() => props.block.joins ?? [])

const meta = computed(() => BLOCK_META[props.block.type])

watch(() => props.show, (open) => {
  if (!open) return
  dsFilter.value = ''
  blockDatasetIds(props.block).forEach((id) => datasets.loadSchema(id))
  datasets.readyDatasets.forEach((d) => datasets.loadSchema(d.id))
  step.value = blockSources.value.length >= 2 ? 2 : 1
  if (step.value === 2) ensureJoins()
}, { immediate: true })

// ─── Étape 1 : sélection multi-sources ──────────────────────────────────────

const filteredDatasets = computed<DatasetMeta[]>(() => {
  const q = dsFilter.value.trim().toLowerCase()
  const list = datasets.readyDatasets
  return q ? list.filter((d) => d.name.toLowerCase().includes(q)) : list
})

function sourceForDataset(datasetId: string): BlockSource | undefined {
  return blockSources.value.find((s) => s.datasetId === datasetId)
}
function isSelected(datasetId: string): boolean {
  return Boolean(sourceForDataset(datasetId))
}
function toggleDataset(datasetId: string) {
  const existing = sourceForDataset(datasetId)
  if (existing) studio.removeBlockSource(props.block.id, existing.id)
  else {
    studio.addBlockSource(props.block.id, datasetId)
    datasets.loadSchema(datasetId)
  }
}

const selectedCount = computed(() => blockSources.value.length)
const liveConflict = computed(() =>
  selectedCount.value > 1 && blockSources.value.some(
    (s) => datasets.readyDatasets.find((d) => d.id === s.datasetId)?.materialization === 'live',
  ),
)

function primaryStepAction() {
  if (selectedCount.value <= 1) { emit('close'); return }
  step.value = 2
  ensureJoins()
}

// ─── Étape 2 : jointures ────────────────────────────────────────────────────

function sourceLabel(s: BlockSource): string {
  return s.alias || datasets.readyDatasets.find((d) => d.id === s.datasetId)?.name || s.id
}
function labelForId(id: string): string {
  const s = blockSources.value.find((x) => x.id === id)
  return s ? sourceLabel(s) : id
}
function schemaForSource(id: string) {
  const s = blockSources.value.find((x) => x.id === id)
  return s ? datasets.getSchema(s.datasetId) : undefined
}
function colGroup(id: string): ColumnGroup[] {
  const schema = schemaForSource(id)
  if (!schema) return []
  return [{ label: labelForId(id), columns: schema.columns }]
}

/** Une carte de jointure par source non-principale, créée + pré-remplie si absente. */
function ensureJoins() {
  const primary = primaryId.value
  const nonPrimary = blockSources.value.filter((s) => s.id !== primary)
  const next: BlockJoin[] = joins.value.filter(
    (j) => blockSources.value.some((s) => s.id === j.leftSourceId) && blockSources.value.some((s) => s.id === j.rightSourceId),
  )
  for (const src of nonPrimary) {
    if (next.some((j) => j.rightSourceId === src.id || j.leftSourceId === src.id)) continue
    const guess = suggestJoinKeys(
      schemaForSource(primary)?.columns ?? [],
      schemaForSource(src.id)?.columns ?? [],
    )
    next.push({
      leftSourceId: primary,
      leftColumn: guess?.leftColumn ?? '',
      rightSourceId: src.id,
      rightColumn: guess?.rightColumn ?? '',
      type: 'left',
    })
  }
  if (JSON.stringify(next) !== JSON.stringify(joins.value)) studio.updateBlockJoins(props.block.id, next)
}

function patchJoin(i: number, patch: Partial<BlockJoin>) {
  studio.updateBlockJoins(props.block.id, joins.value.map((j, idx) => (idx === i ? { ...j, ...patch } : j)))
}
function joinComplete(j: BlockJoin): boolean {
  return Boolean(j.leftColumn && j.rightColumn && j.leftSourceId && j.rightSourceId)
}
/** Sources que la source droite d'une jointure peut rejoindre (toutes sauf elle-même). */
function attachOptions(j: BlockJoin): BlockSource[] {
  return blockSources.value.filter((s) => s.id !== j.rightSourceId)
}

function makePrimary(id: string) {
  studio.setPrimarySource(props.block.id, id)
  ensureJoins()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6" @keydown="onKeydown">
      <div class="absolute inset-0 bg-[rgba(18,18,26,0.5)] backdrop-blur-[3px]" @click="emit('close')" />

      <div
        class="relative z-10 flex w-full max-w-[600px] flex-col overflow-hidden rounded-[20px] border border-[var(--studio-line)] bg-white shadow-[var(--studio-shadow-modal)]"
        style="max-height: min(88vh, 720px);"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center gap-3 border-b border-[var(--studio-line)] px-6 py-[18px]">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" :class="meta?.tint ?? 'bg-slate-100 text-slate-600'">
            <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
              <path stroke-linecap="round" stroke-linejoin="round" :d="meta?.iconPath ?? 'M4 7h16M4 12h16M4 17h16'" />
            </svg>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--studio-faint)]">Source de données</span>
            <span class="mt-0.5 block truncate text-[16px] font-extrabold text-[var(--studio-ink)]">{{ block.config.title || meta?.label || 'Bloc' }}</span>
          </span>
          <button
            class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-sm text-[var(--studio-faint)] transition-colors hover:bg-[var(--studio-wash)] hover:text-[var(--studio-ink)]"
            @click="emit('close')"
          >✕</button>
        </div>

        <!-- Progress -->
        <div class="flex shrink-0 items-center gap-2 px-6 pt-[18px]">
          <span class="h-1 flex-1 rounded-[3px]" :style="{ background: '#8b5cf6' }" />
          <span class="h-1 flex-1 rounded-[3px]" :style="{ background: step >= 2 ? '#8b5cf6' : '#eeebf6' }" />
        </div>
        <div class="flex shrink-0 items-center justify-between gap-3 px-6 pb-1 pt-2">
          <span class="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--studio-faint)]">
            Étape {{ step }} / 2 — {{ step === 1 ? 'Sources' : 'Jointures' }}
          </span>
          <button
            v-if="step === 2"
            class="text-[11px] font-bold text-[var(--color-primary)] hover:underline"
            @click="step = 1"
          >← modifier les sources</button>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto px-6 py-4">

          <!-- ══ ÉTAPE 1 ══ -->
          <template v-if="step === 1">
            <div class="mb-3">
              <input
                v-model="dsFilter"
                type="text"
                placeholder="Rechercher un dataset…"
                class="w-full rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-note)] px-3.5 py-2.5 text-xs text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:border-[var(--color-primary)] focus:bg-white focus:outline-none"
              />
            </div>

            <div v-if="filteredDatasets.length" class="flex flex-col gap-1.5">
              <button
                v-for="ds in filteredDatasets"
                :key="ds.id"
                type="button"
                class="flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all"
                :class="isSelected(ds.id)
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-[var(--studio-line-strong)] bg-white hover:border-slate-300 hover:bg-[var(--studio-note)]'"
                @click="toggleDataset(ds.id)"
              >
                <span
                  class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] font-mono text-[8.5px] font-bold"
                  :class="ds.sourceKind === 'api'
                    ? (ds.materialization === 'live' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700')
                    : 'bg-blue-50 text-blue-600'"
                >{{ ds.sourceKind === 'api' ? (ds.materialization === 'live' ? 'LIVE' : 'API') : 'CSV' }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block text-[13.5px] font-bold text-[var(--studio-ink)]">{{ ds.name }}</span>
                  <span class="mt-0.5 block font-mono text-[10.5px] text-[var(--studio-faint)]">{{ ds.rowCount.toLocaleString('fr-FR') }} lignes</span>
                  <span class="mt-1.5 flex flex-wrap gap-1">
                    <span
                      v-for="c in (datasets.getSchema(ds.id)?.columns ?? []).slice(0, 5)"
                      :key="c.name"
                      class="rounded-[5px] bg-[color:color-mix(in_srgb,var(--studio-ink)_5%,transparent)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[color:color-mix(in_srgb,var(--studio-ink)_55%,transparent)]"
                    >{{ c.name }}</span>
                  </span>
                </span>
                <span
                  class="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
                  :class="isSelected(ds.id) ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--studio-line-strong)]'"
                >
                  <svg v-if="isSelected(ds.id)" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </span>
              </button>
            </div>
            <p v-else class="py-8 text-center text-xs italic text-[var(--studio-faint)]">
              Aucune source prête. Ajoutez-en une depuis le panneau « Données ».
            </p>

            <p v-if="liveConflict" class="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[11.5px] leading-snug text-rose-700">
              Une source en direct ne peut pas être jointe à d'autres sources. Retirez-la ou ne gardez que celle-ci.
            </p>
          </template>

          <!-- ══ ÉTAPE 2 ══ -->
          <template v-else>
            <!-- Sources -->
            <div class="mb-4">
              <p class="mb-2 text-[10px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">Sources</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="s in blockSources"
                  :key="s.id"
                  class="flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-[12px] font-bold"
                  :class="s.id === primaryId ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]' : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
                >
                  <span v-if="s.id === primaryId" class="text-[var(--color-primary)]">★</span>
                  {{ sourceLabel(s) }}
                  <button
                    v-if="s.id !== primaryId"
                    type="button"
                    class="ml-0.5 rounded px-1 text-[10px] font-bold text-[var(--studio-faint)] hover:text-[var(--color-primary)]"
                    title="Définir comme source principale"
                    @click="makePrimary(s.id)"
                  >principale</button>
                </span>
              </div>
            </div>

            <!-- Jointures -->
            <div class="flex flex-col gap-3">
              <div
                v-for="(j, ji) in joins"
                :key="ji"
                class="rounded-xl border border-[var(--studio-line-strong)] p-3.5"
              >
                <div class="mb-3 flex items-center justify-between gap-2">
                  <span class="text-[12px] font-extrabold text-[var(--studio-ink)]">
                    {{ labelForId(j.leftSourceId) }} <span class="text-violet-400">⋈</span> {{ labelForId(j.rightSourceId) }}
                  </span>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    :class="joinComplete(j) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                  >{{ joinComplete(j) ? '✓ clé définie' : '⚠ à compléter' }}</span>
                </div>

                <!-- Attache (chaînage) -->
                <div v-if="blockSources.length > 2" class="mb-2.5">
                  <label class="mb-1 block text-[10.5px] font-semibold text-[var(--studio-muted)]">Se rattache à</label>
                  <select
                    class="w-full rounded-lg border border-[var(--studio-line-strong)] px-2.5 py-2 text-xs focus:border-[var(--color-primary)] focus:outline-none"
                    :value="j.leftSourceId"
                    @change="patchJoin(ji, { leftSourceId: ($event.target as HTMLSelectElement).value, leftColumn: '' })"
                  >
                    <option v-for="s in attachOptions(j)" :key="s.id" :value="s.id">{{ sourceLabel(s) }}</option>
                  </select>
                </div>

                <!-- Clés -->
                <div class="flex items-center gap-2">
                  <div class="min-w-0 flex-1">
                    <label class="mb-1 block truncate text-[10.5px] font-semibold text-[var(--studio-muted)]">{{ labelForId(j.leftSourceId) }}</label>
                    <ColumnButton
                      :model-value="j.leftColumn || null"
                      :block="block"
                      :custom-groups="colGroup(j.leftSourceId)"
                      placeholder="colonne"
                      @update:model-value="patchJoin(ji, { leftColumn: $event as string })"
                    />
                  </div>
                  <span class="mt-4 shrink-0 text-sm font-bold text-violet-400">=</span>
                  <div class="min-w-0 flex-1">
                    <label class="mb-1 block truncate text-[10.5px] font-semibold text-[var(--studio-muted)]">{{ labelForId(j.rightSourceId) }}</label>
                    <ColumnButton
                      :model-value="j.rightColumn || null"
                      :block="block"
                      :custom-groups="colGroup(j.rightSourceId)"
                      placeholder="colonne"
                      @update:model-value="patchJoin(ji, { rightColumn: $event as string })"
                    />
                  </div>
                </div>

                <!-- Type -->
                <div class="mt-3 flex flex-col gap-1.5">
                  <label
                    v-for="t in ([{ v: 'left', l: 'Garder toutes les lignes de gauche (LEFT)' }, { v: 'inner', l: 'Seulement les correspondances (INNER)' }] as const)"
                    :key="t.v"
                    class="flex cursor-pointer items-center gap-2 text-[11.5px]"
                    :class="j.type === t.v ? 'font-bold text-[var(--studio-ink)]' : 'text-[var(--studio-muted)]'"
                  >
                    <input type="radio" :checked="j.type === t.v" class="accent-[var(--color-primary)]" @change="patchJoin(ji, { type: t.v })" />
                    {{ t.l }}
                  </label>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="flex shrink-0 items-center gap-2.5 border-t border-[var(--studio-line)] px-6 py-4">
          <button
            v-if="step === 2"
            class="rounded-full border-[1.5px] border-[var(--studio-line-strong)] px-5 py-2.5 text-[13px] font-bold text-[var(--studio-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            @click="step = 1"
          >← Retour</button>
          <span class="flex-1" />
          <button
            v-if="step === 1"
            class="rounded-full bg-[var(--studio-ink)] px-6 py-2.5 text-[13px] font-extrabold text-white transition-opacity disabled:opacity-35"
            :disabled="selectedCount === 0 || liveConflict"
            @click="primaryStepAction"
          >{{ selectedCount <= 1 ? 'Terminer' : 'Continuer →' }}</button>
          <button
            v-else
            class="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-[13px] font-extrabold text-white transition-opacity hover:opacity-90"
            @click="emit('close')"
          >Terminer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
