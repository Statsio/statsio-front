<script setup lang="ts">
import type { RefreshFrequency } from '@/api/data-sources'
import { REFRESH_FREQUENCY_OPTIONS } from '@/lib/refresh-frequency'

const props = defineProps<{
  modelValue: RefreshFrequency
  /** Mode édition : affiche « Actualiser maintenant » + les dates de dernière / prochaine synchro. */
  lastRefreshedAt?: string | null
  nextRefreshAt?: string | null
  refreshing?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [RefreshFrequency]
  'refresh-now': []
}>()

const isEditing = () => props.lastRefreshedAt !== undefined

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<template>
  <div class="space-y-5 py-2">
    <p class="text-sm text-[var(--studio-muted)]">
      Une tâche planifiée re-télécharge la ressource data.gouv.fr à cette fréquence et
      régénère le fichier de données. La première synchronisation a lieu à l'import.
    </p>

    <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      <button
        v-for="opt in REFRESH_FREQUENCY_OPTIONS"
        :key="opt.v"
        type="button"
        class="rounded-2xl border p-3.5 text-left text-sm font-semibold transition hover:-translate-y-0.5"
        :class="modelValue === opt.v
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
          : 'border-[var(--studio-line-strong)] bg-white text-[var(--studio-ink)] hover:border-[var(--color-primary)]/30'"
        @click="emit('update:modelValue', opt.v)"
      >
        {{ opt.l }}
      </button>
    </div>

    <p
      v-if="modelValue === 'none'"
      class="rounded-2xl border border-[var(--studio-line)] bg-[var(--studio-note)] p-4 text-xs text-[var(--studio-muted)]"
    >
      Aucune resynchronisation : la source restera figée à son état d'import et aucune
      information de fraîcheur ne sera affichée sur les cartes.
    </p>

    <div v-if="isEditing()" class="flex items-center gap-3 rounded-2xl border border-[var(--studio-line)] bg-[var(--studio-note)] p-3">
      <button
        type="button"
        class="flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
        :class="refreshing
          ? 'cursor-wait border-[var(--studio-line-strong)] text-[var(--studio-faint)]'
          : 'border-blue-200 text-blue-600 hover:bg-blue-50'"
        :disabled="refreshing"
        @click="emit('refresh-now')"
      >
        <svg class="h-3.5 w-3.5" :class="{ 'animate-spin': refreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Actualiser maintenant
      </button>
      <div class="text-[11px] leading-tight text-[var(--studio-muted)]">
        <p>Dernière synchronisation : {{ formatDate(lastRefreshedAt) }}</p>
        <p v-if="modelValue !== 'none'">Prochaine synchronisation : {{ formatDate(nextRefreshAt) }}</p>
      </div>
    </div>
  </div>
</template>
