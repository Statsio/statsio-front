<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock, BlockFilter, FilterOperator } from '@/types/studio'

const props = defineProps<{
  show: boolean
  block: StudioBlock
  mode?: 'primary' | 'comparison'
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const studio = useStudioStore()

const isComparison = computed(() => props.mode === 'comparison')
const accentCls    = computed(() => isComparison.value ? 'text-rose-600' : 'text-[var(--color-primary)]')
const activeBorder = computed(() => isComparison.value ? 'border-rose-300 bg-rose-50' : 'border-[var(--color-primary)] bg-[var(--color-primary)]/5')
const chipCls      = computed(() => isComparison.value ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200')

const filters  = computed<BlockFilter[]>(() => (isComparison.value ? props.block.comparisonFilters : props.block.filters) ?? [])
const selectedIdx = ref(0)

watch(() => props.show, (open) => {
  if (open) selectedIdx.value = filters.value.length > 0 ? 0 : -1
})

const selected = computed<BlockFilter | null>(() => filters.value[selectedIdx.value] ?? null)

const OPERATORS: { value: FilterOperator; label: string; short: string }[] = [
  { value: '=',           label: 'égal à',            short: '='  },
  { value: '!=',          label: 'différent de',       short: '≠'  },
  { value: '>',           label: 'supérieur à',        short: '>'  },
  { value: '>=',          label: 'sup. ou égal',       short: '≥'  },
  { value: '<',           label: 'inférieur à',        short: '<'  },
  { value: '<=',          label: 'inf. ou égal',       short: '≤'  },
  { value: 'contains',    label: 'contient',           short: '⊃'  },
  { value: 'not_contains',label: 'ne contient pas',    short: '⊄'  },
]

function write(updated: BlockFilter[]) {
  if (isComparison.value) studio.updateBlockComparisonFilters(props.block.id, updated)
  else studio.updateBlockFilters(props.block.id, updated)
}

function add() {
  write([...filters.value, { column: '', operator: '=', value: '' }])
  selectedIdx.value = filters.value.length - 1
}

function remove(i: number) {
  write(filters.value.filter((_, idx) => idx !== i))
  if (selectedIdx.value >= filters.value.length) selectedIdx.value = filters.value.length - 1
}

function patch(patch: Partial<BlockFilter>) {
  const updated = filters.value.map((f, idx) => idx === selectedIdx.value ? { ...f, ...patch } : f)
  write(updated)
}

function hasVariable(v: string) { return /\{\{[^}]+\}\}/.test(v ?? '') }
function extractVariables(v: string) { return [...(v ?? '').matchAll(/\{\{(.+?)\}\}/g)].map(m => m[1]) }

function filterSummary(f: BlockFilter) {
  const op = OPERATORS.find(o => o.value === f.operator)?.short ?? f.operator
  if (!f.column) return 'Règle vide'
  return `${f.column} ${op} ${f.value || '…'}`
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />

      <div class="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" style="max-height: min(85vh, 640px);">

        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
            </span>
            <h3 class="text-[13px] font-semibold text-slate-800">
              {{ isComparison ? 'Filtres de comparaison' : 'Règles de filtrage' }}
            </h3>
            <span v-if="filters.length" class="min-w-4 h-4 px-1 rounded-full text-white text-[9px] flex items-center justify-center font-bold" :class="isComparison ? 'bg-rose-500' : 'bg-[var(--color-primary)]'">{{ filters.length }}</span>
          </div>
          <button class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" @click="emit('close')">×</button>
        </div>

        <!-- Body -->
        <div class="flex flex-1 min-h-0">

          <!-- Left nav -->
          <nav class="w-48 shrink-0 border-r border-slate-100 overflow-y-auto py-3 flex flex-col gap-0.5">
            <p class="px-4 pb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Règles</p>

            <button
              v-for="(f, i) in filters" :key="i"
              class="mx-2 flex w-[calc(100%-1rem)] items-start gap-2 rounded-lg px-3 py-2 text-left text-xs transition-all"
              :class="selectedIdx === i
                ? (isComparison ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200' : 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold')
                : 'text-slate-600 hover:bg-slate-50'"
              @click="selectedIdx = i"
            >
              <span class="mt-0.5 shrink-0 w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold" :class="isComparison ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'">{{ i + 1 }}</span>
              <span class="flex-1 truncate font-mono text-[10px] leading-relaxed">{{ filterSummary(f) }}</span>
            </button>

            <div v-if="filters.length === 0" class="px-4 py-3 text-[11px] text-slate-400 italic">Aucune règle</div>

            <div class="px-2 pt-2">
              <button
                class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-1.5 text-[11px] font-medium transition-colors"
                :class="isComparison ? 'border-rose-200 text-rose-400 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600' : 'border-slate-200 text-slate-400 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]'"
                @click="add"
              >
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Ajouter
              </button>
            </div>
          </nav>

          <!-- Right content -->
          <div class="flex-1 min-w-0 overflow-y-auto p-5">

            <!-- Edit selected filter -->
            <template v-if="selected !== null">
              <div class="flex items-center justify-between mb-4">
                <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Règle {{ selectedIdx + 1 }}</p>
                <button
                  class="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-500 hover:bg-red-100 transition-colors"
                  @click="remove(selectedIdx)"
                >
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  Supprimer
                </button>
              </div>

              <div class="flex flex-col gap-4">
                <!-- Colonne -->
                <div>
                  <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Colonne filtrée</p>
                  <ColumnButton
                    :model-value="selected.column || null"
                    :block="block"
                    placeholder="— Choisir une colonne —"
                    @update:model-value="patch({ column: $event as string })"
                  />
                </div>

                <!-- Opérateur -->
                <div>
                  <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Condition</p>
                  <div class="grid grid-cols-2 gap-1.5">
                    <button
                      v-for="op in OPERATORS" :key="op.value"
                      class="flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-all"
                      :class="selected.operator === op.value
                        ? (isComparison ? 'border-rose-300 bg-rose-50 text-rose-700 font-semibold' : 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold')
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'"
                      @click="patch({ operator: op.value })"
                    >
                      <span class="w-4 shrink-0 font-mono text-center text-[11px] font-bold opacity-60">{{ op.short }}</span>
                      {{ op.label }}
                    </button>
                  </div>
                </div>

                <!-- Valeur -->
                <div>
                  <p class="mb-1.5 text-[11px] font-semibold text-slate-600">Valeur</p>
                  <ColumnInput
                    :model-value="selected.value"
                    :block="block"
                    placeholder="Valeur ou {{variable}}…"
                    @update:model-value="patch({ value: $event })"
                  />
                  <div v-if="hasVariable(selected.value)" class="flex flex-wrap gap-1 mt-2">
                    <span v-for="v in extractVariables(selected.value)" :key="v" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border" :class="chipCls">
                      {{ '{' + '{' + v + '}' + '}' }}
                    </span>
                  </div>
                  <p class="mt-2 text-[10px] text-slate-400 leading-relaxed">
                    Utilisez <code class="font-mono bg-slate-100 px-1 rounded">{{ '{' + '{' }}nom_variable{{ '}' + '}' }}</code> pour des valeurs dynamiques (paramètres de page).
                  </p>
                </div>
              </div>
            </template>

            <!-- Empty state -->
            <div v-else class="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
              <svg class="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-slate-600">Aucun filtre</p>
                <p class="mt-1 text-xs text-slate-400">Toutes les lignes du dataset seront affichées</p>
              </div>
              <button
                class="mt-1 flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-all"
                :class="isComparison ? 'border-rose-200 text-rose-500 hover:bg-rose-50' : 'border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5'"
                @click="add"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Ajouter une règle
              </button>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-3">
          <p v-if="filters.length" class="text-[11px] text-slate-400">
            {{ filters.filter(f => f.column).length }} règle{{ filters.filter(f => f.column).length > 1 ? 's' : '' }} active{{ filters.filter(f => f.column).length > 1 ? 's' : '' }}
          </p>
          <div v-else />
          <button class="rounded-xl bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity" @click="emit('close')">Terminé</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
