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

function pick(opt: string) {
  if (!form || form.submitting.value) return
  selected.value = opt
  form.submit(opt)
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
const leadPercent = computed(() =>
  Math.max(0, ...(form?.aggregate.value.options?.map((o) => o.percent) ?? [])),
)
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
          class="rounded-[13px] border-[1.5px] border-slate-200 bg-[#faf9fd] px-4 py-4 text-[14.5px] font-bold text-slate-950"
        >
          {{ opt }}
        </div>
        <p class="text-[10px] text-[var(--studio-faint)]">Aperçu — interactif sur la page publiée</p>
      </div>

      <!-- Public: loading -->
      <div v-else-if="form?.loading.value" class="py-2 text-xs text-[var(--studio-faint)]">Chargement…</div>

      <!-- Public: interactive form — clic = réponse enregistrée (comme un vote) -->
      <div v-else-if="showForm()" class="flex flex-col gap-2.5">
        <button
          v-for="opt in options"
          :key="opt"
          type="button"
          class="rounded-[13px] border-[1.5px] px-4 py-4 text-left text-[14.5px] font-bold text-slate-950 transition hover:border-[var(--color-primary)] hover:bg-[#faf8ff] disabled:opacity-60"
          :class="selected === opt ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-slate-200 bg-[#faf9fd]'"
          :disabled="form?.submitting.value"
          @click="pick(opt)"
        >
          {{ opt }}
        </button>
      </div>

      <!-- Public: results -->
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="opt in options"
          :key="opt"
          class="relative overflow-hidden rounded-xl border border-slate-200/80 px-4 py-3.5"
        >
          <span
            class="absolute inset-y-0 left-0"
            :style="{ width: `${percentFor(opt)}%`, background: percentFor(opt) === leadPercent && leadPercent > 0 ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.05)' }"
          />
          <span class="relative flex items-center justify-between gap-3">
            <span class="text-[14.5px] font-bold text-slate-950" :class="form?.myAnswer.value === opt ? 'text-[var(--color-primary)]' : ''">
              {{ opt }}<span v-if="form?.myAnswer.value === opt" class="ml-1.5 text-[11px]">✓ votre réponse</span>
            </span>
            <span class="shrink-0 font-mono text-[13.5px] font-semibold text-slate-700">{{ percentFor(opt) }}%</span>
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
