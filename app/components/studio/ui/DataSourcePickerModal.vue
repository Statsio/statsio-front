<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { BlockJoin, DatasetColumn, DatasetMeta, StudioBlock } from '@/types/studio'
import StudioSubModal from './StudioSubModal.vue'

const props = defineProps<{ show: boolean; block: StudioBlock }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

watch(
  () => props.show,
  (open) => {
    if (!open) return
    datasets.readyDatasets.forEach((d) => datasets.loadSchema(d.id))
    if (props.block.datasetId) datasets.loadSchema(props.block.datasetId)
    ;(props.block.joins ?? []).forEach((j) => j.datasetId && datasets.loadSchema(j.datasetId))
  },
  { immediate: true },
)

// ─── Sources connectées (cartes) ─────────────────────────────────────────────

function iconFor(d: DatasetMeta) {
  if (d.sourceKind === 'api') return { text: d.materialization === 'live' ? 'LIVE' : 'API', bg: '#eafbf1', fg: '#166534' }
  return { text: 'CSV', bg: '#eaf1fe', fg: '#2563eb' }
}

function selectDataset(id: string) {
  if (id === props.block.datasetId) return
  studio.updateBlockDataset(props.block.id, id)
  datasets.loadSchema(id)
}

const primaryCols = computed<string[]>(
  () => datasets.getSchema(props.block.datasetId ?? '')?.columns.map((c: DatasetColumn) => c.name) ?? [],
)

// ─── Jointures ───────────────────────────────────────────────────────────────

const joins = computed<BlockJoin[]>(() => props.block.joins ?? [])
const otherDatasets = computed(() => datasets.readyDatasets.filter((d) => d.id !== props.block.datasetId))

function write(next: BlockJoin[]) {
  studio.updateBlockJoins(props.block.id, next)
}
function addJoin() {
  write([...joins.value, { datasetId: '', leftColumn: '', rightColumn: '', columns: [], type: 'left' }])
}
function removeJoin(i: number) {
  write(joins.value.filter((_, k) => k !== i))
}
function patchJoin(i: number, patch: Partial<BlockJoin>) {
  write(joins.value.map((j, k) => (k === i ? { ...j, ...patch } : j)))
  if (patch.datasetId) datasets.loadSchema(patch.datasetId)
}
function joinCols(i: number): string[] {
  return datasets.getSchema(joins.value[i]?.datasetId ?? '')?.columns.map((c: DatasetColumn) => c.name) ?? []
}
function toggleJoinCol(i: number, col: string) {
  const cur = joins.value[i]?.columns ?? []
  patchJoin(i, { columns: cur.includes(col) ? cur.filter((c) => c !== col) : [...cur, col] })
}
</script>

