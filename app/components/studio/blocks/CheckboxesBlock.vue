<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StudioBlock } from '@/types/studio'
import { useFormBlockResponse } from '@/composables/useFormBlockResponse'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const options = computed(() => props.block.config.formOptions ?? [])
const isEmpty = computed(() => options.value.length === 0)

const selected = ref<string[]>([])

const form = props.readonly ? useFormBlockResponse(() => props.block.id) : null

function showForm() {
  if (!form) return true
  return !form.answered.value || form.editing.value
}

function toggle(opt: string, checked: boolean) {
  selected.value = checked ? [...selected.value, opt] : selected.value.filter((v) => v !== opt)
}

function submit() {
  if (!selected.value.length || !form) return
  form.submit(selected.value)
}

function edit() {
  if (!form) return
  selected.value = Array.isArray(form.myAnswer.value) ? [...form.myAnswer.value] : []
  form.startEditing()
}

function percentFor(value: string): number {
  return form?.aggregate.value.options?.find((o) => o.value === value)?.percent ?? 0
}
function countFor(value: string): number {
  return form?.aggregate.value.options?.find((o) => o.value === value)?.count ?? 0
}
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <div v-if="isEmpty" class="flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[var(--studio-line)] bg-[var(--studio-note)] py-10 text-[var(--studio-faint)]">
      <span class="text-xs font-medium">Configurer les options →</span>
    </div>

    <template v-else>
      <p v-if="block.config.title || !readonly" class="text-[15px] font-bold text-slate-950">
        {{ block.config.title || 'Question sans titre' }}
        <span v-if="block.config.formRequired" class="text-rose-500">*</span>
      </p>

      <!-- Studio editor preview — même rendu, statique -->
      <div v-if="!readonly" class="flex flex-col gap-2.5">
        <div
          v-for="opt in options"
          :key="opt"
          class="flex items-center gap-3 rounded-[13px] border-[1.5px] border-slate-200 bg-[#faf9fd] px-4 py-3.5 text-[14.5px] font-bold text-slate-950"
        >
          <span class="h-5 w-5 shrink-0 rounded-md border-2 border-slate-300" />
          {{ opt }}
        </div>
        <p class="text-[10px] text-[var(--studio-faint)]">Aperçu — interactif sur la page publiée</p>
      </div>

      <!-- Public: loading -->
      <div v-else-if="form?.loading.value" class="py-2 text-xs text-[var(--studio-faint)]">Chargement…</div>

      <!-- Public: interactive form -->
      <div v-else-if="showForm()" class="flex flex-col gap-2.5">
        <button
          v-for="opt in options"
          :key="opt"
          type="button"
          class="flex items-center gap-3 rounded-[13px] border-[1.5px] px-4 py-3.5 text-left text-[14.5px] font-bold text-slate-950 transition hover:border-[var(--color-primary)]"
          :class="selected.includes(opt) ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-slate-200 bg-[#faf9fd]'"
          @click="toggle(opt, !selected.includes(opt))"
        >
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
            :class="selected.includes(opt) ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-slate-300'"
          >
            <svg v-if="selected.includes(opt)" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </span>
          {{ opt }}
        </button>
        <button
          class="mt-1 self-start rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          :disabled="!selected.length || form?.submitting.value"
          @click="submit"
        >
          {{ form?.submitting.value ? 'Envoi…' : 'Valider ma réponse' }}
        </button>
      </div>

      <!-- Public: results -->
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="opt in options"
          :key="opt"
          class="relative overflow-hidden rounded-xl border border-slate-200/80 px-4 py-3.5"
        >
          <span class="absolute inset-y-0 left-0 bg-[rgba(139,92,246,0.08)]" :style="{ width: `${percentFor(opt)}%` }" />
          <span class="relative flex items-center justify-between gap-3">
            <span class="text-[14.5px] font-bold text-slate-950">{{ opt }}</span>
            <span class="shrink-0 font-mono text-[13.5px] font-semibold text-slate-700">{{ percentFor(opt) }}% ({{ countFor(opt) }})</span>
          </span>
        </div>
        <p class="text-[11.5px] text-slate-400">
          {{ form?.aggregate.value.totalResponses }} réponse{{ (form?.aggregate.value.totalResponses ?? 0) > 1 ? 's' : '' }}
          · <button class="font-semibold text-[var(--color-primary)] hover:underline" @click="edit">Modifier ma réponse</button>
        </p>
      </div>
    </template>
  </div>
</template>
