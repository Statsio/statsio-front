<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'
import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'
import StudioSubModal from './StudioSubModal.vue'

const props = defineProps<{
  show: boolean
  block: StudioBlock
  columnGroups: ColumnGroup[]
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const studio = useStudioStore()

const showDescPicker = ref(false)

const titleColumn      = computed<string>(() => props.block.fieldMapping.resultTitleColumn ?? '')
const descColumns      = computed<string[]>(() => props.block.fieldMapping.resultDescColumns ?? [])
const descColumnLabels = computed<Record<string, string>>(() => props.block.fieldMapping.resultDescColumnLabels ?? {})

function setTitle(col: string) {
  studio.updateBlockFieldMapping(props.block.id, { resultTitleColumn: col || undefined })
}

function toggleDesc(col: string) {
  const current = descColumns.value
  const updated = current.includes(col) ? current.filter(c => c !== col) : [...current, col]
  if (!updated.includes(col)) {
    const labels = { ...descColumnLabels.value }
    delete labels[col]
    studio.updateBlockFieldMapping(props.block.id, {
      resultDescColumns: updated.length ? updated : undefined,
      resultDescColumnLabels: Object.keys(labels).length ? labels : undefined,
    })
  } else {
    studio.updateBlockFieldMapping(props.block.id, { resultDescColumns: updated.length ? updated : undefined })
  }
}

function setLabel(col: string, label: string) {
  const labels = { ...descColumnLabels.value }
  if (label && label !== col) labels[col] = label
  else delete labels[col]
  studio.updateBlockFieldMapping(props.block.id, { resultDescColumnLabels: Object.keys(labels).length ? labels : undefined })
}
</script>

<template>
  <StudioSubModal
    v-if="show"
    title="Affichage des résultats"
    subtitle="Choisissez la colonne servant de titre et les colonnes affichées en description sous chaque résultat."
    :width="560"
    @close="emit('close')"
  >
        <!-- Body -->
        <div class="flex flex-col gap-6">

          <!-- Titre du résultat -->
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Titre du résultat</p>
            <p class="mb-2 text-[10px] text-[var(--studio-faint)]">Colonne affichée en gras comme titre principal de chaque suggestion</p>
            <ColumnButton
              :model-value="titleColumn || null"
              :block="block"
              :custom-groups="columnGroups"
              placeholder="— Auto (colonne de recherche) —"
              clearable
              @update:model-value="setTitle($event ?? '')"
            />
          </div>

          <div class="border-t border-[var(--studio-line)]" />

          <!-- Description -->
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Description du résultat</p>
            <p class="mb-3 text-[10px] text-[var(--studio-faint)]">Colonnes affichées en sous-titre — personnalisez leur label d'affichage</p>

            <!-- Rows -->
            <div v-if="descColumns.length > 0" class="flex flex-col gap-2 mb-3">
              <div
                v-for="col in descColumns" :key="col"
                class="flex items-center gap-2 rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-panel)] px-3 py-2"
              >
                <span class="shrink-0 font-mono text-[10px] bg-white border border-[var(--studio-line-strong)] rounded px-1.5 py-0.5 text-[var(--studio-muted)] max-w-[100px] truncate" :title="col">{{ col }}</span>
                <svg class="shrink-0 w-3 h-3 text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                <input
                  type="text"
                  class="flex-1 min-w-0 rounded-lg border border-[var(--studio-line)] bg-white px-2 py-1 text-[11px] text-[var(--studio-ink)] placeholder-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-colors"
                  :placeholder="col"
                  :value="descColumnLabels[col] ?? ''"
                  @change="setLabel(col, ($event.target as HTMLInputElement).value)"
                />
                <button class="shrink-0 flex items-center justify-center w-5 h-5 rounded hover:bg-red-50 text-[var(--studio-faint)] hover:text-red-400 transition-colors" @click="toggleDesc(col)">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <p v-else class="text-[11px] text-[var(--studio-faint)] italic mb-3">Auto — autres colonnes de recherche visibles</p>

            <!-- Open column picker -->
            <button
              class="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 text-[var(--studio-muted)] hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 bg-white px-3 py-1.5 text-[11px] font-medium transition-colors"
              @click="showDescPicker = true"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {{ descColumns.length === 0 ? 'Choisir les colonnes de description…' : 'Modifier les colonnes…' }}
            </button>

            <ColumnPickerModal
              :show="showDescPicker"
              :block="block"
              mode="multi"
              :custom-groups="columnGroups"
              :selected-values="descColumns"
              @toggle="toggleDesc"
              @close="showDescPicker = false"
            />
          </div>
        </div>
  </StudioSubModal>
</template>
