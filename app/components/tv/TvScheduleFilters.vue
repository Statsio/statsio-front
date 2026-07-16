<script setup lang="ts">
import type { TimePreset } from '@/types/tv-schedule'

export type DisplayMode = 'card' | 'grid'

const props = defineProps<{
  selectedPreset: TimePreset
  selectedDate: string
  displayMode: DisplayMode
}>()

const emit = defineEmits<{
  'select-preset': [preset: Exclude<TimePreset, 'custom'>]
  'select-date': [date: string]
  'update:displayMode': [mode: DisplayMode]
}>()

const PRESETS: Array<{ id: Exclude<TimePreset, 'custom'>; label: string }> = [
  { id: 'live', label: 'En ce moment' },
  { id: 'tonight', label: 'Ce soir' },
  { id: 'tomorrow', label: 'Demain soir' },
  { id: 'weekend', label: 'Ce week-end' },
]

function onDateInput(e: Event) {
  emit('select-date', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="preset in PRESETS"
        :key="preset.id"
        type="button"
        class="rounded-full px-4 py-2 text-[13px] font-semibold transition"
        :class="
          props.selectedPreset === preset.id
            ? 'bg-slate-950 text-white'
            : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        "
        @click="emit('select-preset', preset.id)"
      >
        {{ preset.label }}
      </button>

      <input
        :value="props.selectedDate"
        type="date"
        class="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-tvstats-primary/40 focus:ring-4 focus:ring-tvstats-primary/10"
        @input="onDateInput"
      />
    </div>

    <div class="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-xs font-bold transition"
        :class="props.displayMode === 'card' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-700'"
        @click="emit('update:displayMode', 'card')"
      >
        ▦ Carte
      </button>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-xs font-bold transition"
        :class="props.displayMode === 'grid' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-700'"
        @click="emit('update:displayMode', 'grid')"
      >
        ☰ Grille
      </button>
    </div>
  </div>
</template>