<template>
  <StudioSubModal
    v-if="show"
    title="Source de données du bloc"
    subtitle="Le bloc lira cette source à chaque rendu. Les colonnes compatibles sont conservées, les autres réinitialisées."
    :width="620"
    :footer-note="datasets.readyDatasets.find((d) => d.id === block.datasetId)?.name ?? ''"
    @close="emit('close')"
  >
    <!-- Sources connectées -->
    <div>
      <div class="mb-2.5 flex items-baseline justify-between gap-3">
        <span class="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Sources connectées</span>
        <span class="font-mono text-[11px] text-[var(--studio-faint)]">{{ datasets.readyDatasets.length }} disponible{{ datasets.readyDatasets.length > 1 ? 's' : '' }}</span>
      </div>

      <div class="flex flex-col gap-[9px]">
        <button
          v-for="d in datasets.readyDatasets"
          :key="d.id"
          type="button"
          class="grid grid-cols-[36px_1fr_18px] items-center gap-3.5 rounded-[13px] border-2 px-[15px] py-3.5 text-left transition-colors"
          :class="block.datasetId === d.id
            ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
            : 'border-[var(--studio-line)] bg-white hover:border-[var(--color-primary)]'"
          @click="selectDataset(d.id)"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-[10px] font-mono text-[9.5px] font-semibold"
            :style="{ background: iconFor(d).bg, color: iconFor(d).fg }"
          >{{ iconFor(d).text }}</span>
          <span class="min-w-0">
            <span class="block text-[13.5px] font-extrabold text-[var(--studio-ink)]">{{ d.name }}</span>
            <span class="mt-0.5 block font-mono text-[10.5px] text-[var(--studio-faint)]">
              {{ d.rowCount.toLocaleString('fr-FR') }} lignes{{ d.sourceKind === 'api' ? ' · API' : '' }}
            </span>
            <span class="mt-2 flex flex-wrap gap-[5px]">
              <span
                v-for="c in (datasets.getSchema(d.id)?.columns ?? []).slice(0, 6)"
                :key="c.name"
                class="rounded-[5px] bg-[color:color-mix(in_srgb,var(--studio-ink)_5%,transparent)] px-[7px] py-[3px] font-mono text-[10px] font-semibold text-[color:color-mix(in_srgb,var(--studio-ink)_60%,transparent)]"
              >{{ c.name }}</span>
            </span>
          </span>
          <span
            class="h-[18px] w-[18px] rounded-full border-2"
            :class="block.datasetId === d.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-[var(--studio-line-strong)]'"
          />
        </button>
        <p v-if="!datasets.readyDatasets.length" class="py-4 text-center text-[13px] text-[var(--studio-faint)]">
          Aucune source prête. Ajoutez-en une depuis le panneau « Données ».
        </p>
      </div>
    </div>

    <!-- Jointures -->
    <div v-if="block.datasetId">
      <div class="mb-2.5 flex items-baseline justify-between gap-3">
        <span class="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Jointures</span>
        <span class="font-mono text-[11px] text-[var(--studio-faint)]">{{ joins.length }}</span>
      </div>

      <div class="flex flex-col gap-2.5">
        <div v-for="(join, i) in joins" :key="i" class="rounded-xl border border-[var(--studio-line)] p-3.5">
          <div class="mb-2.5 flex items-center justify-between gap-2.5">
            <select
              :value="join.datasetId"
              class="studio-input min-w-0 flex-1 !py-2 !text-[12.5px] !font-bold"
              @change="patchJoin(i, { datasetId: ($event.target as HTMLSelectElement).value, leftColumn: '', rightColumn: '', columns: [] })"
            >
              <option value="" disabled>Dataset à joindre…</option>
              <option v-for="d in otherDatasets" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <button type="button" class="shrink-0 text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)]" @click="removeJoin(i)">✕</button>
          </div>

          <div class="mb-2.5 flex gap-1.5">
            <button
              v-for="t in (['left', 'inner'] as const)"
              :key="t"
              type="button"
              class="flex-1 rounded-[9px] border-[1.5px] py-2 text-center font-mono text-[11px] font-bold transition-colors"
              :class="(join.type ?? 'left') === t
                ? 'border-[var(--studio-ink)] bg-[var(--studio-ink)] text-white'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
              @click="patchJoin(i, { type: t })"
            >{{ t.toUpperCase() }}</button>
          </div>

          <div v-if="join.datasetId" class="flex flex-col gap-2.5">
            <div class="flex items-center gap-2">
              <select
                :value="join.leftColumn"
                class="studio-input studio-input--mono min-w-0 flex-1 !py-2 !text-[11.5px]"
                @change="patchJoin(i, { leftColumn: ($event.target as HTMLSelectElement).value })"
              >
                <option value="" disabled>colonne source…</option>
                <option v-for="c in primaryCols" :key="c" :value="c">{{ c }}</option>
              </select>
              <span class="shrink-0 text-[12px] text-[var(--studio-faint)]">=</span>
              <select
                :value="join.rightColumn"
                class="studio-input studio-input--mono min-w-0 flex-1 !py-2 !text-[11.5px]"
                @change="patchJoin(i, { rightColumn: ($event.target as HTMLSelectElement).value })"
              >
                <option value="" disabled>colonne jointe…</option>
                <option v-for="c in joinCols(i)" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <div>
              <div class="mb-1.5 text-[11px] font-bold text-[var(--studio-faint)]">Colonnes à inclure</div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="c in joinCols(i)"
                  :key="c"
                  type="button"
                  class="rounded-[16px] border-[1.5px] px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-colors"
                  :class="join.columns.includes(c)
                    ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
                    : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
                  @click="toggleJoinCol(i, c)"
                >{{ c }}</button>
              </div>
            </div>
          </div>
        </div>

        <button type="button" class="studio-add-btn" @click="addJoin">+ Enrichir via une jointure</button>
      </div>
    </div>
  </StudioSubModal>
</template>
