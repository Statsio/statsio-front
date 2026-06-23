<script setup lang="ts">
import { SECTION_LAYOUT_DEFINITIONS } from '@/types/studio'
import { useStudioStore } from '@/stores/studio'
import type { SectionLayout } from '@/types/studio'

const studio = useStudioStore()

function onDragStart(event: DragEvent, type: SectionLayout) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('studio-section-layout', type)
  event.dataTransfer.effectAllowed = 'copy'
}

function addSection(type: SectionLayout) {
  studio.addSection(type)
}

const colColors = ['bg-[var(--color-primary)]/25', 'bg-blue-400/20', 'bg-emerald-400/20']
</script>

<template>
  <div class="px-3 py-3 flex flex-col gap-2">
    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1">
      Glisser ou cliquer pour ajouter
    </p>

    <div
      v-for="def in SECTION_LAYOUT_DEFINITIONS"
      :key="def.type"
      class="group relative flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 cursor-grab active:cursor-grabbing hover:border-[var(--color-primary)] hover:shadow-sm transition-all select-none"
      draggable="true"
      :title="`Ajouter section : ${def.label}`"
      @dragstart="onDragStart($event, def.type)"
      @click="addSection(def.type)"
    >
      <!-- Visual preview of column layout -->
      <div class="flex gap-1 h-10">
        <div
          v-for="(span, i) in def.gridCols"
          :key="i"
          class="rounded-md transition-colors"
          :class="colColors[i] ?? 'bg-slate-200/60'"
          :style="{ flex: span }"
        />
      </div>

      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-700">{{ def.label }}</span>
        <span class="text-[10px] text-slate-400">{{ def.cols }} col.</span>
      </div>

      <!-- Tooltip -->
      <div class="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div class="bg-slate-800/80 text-white text-[10px] font-semibold px-2 py-1 rounded-lg">
          Cliquer ou glisser
        </div>
      </div>
    </div>

    <p class="text-[10px] text-slate-400 text-center mt-1 px-1 leading-relaxed">
      Glissez sur le canvas pour insérer à un emplacement précis, ou cliquez pour ajouter en bas.
    </p>
  </div>
</template>
