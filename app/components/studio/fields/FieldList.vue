<script setup lang="ts">
import StudioField from './StudioField.vue'

withDefaults(
  defineProps<{
    label?: string
    hint?: string
    addLabel?: string
    placeholder?: string
    reorderable?: boolean
  }>(),
  { label: '', hint: '', addLabel: '+ Ajouter', placeholder: '', reorderable: false },
)

const model = defineModel<string[]>({ default: () => [] })

function update(i: number, value: string) {
  model.value = model.value.map((v, k) => (k === i ? value : v))
}
function remove(i: number) {
  model.value = model.value.filter((_, k) => k !== i)
}
function add() {
  model.value = [...model.value, '']
}
function move(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= model.value.length) return
  const next = [...model.value]
  ;[next[i], next[j]] = [next[j]!, next[i]!]
  model.value = next
}
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <div class="flex flex-col gap-[7px]">
      <div v-for="(item, i) in model" :key="i" class="flex items-center gap-[7px]">
        <span v-if="reorderable" class="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            class="flex h-[14px] w-[22px] items-center justify-center rounded-[5px] bg-[var(--studio-wash)] text-[9px] text-[var(--studio-muted)]"
            @click="move(i, -1)"
          >▲</button>
          <button
            type="button"
            class="flex h-[14px] w-[22px] items-center justify-center rounded-[5px] bg-[var(--studio-wash)] text-[9px] text-[var(--studio-muted)]"
            @click="move(i, 1)"
          >▼</button>
        </span>
        <input
          :value="item"
          type="text"
          class="studio-input !py-[10px] !text-[12.5px]"
          :placeholder="placeholder"
          @input="update(i, ($event.target as HTMLInputElement).value)"
        />
        <button
          type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] text-[var(--studio-faint)] transition-colors hover:bg-[var(--studio-wash)] hover:text-[var(--color-error)]"
          aria-label="Retirer"
          @click="remove(i)"
        >✕</button>
      </div>
      <button type="button" class="studio-add-btn !rounded-[10px] !p-2.5" @click="add">{{ addLabel }}</button>
    </div>
  </StudioField>
</template>
