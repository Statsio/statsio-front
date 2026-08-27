<script setup lang="ts">
import StudioField from './StudioField.vue'
import { FILTER_OPERATORS, type BlockFilter } from '@/types/studio'

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    columns: readonly string[]
    /** Valeurs distinctes proposées par colonne (clic = remplit le champ). */
    suggestions?: Record<string, readonly string[]>
    addLabel?: string
    emptyLabel?: string
  }>(),
  {
    label: '',
    hint: '',
    addLabel: '+ Ajouter un filtre',
    emptyLabel: 'Aucun filtre : le bloc lit toutes les lignes de la source.',
  },
)

const model = defineModel<BlockFilter[]>({ default: () => [] })

function patch(i: number, p: Partial<BlockFilter>) {
  model.value = model.value.map((f, k) => (k === i ? { ...f, ...p } : f))
}
function remove(i: number) {
  model.value = model.value.filter((_, k) => k !== i)
}
function add() {
  model.value = [...model.value, { column: props.columns[0] ?? '', operator: '=', value: '' }]
}
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <div class="flex flex-col gap-2.5">
      <div
        v-for="(filter, i) in model"
        :key="i"
        class="rounded-xl border border-[var(--studio-line)] bg-white p-4"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <span class="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[var(--studio-faint)]">Filtre {{ i + 1 }}</span>
          <button
            type="button"
            class="text-[11px] font-bold text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
            @click="remove(i)"
          >
            Retirer
          </button>
        </div>

        <!-- Colonne -->
        <div class="mb-3.5">
          <div class="mb-2 text-[11px] font-bold text-[var(--studio-faint)]">Colonne</div>
          <div class="flex max-h-[132px] flex-wrap gap-1.5 overflow-y-auto">
            <button
              v-for="c in columns"
              :key="c"
              type="button"
              class="rounded-[16px] border-[1.5px] px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-colors"
              :class="filter.column === c
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
              @click="patch(i, { column: c })"
            >{{ c }}</button>
            <p v-if="!columns.length" class="text-[12px] text-[var(--studio-faint)]">Aucune colonne disponible.</p>
          </div>
        </div>

        <!-- Opérateur -->
        <div class="mb-3.5">
          <div class="mb-2 text-[11px] font-bold text-[var(--studio-faint)]">Condition</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="op in FILTER_OPERATORS"
              :key="op.value"
              type="button"
              class="flex items-center gap-1.5 rounded-[9px] border-[1.5px] px-2.5 py-1.5 text-[11.5px] font-bold transition-colors"
              :class="filter.operator === op.value
                ? 'border-[var(--studio-ink)] bg-[var(--studio-ink)] text-white'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
              @click="patch(i, { operator: op.value })"
            >
              <span class="font-mono opacity-70">{{ op.short }}</span>
              {{ op.label }}
            </button>
          </div>
        </div>

        <!-- Valeur -->
        <div>
          <div class="mb-2 text-[11px] font-bold text-[var(--studio-faint)]">Valeur</div>
          <input
            :value="filter.value"
            type="text"
            class="studio-input studio-input--mono"
            placeholder="valeur exacte, ou un paramètre de page"
            @input="patch(i, { value: ($event.target as HTMLInputElement).value })"
          />
          <div v-if="(props.suggestions?.[filter.column] ?? []).length" class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="v in props.suggestions?.[filter.column]"
              :key="v"
              type="button"
              class="rounded-[5px] bg-[var(--studio-wash)] px-2 py-1 font-mono text-[10.5px] font-semibold text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-tag)] hover:text-[var(--studio-tag-ink)]"
              @click="patch(i, { value: v })"
            >{{ v }}</button>
          </div>
        </div>
      </div>

      <p
        v-if="!model.length"
        class="rounded-xl bg-[var(--studio-note)] px-3.5 py-3 text-[12.5px] leading-[1.5] text-[var(--studio-faint)]"
      >
        {{ emptyLabel }}
      </p>

      <button type="button" class="studio-add-btn" @click="add">{{ addLabel }}</button>
    </div>
  </StudioField>
</template>
