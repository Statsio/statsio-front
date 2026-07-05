<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StudioBlock } from '@/types/studio'
import { useFormBlockResponse } from '@/composables/useFormBlockResponse'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const options = computed(() => props.block.config.formOptions ?? [])
const isEmpty = computed(() => options.value.length === 0)

const selected = ref<string>('')

const form = props.readonly ? useFormBlockResponse(() => props.block.id) : null

function showForm() {
  if (!form) return true
  return !form.answered.value || form.editing.value
}

function submit() {
  if (!selected.value || !form) return
  form.submit(selected.value)
}

function edit() {
  if (!form) return
  selected.value = typeof form.myAnswer.value === 'string' ? form.myAnswer.value : ''
  form.startEditing()
}

function percentFor(value: string): number {
  const opt = form?.aggregate.value.options?.find((o) => o.value === value)
  return opt?.percent ?? 0
}
function countFor(value: string): number {
  const opt = form?.aggregate.value.options?.find((o) => o.value === value)
  return opt?.count ?? 0
}
</script>

<template>
  <div class="flex flex-col gap-3 p-5">
    <div v-if="isEmpty" class="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-slate-400">
      <span class="text-xs font-medium">Configurer les options →</span>
    </div>

    <template v-else>
      <p class="text-sm font-semibold text-slate-800">
        {{ block.config.title || 'Question sans titre' }}
        <span v-if="block.config.formRequired" class="text-rose-500">*</span>
      </p>

      <!-- Studio editor preview (static, disabled) -->
      <div v-if="!readonly" class="flex flex-col gap-2">
        <label v-for="opt in options" :key="opt" class="flex items-center gap-2.5 text-sm text-slate-500">
          <input type="radio" disabled class="h-4 w-4 border-slate-300" />
          {{ opt }}
        </label>
        <p class="mt-1 text-[10px] text-slate-400">Non interactif en mode édition</p>
      </div>

      <!-- Public: loading -->
      <div v-else-if="form?.loading.value" class="py-2 text-xs text-slate-400">Chargement…</div>

      <!-- Public: interactive form -->
      <div v-else-if="showForm()" class="flex flex-col gap-2.5">
        <label v-for="opt in options" :key="opt" class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-[var(--color-primary)]" :class="selected === opt ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : ''">
          <input v-model="selected" type="radio" :value="opt" class="h-4 w-4 border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30" />
          {{ opt }}
        </label>
        <button
          class="mt-1 self-start rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          :disabled="!selected || form?.submitting.value"
          @click="submit"
        >
          {{ form?.submitting.value ? 'Envoi…' : 'Envoyer' }}
        </button>
      </div>

      <!-- Public: results -->
      <div v-else class="flex flex-col gap-2">
        <div v-for="opt in options" :key="opt" class="flex flex-col gap-1">
          <div class="flex items-center justify-between text-xs text-slate-600">
            <span>{{ opt }}</span>
            <span class="font-semibold">{{ percentFor(opt) }}% ({{ countFor(opt) }})</span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full bg-[var(--color-primary)]" :style="{ width: `${percentFor(opt)}%` }" />
          </div>
        </div>
        <p class="mt-1 text-[11px] text-slate-400">
          {{ form?.aggregate.value.totalResponses }} réponse{{ (form?.aggregate.value.totalResponses ?? 0) > 1 ? 's' : '' }}
          · <button class="font-semibold text-[var(--color-primary)] hover:underline" @click="edit">Modifier ma réponse</button>
        </p>
      </div>
    </template>
  </div>
</template>
