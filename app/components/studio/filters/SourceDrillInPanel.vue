<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { primarySourceId } from '@/lib/studio-columns'
import { useSourceDrillIn } from '@/composables/useSourceDrillIn'
import type { BlockJoin, BlockSource, DatasetMeta } from '@/types/studio'

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const drill = useSourceDrillIn()
const { state } = drill

const block = computed(() => studio.selectedBlock)
const sources = computed<BlockSource[]>(() => block.value?.sources ?? [])
const joins = computed<BlockJoin[]>(() => block.value?.joins ?? [])
const primaryId = computed(() => (block.value ? primarySourceId(block.value) : ''))

const filteredDatasets = computed<DatasetMeta[]>(() => {
  const q = state.dsFilter.trim().toLowerCase()
  const list = datasets.readyDatasets
  return q ? list.filter((d) => d.name.toLowerCase().includes(q)) : list
})

function isSelected(datasetId: string): boolean {
  return sources.value.some((s) => s.datasetId === datasetId)
}
const selectedCount = computed(() => sources.value.length)
const liveConflict = computed(
  () =>
    selectedCount.value > 1 &&
    sources.value.some(
      (s) => datasets.readyDatasets.find((d) => d.id === s.datasetId)?.materialization === 'live',
    ),
)

function sourceLabel(s: BlockSource): string {
  return s.alias || datasets.readyDatasets.find((d) => d.id === s.datasetId)?.name || s.id
}
function labelForId(id: string): string {
  const s = sources.value.find((x) => x.id === id)
  return s ? sourceLabel(s) : id
}
function columnsForSource(id: string): string[] {
  const s = sources.value.find((x) => x.id === id)
  return s ? (datasets.getSchema(s.datasetId)?.columns ?? []).map((c) => c.name) : []
}
function attachOptions(j: BlockJoin): BlockSource[] {
  return sources.value.filter((s) => s.id !== j.rightSourceId)
}
function joinComplete(j: BlockJoin): boolean {
  return Boolean(j.leftColumn && j.rightColumn && j.leftSourceId && j.rightSourceId)
}

