<script setup lang="ts">
import { computed } from 'vue'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { columnRefLabel } from '@/lib/studio-columns'
import { useColumnDrillIn } from '@/composables/useColumnDrillIn'
import type { StudioBlock } from '@/types/studio'
import StudioField from './StudioField.vue'

const props = defineProps<{
  block: StudioBlock
  modelValue: string[]
  label: string
  hint?: string
  /** Réfs à exclure du choix (ex. déjà dans l'autre groupe). */
  exclude?: string[]
  addLabel?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>()

const datasets = useStudioDatasetsStore()
const drillIn = useColumnDrillIn()

const refs = computed(() => props.modelValue ?? [])
const refLabel = (ref: string) => columnRefLabel(ref, props.block, datasets)

function write(next: string[]) {
  const excl = new Set(props.exclude ?? [])
  emit('update:modelValue', [...new Set(next)].filter((r) => !excl.has(r)))
}
function remove(ref: string) {
  write(refs.value.filter((c) => c !== ref))
}
function pick() {
  drillIn.open({
    block: props.block,
    title: props.label,
    multi: true,
    selected: [...refs.value],
    onCommit: (picked) => write(picked),
  })
}
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <div class="flex flex-col gap-2">
      <div v-if="refs.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="ref in refs"
          :key="ref"
          class="flex items-center gap-1.5 rounded-[7px] bg-[var(--studio-tag)] px-2 py-1 font-mono text-[11px] font-semibold text-[var(--studio-tag-ink)]"
        >
          {{ refLabel(ref) }}
          <button
            type="button"
            class="text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
            aria-label="Retirer"
            @click="remove(ref)"
          >✕</button>
        </span>
      </div>
      <button
        type="button"
        class="self-start rounded-lg border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--color-primary)]"
        @click="pick"
      >{{ refs.length ? 'Modifier' : (addLabel ?? '+ Choisir les colonnes') }}</button>
      <p v-if="$slots.help" class="text-[11px] leading-relaxed text-[var(--studio-faint)]">
        <slot name="help" />
      </p>
    </div>
  </StudioField>
</template>
