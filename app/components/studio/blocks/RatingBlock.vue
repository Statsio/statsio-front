<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StudioBlock } from '@/types/studio'
import { useFormBlockResponse } from '@/composables/useFormBlockResponse'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const ratingMax = computed(() => props.block.config.ratingMax ?? 5)
const stars = computed(() => {
  const arr: number[] = []
  for (let i = 1; i <= ratingMax.value; i++) arr.push(i)
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
</script>

<template>
  <div class="flex flex-col gap-3 p-5">
    <p class="text-sm font-semibold text-slate-800">
      {{ block.config.title || 'Question sans titre' }}
      <span v-if="block.config.formRequired" class="text-rose-500">*</span>
    </p>

    <!-- Studio editor preview (static, disabled) -->
    <div v-if="!readonly" class="flex flex-col gap-1">
      <div class="flex items-center gap-1">
        <svg v-for="s in stars" :key="s" class="h-6 w-6 fill-slate-200 text-slate-200" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
      <p class="mt-1 text-[10px] text-slate-400">Non interactif en mode édition</p>
    </div>

    <!-- Public: loading -->
    <div v-else-if="form?.loading.value" class="py-2 text-xs text-slate-400">Chargement…</div>

    <!-- Public: interactive form -->
    <div v-else-if="showForm()" class="flex flex-col gap-3">
      <div class="flex items-center gap-1">
        <button v-for="s in stars" :key="s" type="button" class="rounded-full p-0.5 transition" @click="selected = s">
          <svg class="h-7 w-7 transition-colors" :class="(selected ?? 0) >= s ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
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
        <div class="flex items-center gap-0.5">
          <svg v-for="s in stars" :key="s" class="h-5 w-5" :class="(form?.aggregate.value.average ?? 0) >= s ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <span class="text-sm font-semibold text-slate-800">{{ (form?.aggregate.value.average ?? 0).toFixed(1) }} / {{ ratingMax }}</span>
      </div>
      <p class="text-[11px] text-slate-400">
        {{ form?.aggregate.value.totalResponses }} avis
        · <button class="font-semibold text-[var(--color-primary)] hover:underline" @click="edit">Modifier ma réponse</button>
      </p>
    </div>
  </div>
</template>