function badge(ds: DatasetMeta): string {
  if (ds.sourceKind === 'api') return ds.materialization === 'live' ? 'LIVE' : 'API'
  return 'CSV'
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    drill.close()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<template>
  <div v-if="state.open && block" class="absolute inset-0 z-30 flex flex-col bg-[var(--studio-surface)]">
    <!-- Header -->
    <div class="flex shrink-0 items-center gap-2 border-b border-[var(--studio-line)] px-3 py-2.5">
      <button
        type="button"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)] hover:text-[var(--studio-ink)]"
        aria-label="Retour"
        @click="drill.goBack()"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <p class="min-w-0 flex-1 truncate text-[13px] font-extrabold text-[var(--studio-ink)]">
        {{ state.step === 'joins' ? 'Jointures' : 'Source de données' }}
      </p>
      <button
        type="button"
        class="shrink-0 text-[15px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
        aria-label="Fermer"
        @click="drill.close()"
      >✕</button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <!-- ══ ÉTAPE : LISTE ══ -->
      <template v-if="state.step === 'list'">
        <input
          v-model="state.dsFilter"
          type="search"
          placeholder="Rechercher un dataset…"
          class="studio-input mb-2.5"
        />

        <div v-if="filteredDatasets.length" class="flex flex-col gap-1.5">
          <button
            v-for="ds in filteredDatasets"
            :key="ds.id"
            type="button"
            class="flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all"
            :class="isSelected(ds.id)
              ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
              : 'border-[var(--studio-line-strong)] bg-white hover:border-[var(--color-primary)]'"
            @click="drill.pickDataset(ds.id)"
          >
            <span
              class="mt-0.5 flex h-6 w-9 shrink-0 items-center justify-center rounded-[7px] font-mono text-[8px] font-bold"
              :class="ds.sourceKind === 'api'
                ? (ds.materialization === 'live' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700')
                : 'bg-blue-50 text-blue-600'"
            >{{ badge(ds) }}</span>
            <span class="min-w-0 flex-1">
              <span class="block text-[13px] font-bold text-[var(--studio-ink)]">{{ ds.name }}</span>
              <span class="mt-0.5 block font-mono text-[10px] text-[var(--studio-faint)]">
                {{ ds.rowCount.toLocaleString('fr-FR') }} lignes
              </span>
            </span>
            <span
              class="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
              :class="isSelected(ds.id) ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--studio-line-strong)]'"
            >
              <svg v-if="isSelected(ds.id)" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
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

      <!-- ══ ÉTAPE : JOINTURES ══ -->
      <template v-else>
        <p class="mb-2 text-[10px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">Sources</p>
        <div class="mb-4 flex flex-wrap gap-1.5">
          <span
            v-for="s in sources"
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
              @click="drill.makePrimary(s.id)"
            >principale</button>
          </span>
        </div>

        <div class="flex flex-col gap-3">
          <div
            v-for="(j, ji) in joins"
            :key="ji"
            class="rounded-xl border border-[var(--studio-line-strong)] p-3"
          >
            <div class="mb-2.5 flex items-center justify-between gap-2">
              <span class="text-[12px] font-extrabold text-[var(--studio-ink)]">
                {{ labelForId(j.leftSourceId) }} <span class="text-violet-400">⋈</span> {{ labelForId(j.rightSourceId) }}
              </span>
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                :class="joinComplete(j) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
              >{{ joinComplete(j) ? '✓ clé définie' : '⚠ à compléter' }}</span>
            </div>

            <div v-if="sources.length > 2" class="mb-2.5">
              <label class="mb-1 block text-[10.5px] font-semibold text-[var(--studio-muted)]">Se rattache à</label>
              <select
                class="studio-input !py-2 !text-[12px]"
                :value="j.leftSourceId"
                @change="drill.patchJoin(ji, { leftSourceId: ($event.target as HTMLSelectElement).value, leftColumn: '' })"
              >
                <option v-for="s in attachOptions(j)" :key="s.id" :value="s.id">{{ sourceLabel(s) }}</option>
              </select>
            </div>

            <div class="flex items-end gap-2">
              <div class="min-w-0 flex-1">
                <label class="mb-1 block truncate text-[10.5px] font-semibold text-[var(--studio-muted)]">{{ labelForId(j.leftSourceId) }}</label>
                <select
                  class="studio-input !py-2 !text-[12px]"
                  :value="j.leftColumn"
                  @change="drill.patchJoin(ji, { leftColumn: ($event.target as HTMLSelectElement).value })"
                >
                  <option value="">colonne…</option>
                  <option v-for="c in columnsForSource(j.leftSourceId)" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <span class="pb-2 shrink-0 text-sm font-bold text-violet-400">=</span>
              <div class="min-w-0 flex-1">
                <label class="mb-1 block truncate text-[10.5px] font-semibold text-[var(--studio-muted)]">{{ labelForId(j.rightSourceId) }}</label>
                <select
                  class="studio-input !py-2 !text-[12px]"
                  :value="j.rightColumn"
                  @change="drill.patchJoin(ji, { rightColumn: ($event.target as HTMLSelectElement).value })"
                >
                  <option value="">colonne…</option>
                  <option v-for="c in columnsForSource(j.rightSourceId)" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>

            <div class="mt-3 flex flex-col gap-1.5">
              <label
                v-for="t in ([{ v: 'left', l: 'Garder toutes les lignes de gauche (LEFT)' }, { v: 'inner', l: 'Seulement les correspondances (INNER)' }] as const)"
                :key="t.v"
                class="flex cursor-pointer items-center gap-2 text-[11.5px]"
                :class="j.type === t.v ? 'font-bold text-[var(--studio-ink)]' : 'text-[var(--studio-muted)]'"
              >
                <input type="radio" :checked="j.type === t.v" class="accent-[var(--color-primary)]" @change="drill.patchJoin(ji, { type: t.v })" />
                {{ t.l }}
              </label>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Footer -->
    <div v-if="!state.singleSource" class="shrink-0 border-t border-[var(--studio-line)] p-3">
      <button
        v-if="state.step === 'list' && selectedCount >= 2"
        type="button"
        class="studio-gradient w-full rounded-xl py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
        :disabled="liveConflict"
        @click="drill.goToJoins()"
      >Configurer les jointures →</button>
      <button
        v-else
        type="button"
        class="w-full rounded-xl border-[1.5px] border-[var(--studio-line-strong)] py-2.5 text-[13px] font-bold text-[var(--studio-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        @click="drill.close()"
      >Terminer</button>
    </div>
  </div>
</template>
