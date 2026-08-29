<script setup lang="ts">
import type { ApiFormShape, HttpMethod } from '@/composables/useAddSourceWizard'
import { useApiStructureDetection } from '@/composables/useAddSourceWizard'
import ApiDetectionResults from './ApiDetectionResults.vue'

const props = defineProps<{ apiForm: ApiFormShape }>()

const emit = defineEmits<{
  'update:apiForm': [ApiFormShape]
  advance: []
}>()

function updateApiForm(patch: Partial<ApiFormShape>) {
  emit('update:apiForm', { ...props.apiForm, ...patch })
}

const { detectStatus, detectResult, detectError, runDetection } = useApiStructureDetection(
  () => props.apiForm,
  updateApiForm,
)
</script>

<template>
  <div class="flex flex-col gap-5 py-2">
    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">
        URL de l'API <span class="text-red-400">*</span>
      </label>
      <div class="flex gap-2">
        <AppSelect
          :model-value="apiForm.method"
          :options="[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }]"
          class="shrink-0 w-24"
          teleport
          @update:model-value="updateApiForm({ method: $event as HttpMethod })"
        />
        <input
          :value="apiForm.url"
          type="url"
          class="flex-1 rounded-xl border border-[var(--studio-line-strong)] px-4 py-2.5 text-sm text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all font-mono"
          placeholder="https://api.example.com/data"
          @input="updateApiForm({ url: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <p class="text-[11px] text-[var(--studio-faint)] mt-1">
        Lancez la configuration automatique pour pré-remplir l'enveloppe, la pagination et les
        filtres exploitables — ou passez directement à la configuration manuelle.
      </p>
    </div>

    <div class="flex gap-3">
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
        :class="detectStatus === 'loading' ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'"
        :disabled="!apiForm.url.trim() || detectStatus === 'loading'"
        @click="runDetection"
      >
        <svg v-if="detectStatus === 'loading'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        </svg>
        {{ detectStatus === 'loading' ? 'Analyse en cours…' : 'Lancer la configuration automatique' }}
      </button>
      <button
        type="button"
        class="flex-1 rounded-xl border border-[var(--studio-line-strong)] py-2.5 text-sm font-semibold text-[var(--studio-muted)] transition-all hover:bg-[var(--studio-note)] disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!apiForm.url.trim()"
        @click="emit('advance')"
      >
        Passer à l'édition manuelle
      </button>
    </div>

    <p v-if="detectStatus === 'error'" class="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">
      {{ detectError }}
    </p>

    <template v-if="detectStatus === 'detected' && detectResult">
      <p class="text-xs font-medium text-emerald-600">
        Structure détectée — vérifiez ci-dessous, puis cliquez sur "Suivant" pour continuer.
      </p>
      <ApiDetectionResults :result="detectResult" />
    </template>
  </div>
</template>
