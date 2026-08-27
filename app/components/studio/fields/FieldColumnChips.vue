<script setup lang="ts">
import StudioField from './StudioField.vue'

withDefaults(
  defineProps<{
    label?: string
    hint?: string
    columns: readonly string[]
    /** When set, adds a first chip clearing the selection (model → null). */
    noneLabel?: string
  }>(),
  { label: '', hint: '', noneLabel: '' },
)

const model = defineModel<string | null>({ default: null })
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <div class="flex flex-wrap gap-[7px]">
      <button
        v-if="noneLabel"
        type="button"
        class="rounded-[20px] border-[1.5px] px-[13px] py-[9px] text-[11.5px] font-bold transition-colors"
        :class="!model
          ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
          : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
        @click="model = null"
      >{{ noneLabel }}</button>
      <button
        v-for="c in columns"
        :key="c"
        type="button"
        class="rounded-[20px] border-[1.5px] px-[13px] py-[9px] font-mono text-[11.5px] font-semibold transition-colors"
        :class="model === c
          ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
          : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
        @click="model = c"
      >{{ c }}</button>
      <p v-if="!columns.length" class="text-[12px] text-[var(--studio-faint)]">Aucune colonne disponible.</p>
    </div>
  </StudioField>
</template>
