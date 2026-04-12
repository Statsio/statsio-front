<script setup lang="ts">
import type { StudioBlock } from '@/types/studio-document'
import type { StudioLeftTabId } from '@/components/studio/studio-left-dock.types'

defineProps<{
  block: StudioBlock
}>()

const emit = defineEmits<{
  'open-tab': [StudioLeftTabId]
}>()

const typeLabel: Record<StudioBlock['type'], string> = {
  text_heading: 'Titre',
  text_paragraph: 'Paragraphe',
  chart: 'Graphique',
  table: 'Tableau',
  image: 'Image',
}
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-sm sm:px-6"
    role="region"
    aria-label="Bloc sélectionné"
  >
    <div class="flex min-w-0 items-center gap-2">
      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {{ typeLabel[block.type] }}
      </span>
      <span class="truncate text-sm text-slate-700">Bloc sélectionné — le panneau de propriétés s’ouvre à gauche.</span>
    </div>
    <div class="flex shrink-0 flex-wrap gap-2">
      <button
        type="button"
        class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
        @click="emit('open-tab', 'inspector')"
      >
        Réafficher les propriétés
      </button>
      <button
        type="button"
        class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
        @click="emit('open-tab', 'blocks')"
      >
        Plan des blocs
      </button>
    </div>
  </div>
</template>
