<script setup lang="ts">
import type { StudioBlockType } from '@/types/studio-document'
import { studioPaletteMedia, studioPaletteText, studioPaletteViz } from '@/data/studio-palette'
import StudioBlockPalette from '@/components/studio/StudioBlockPalette.vue'

defineEmits<{
  'add-block': [StudioBlockType]
}>()
</script>

<template>
  <aside
    class="flex w-full max-w-full shrink-0 flex-col border-b border-slate-200 bg-white/90 lg:w-[min(20rem,100%)] lg:border-b-0 lg:border-r lg:border-slate-200"
    aria-label="Bibliothèque de blocs"
  >
    <div class="flex max-h-[min(70vh,32rem)] flex-1 flex-col gap-6 overflow-y-auto p-4 lg:max-h-none lg:flex-none lg:overflow-visible lg:p-5">
      <section aria-labelledby="studio-text-heading">
        <h2 id="studio-text-heading" class="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Textes
        </h2>
        <StudioBlockPalette :items="studioPaletteText" @add="$emit('add-block', $event)" />
      </section>

      <section aria-labelledby="studio-viz-heading">
        <h2 id="studio-viz-heading" class="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Graphiques et tableaux
        </h2>
        <StudioBlockPalette :items="studioPaletteViz" @add="$emit('add-block', $event)" />
      </section>

      <section aria-labelledby="studio-media-heading">
        <h2 id="studio-media-heading" class="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Images
        </h2>
        <StudioBlockPalette :items="studioPaletteMedia" @add="$emit('add-block', $event)" />
      </section>
    </div>
  </aside>
</template>
