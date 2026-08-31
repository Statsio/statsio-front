<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StudioBlock } from '@/types/studio'
import { useFormBlockResponse } from '@/composables/useFormBlockResponse'
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const options = computed(() => props.block.config.formOptions ?? [])
const isEmpty = computed(() => options.value.length === 0)
const selectOptions = computed(() => options.value.map((o) => ({ value: o, label: o })))

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
  return form?.aggregate.value.options?.find((o) => o.value === value)?.percent ?? 0
}
function countFor(value: string): number {
  return form?.aggregate.value.options?.find((o) => o.value === value)?.count ?? 0
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-if="isEmpty" class="flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[var(--studio-line)] bg-[var(--studio-note)] py-10 text-[var(--studio-faint)]">
      <span class="text-xs font-medium">Configurer les options →</span>
    </div>

    <template v-else>
      <p v-if="block.config.title || !readonly" class="text-[15px] font-bold text-slate-950">
        {{ block.config.title || 'Question sans titre' }}
        <span v-if="block.config.formRequired" class="text-rose-500">*</span>
      </p>

      <!-- Studio editor preview — même rendu, statique -->
      <template v-if="!readonly">
        <AppSelect model-value="" :options="selectOptions" disabled placeholder="Sélectionner…" />
        <p class="mt-1 text-[10px] text-[var(--studio-faint)]">Aperçu — interactif sur la page publiée</p>
      </template>

      <!-- Public: loading -->
      <div v-else-if="form?.loading.value" class="py-2 text-xs text-[var(--studio-faint)]">Chargement…</div>

      <!-- Public: interactive form -->
      <div v-else-if="showForm()" class="flex flex-col gap-2.5">
        <AppSelect v-model="selected" :options="selectOptions" placeholder="Sélectionner…" teleport />
        <button
          class="mt-1 self-start rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          :disabled="!selected || form?.submitting.value"
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
