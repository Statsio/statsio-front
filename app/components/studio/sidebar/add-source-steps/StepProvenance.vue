<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchSourceProvenances, type SourceProvenance } from '@/api/source-provenances'
import type { ProvenanceSelection } from '@/composables/useAddSourceWizard'

defineProps<{
  modelValue: ProvenanceSelection
  otherLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [ProvenanceSelection]
  'update:otherLabel': [string]
}>()

const provenances = ref<SourceProvenance[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    provenances.value = await fetchSourceProvenances()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex flex-col gap-4 py-2">
    <p class="text-sm text-slate-500">D'où proviennent les données de cette source ?</p>

    <div v-if="loading" class="flex items-center justify-center py-10">
      <svg class="h-6 w-6 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <div v-else class="flex flex-wrap gap-2.5">
      <button
        v-for="provenance in provenances"
        :key="provenance.id"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
        :class="modelValue === provenance.id
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary)_30%,transparent)]'
          : 'border-slate-200 bg-white text-slate-700 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]'"
        @click="emit('update:modelValue', provenance.id)"
      >
        {{ provenance.name }}
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
        :class="modelValue === 'other'
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary)_30%,transparent)]'
          : 'border-slate-200 bg-white text-slate-700 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]'"
        @click="emit('update:modelValue', 'other')"
      >
        Autre
      </button>
    </div>

    <div v-if="modelValue === 'other'">
      <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
        Site internet de la source
      </label>
      <input
        :value="otherLabel"
        type="text"
        class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
        placeholder="ex : www.exemple.com"
        @input="emit('update:otherLabel', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>
