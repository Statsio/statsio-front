<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StudioBlock } from '@/types/studio'
import { useFormBlockResponse } from '@/composables/useFormBlockResponse'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const min = computed(() => props.block.config.scaleMin ?? 1)
const max = computed(() => props.block.config.scaleMax ?? 5)
const minLabel = computed(() => props.block.config.scaleMinLabel ?? '')
const maxLabel = computed(() => props.block.config.scaleMaxLabel ?? '')
const steps = computed(() => {
  const arr: number[] = []
  for (let i = min.value; i <= max.value; i++) arr.push(i)
  return arr
})

const selected = ref<number | null>(null)

const form = props.readonly ? useFormBlockResponse(() => props.block.id) : null

function showForm() {
  if (!form) return true
  return !form.answered.value || form.editing.value
}

function submit() {
  if (selected.value === null || !form) return
  form.submit(selected.value)
}

function edit() {
  if (!form) return
  selected.value = typeof form.myAnswer.value === 'number' ? form.myAnswer.value : null
  form.startEditing()
}

const distributionMax = computed(() => Math.max(1, ...Object.values(form?.aggregate.value.distribution ?? {})))
function countFor(step: number): number {
  return form?.aggregate.value.distribution?.[String(step)] ?? 0
}
</script>

<template>
  <div class="flex flex-col gap-3 p-5">
    <p class="text-sm font-semibold text-slate-800">
      {{ block.config.title || 'Question sans titre' }}
      <span v-if="block.config.formRequired" class="text-rose-500">*</span>
    </p>

    <!-- Studio editor preview (static, disabled) -->
    <div v-if="!readonly" class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span v-if="minLabel" class="text-xs text-slate-400">{{ minLabel }}</span>
        <button v-for="s in steps" :key="s" disabled class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-xs text-slate-400">{{ s }}</button>
        <span v-if="maxLabel" class="text-xs text-slate-400">{{ maxLabel }}</span>
      </div>
      <p class="mt-1 text-[10px] text-slate-400">Non interactif en mode édition</p>
    </div>

    <!-- Public: loading -->
    <div v-else-if="form?.loading.value" class="py-2 text-xs text-slate-400">Chargement…</div>

    <!-- Public: interactive form -->
    <div v-else-if="showForm()" class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <span v-if="minLabel" class="text-xs text-slate-400">{{ minLabel }}</span>
        <button
          v-for="s in steps" :key="s"
          class="flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors"
          :class="selected === s ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-slate-200 text-slate-600 hover:border-[var(--color-primary)]'"
          @click="selected = s"
        >
          {{ s }}
        </button>
        <span v-if="maxLabel" class="text-xs text-slate-400">{{ maxLabel }}</span>
      </div>
      <button
        class="self-start rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        :disabled="selected === null || form?.submitting.value"
        @click="submit"
      >
        {{ form?.submitting.value ? 'Envoi…' : 'Envoyer' }}
      </button>
    </div>

    <!-- Public: results -->
    <div v-else class="flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <span class="text-2xl font-bold text-slate-900">{{ (form?.aggregate.value.average ?? 0).toFixed(1) }}</span>
        <span class="text-xs text-slate-400">/ {{ max }} · moyenne</span>
      </div>
      <div class="flex items-end gap-1.5">
        <div v-for="s in steps" :key="s" class="flex flex-1 flex-col items-center gap-1">
          <div class="flex h-16 w-full items-end overflow-hidden rounded bg-slate-100">
            <div class="w-full rounded bg-[var(--color-primary)]" :style="{ height: `${(countFor(s) / distributionMax) * 100}%` }" />
          </div>
          <span class="text-[10px] text-slate-400">{{ s }}</span>
        </div>
      </div>
      <p class="mt-1 text-[11px] text-slate-400">
        {{ form?.aggregate.value.totalResponses }} réponse{{ (form?.aggregate.value.totalResponses ?? 0) > 1 ? 's' : '' }}
        · <button class="font-semibold text-[var(--color-primary)] hover:underline" @click="edit">Modifier ma réponse</button>
      </p>
    </div>
  </div>
</template>
