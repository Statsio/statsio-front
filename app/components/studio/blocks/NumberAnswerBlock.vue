<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StudioBlock } from '@/types/studio'
import { useFormBlockResponse } from '@/composables/useFormBlockResponse'

/** Question « Nombre » : valeur chiffrée avec unité, bornes min / max facultatives. */
const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const unit = computed(() => props.block.config.formUnit?.trim() ?? '')
const min = computed(() => props.block.config.formMin)
const max = computed(() => props.block.config.formMax)

const value = ref<number | null>(null)
const form = props.readonly ? useFormBlockResponse(() => props.block.id) : null

function showForm() {
  if (!form) return true
  return !form.answered.value || form.editing.value
}

const invalid = computed(() => {
  const v = value.value
  if (v === null || Number.isNaN(v)) return true
  if (min.value != null && v < min.value) return true
  if (max.value != null && v > max.value) return true
  return false
})

function step(delta: number) {
  const next = (value.value ?? min.value ?? 0) + delta
  value.value = Math.min(max.value ?? Infinity, Math.max(min.value ?? -Infinity, next))
}

function submit() {
  if (!form || invalid.value || value.value === null) return
  form.submit(value.value)
}

function edit() {
  if (!form) return
  value.value = typeof form.myAnswer.value === 'number' ? form.myAnswer.value : null
  form.startEditing()
}

const fmt = (n?: number | null) => (n == null ? '—' : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }))
const agg = computed(() => form?.aggregate.value)
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <p v-if="block.config.title || !readonly" class="text-[15px] font-bold">
      {{ block.config.title || 'Question sans titre' }}
      <span v-if="block.config.formRequired" class="text-rose-500">*</span>
    </p>

    <!-- Studio : aperçu statique -->
    <div v-if="!readonly" class="flex flex-col gap-2">
      <div class="inline-flex h-[46px] w-max max-w-full items-stretch overflow-hidden rounded-[4px] border-2 border-[var(--ds-ol)]">
        <span class="flex w-11 items-center justify-center bg-[var(--ds-tint)] font-bold text-[var(--ds-accent)]">−</span>
        <span class="flex min-w-[110px] items-center justify-center border-x-2 border-[var(--ds-divide)] px-3.5 font-mono text-[15px] text-[var(--ds-faint)]">0</span>
        <span v-if="unit" class="flex items-center px-3.5 font-mono text-[14px]">{{ unit }}</span>
        <span class="flex w-11 items-center justify-center bg-[var(--ds-tint)] font-bold text-[var(--ds-accent)]">+</span>
      </div>
      <p class="text-[10px] text-[var(--studio-faint)]">Aperçu — interactif sur la page publiée</p>
    </div>

    <div v-else-if="form?.loading.value" class="py-2 text-xs text-[var(--studio-faint)]">Chargement…</div>

    <!-- Public : saisie -->
    <div v-else-if="showForm()" class="flex flex-col gap-3">
      <div class="inline-flex h-[46px] w-max max-w-full items-stretch overflow-hidden rounded-[4px] border-2 border-[var(--ds-ol)]">
        <button type="button" class="w-11 bg-[var(--ds-tint)] font-bold text-[var(--ds-accent)]" aria-label="Diminuer" @click="step(-1)">−</button>
        <input
          v-model.number="value"
          type="number"
          inputmode="decimal"
          class="w-[120px] border-x-2 border-[var(--ds-divide)] bg-transparent px-3 text-center font-mono text-[15px] focus:outline-none"
          :min="min ?? undefined"
          :max="max ?? undefined"
          :aria-label="block.config.title || 'Votre réponse'"
        />
        <span v-if="unit" class="flex items-center px-3.5 font-mono text-[14px]">{{ unit }}</span>
        <button type="button" class="w-11 bg-[var(--ds-tint)] font-bold text-[var(--ds-accent)]" aria-label="Augmenter" @click="step(1)">+</button>
      </div>
      <p v-if="min != null || max != null" class="text-[12px] text-[var(--ds-muted)]">
        Entre {{ fmt(min) }} et {{ fmt(max) }}{{ unit ? ` ${unit}` : '' }}.
      </p>
      <button
        class="self-start rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        :disabled="invalid || form?.submitting.value"
        @click="submit"
      >
        {{ form?.submitting.value ? 'Envoi…' : 'Valider ma réponse' }}
      </button>
      <p v-if="form?.submitError.value" class="text-[12.5px] text-rose-600" role="alert">{{ form.submitError.value }}</p>
    </div>

    <!-- Public : résultats masqués -->
    <div v-else-if="form?.resultsHiddenText.value" class="flex flex-col gap-1.5 rounded-[4px] border-2 border-[var(--ds-divide)] px-4 py-3">
      <p class="text-[14px] font-bold">✓ Réponse enregistrée</p>
      <p class="text-[12.5px] text-[var(--ds-muted)]">{{ form.resultsHiddenText.value }}</p>
      <button v-if="form.canChange.value" type="button" class="self-start text-[12.5px] font-semibold text-[var(--color-primary)] hover:underline" @click="edit">Modifier ma réponse</button>
    </div>

    <!-- Public : résultats -->
    <div v-else class="flex flex-col gap-2">
      <div class="flex flex-wrap gap-6">
        <div>
          <span class="block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--ds-muted)]">Médiane</span>
          <b class="text-[26px] font-extrabold text-[var(--ds-accent)]">{{ fmt(agg?.median) }}</b> <span class="font-mono text-[13px]">{{ unit }}</span>
        </div>
        <div>
          <span class="block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--ds-muted)]">Moyenne</span>
          <b class="text-[26px] font-extrabold">{{ fmt(agg?.average) }}</b> <span class="font-mono text-[13px]">{{ unit }}</span>
        </div>
      </div>
      <p class="text-[11.5px] text-[var(--ds-faint)]">
        {{ agg?.totalResponses ?? 0 }} réponse{{ (agg?.totalResponses ?? 0) > 1 ? 's' : '' }}
        <template v-if="form?.canChange.value">· <button class="font-semibold text-[var(--color-primary)] hover:underline" @click="edit">Modifier ma réponse</button></template>
      </p>
    </div>
  </div>
</template>
