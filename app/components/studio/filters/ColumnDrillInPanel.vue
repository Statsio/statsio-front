<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups, primarySourceId } from '@/lib/studio-columns'
import { useColumnDrillIn } from '@/composables/useColumnDrillIn'
import ColumnSourcePickStep from './ColumnSourcePickStep.vue'
import FieldColumns from '@/components/studio/fields/FieldColumns.vue'
import CalcColumnField from '@/components/studio/fields/CalcColumnField.vue'

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const drillIn = useColumnDrillIn()
const { state } = drillIn

const block = computed(() => studio.selectedBlock)

const groups = computed(() => {
  if (!block.value) return []
  const all = blockColumnGroups(block.value, datasets)
  const realCount = all.filter((g) => g.sourceId).length
  if (!state.sourceId || realCount <= 1) return all
  // Multi-sources : la source choisie + le groupe « Calculées » (sans sourceId).
  return all.filter((g) => !g.sourceId || g.sourceId === state.sourceId)
})
const primaryId = computed(() => (block.value ? primarySourceId(block.value) : ''))

const calcTitle = computed(() =>
  state.step === 'calc'
    ? (state.calcDraft && block.value?.fieldMapping.calcColumns?.some((c) => c.id === state.calcDraft!.id)
        ? 'Modifier la colonne calculée'
        : 'Nouvelle colonne calculée')
    : state.title,
)
const calcValid = computed(() =>
  !!state.calcDraft
  && !!state.calcDraft.label.trim()
  && state.calcDraft.operands.every((o) => (o.column !== undefined && o.column !== '') || o.value !== undefined),
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    drillIn.close()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<template>
  <div
    v-if="state.open && block"
    class="absolute inset-0 z-20 flex flex-col bg-[var(--studio-surface)]"
  >
    <div class="flex shrink-0 items-center gap-2 border-b border-[var(--studio-line)] px-3 py-2.5">
      <button
        type="button"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)] hover:text-[var(--studio-ink)]"
        aria-label="Retour"
        @click="drillIn.goBack()"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <p class="min-w-0 flex-1 truncate text-[13px] font-extrabold text-[var(--studio-ink)]">{{ calcTitle }}</p>
      <button
        type="button"
        class="shrink-0 text-[15px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
        aria-label="Fermer"
        @click="drillIn.close()"
      >✕</button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <ColumnSourcePickStep
        v-if="state.step === 'source'"
        :block="block"
        :selected-source-id="state.sourceId"
        @pick="drillIn.pickSource($event)"
      />

      <CalcColumnField
        v-else-if="state.step === 'calc' && state.calcDraft"
        :block="block"
        :model-value="state.calcDraft"
        @update:model-value="state.calcDraft = $event"
      />

      <template v-else>
        <FieldColumns
          :groups="groups"
          :primary-source-id="primaryId"
          :selected="state.multi ? state.selected : (state.selected[0] ?? null)"
          :none-label="state.allowNone ? state.noneLabel : ''"
          @pick="drillIn.pickColumn($event)"
          @none="drillIn.pickNone()"
        />
        <button
          v-if="!state.multi"
          type="button"
          class="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-[var(--studio-line-strong)] py-2.5 text-[12px] font-bold text-[var(--color-primary)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)]"
          @click="drillIn.startCalc()"
        >
          <span class="text-[14px] leading-none">＋</span> Colonne calculée
        </button>
      </template>
    </div>

    <div v-if="state.step === 'calc'" class="shrink-0 border-t border-[var(--studio-line)] p-3">
      <button
        type="button"
        class="w-full rounded-xl py-2.5 text-[13px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        :class="calcValid ? 'studio-gradient' : 'bg-[var(--studio-line-strong)]'"
        :disabled="!calcValid"
        @click="state.calcDraft && drillIn.saveCalc(state.calcDraft)"
      >
        Valider la colonne calculée
      </button>
    </div>

    <div v-else-if="state.multi && state.step === 'column'" class="shrink-0 border-t border-[var(--studio-line)] p-3">
      <button
        type="button"
        class="studio-gradient w-full rounded-xl py-2.5 text-[13px] font-bold text-white"
        @click="drillIn.commitMulti()"
      >
        Valider ({{ state.selected.length }})
      </button>
    </div>
  </div>
</template>
