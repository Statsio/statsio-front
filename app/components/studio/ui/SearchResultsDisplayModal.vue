<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'
import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'

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
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />

      <div class="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" style="max-height: min(85vh, 600px);">

        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </span>
            <h3 class="text-[13px] font-semibold text-slate-800">Affichage des résultats</h3>
            <span v-if="titleColumn || descColumns.length" class="min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">✓</span>
          </div>
          <button class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" @click="emit('close')">×</button>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-6">

          <!-- Titre du résultat -->
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Titre du résultat</p>
            <p class="mb-2 text-[10px] text-slate-400">Colonne affichée en gras comme titre principal de chaque suggestion</p>
            <ColumnButton
              :model-value="titleColumn || null"
              :block="block"
              :custom-groups="columnGroups"
              placeholder="— Auto (colonne de recherche) —"
              clearable
              @update:model-value="setTitle($event ?? '')"
            />
          </div>

          <div class="border-t border-slate-100" />

          <!-- Description -->
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Description du résultat</p>
            <p class="mb-3 text-[10px] text-slate-400">Colonnes affichées en sous-titre — personnalisez leur label d'affichage</p>

            <!-- Rows -->
            <div v-if="descColumns.length > 0" class="flex flex-col gap-2 mb-3">
              <div
                v-for="col in descColumns" :key="col"
                class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2"
              >
                <span class="shrink-0 font-mono text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 max-w-[100px] truncate" :title="col">{{ col }}</span>
                <svg class="shrink-0 w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                <input
                  type="text"
                  class="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 placeholder-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-colors"
                  :placeholder="col"
                  :value="descColumnLabels[col] ?? ''"
                  @change="setLabel(col, ($event.target as HTMLInputElement).value)"
                />
                <button class="shrink-0 flex items-center justify-center w-5 h-5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors" @click="toggleDesc(col)">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <p v-else class="text-[11px] text-slate-400 italic mb-3">Auto — autres colonnes de recherche visibles</p>

            <!-- Open column picker -->
            <button
              class="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 bg-white px-3 py-1.5 text-[11px] font-medium transition-colors"
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

        <!-- Footer -->
        <div class="flex shrink-0 items-center justify-end border-t border-slate-100 px-5 py-3">
          <button class="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity" @click="emit('close')">Terminé</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
