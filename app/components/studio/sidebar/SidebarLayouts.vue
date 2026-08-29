<script setup lang="ts">
import { computed } from 'vue'
import { SECTION_LAYOUT_DEFINITIONS, SECTION_PRESETS } from '@/types/studio'
import { useStudioStore } from '@/stores/studio'
import type { SectionLayout } from '@/types/studio'

const studio = useStudioStore()

const outline = computed(() => studio.currentPageSections)

function onDragStart(event: DragEvent, type: SectionLayout) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('studio-section-layout', type)
  event.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <div class="flex h-full flex-col gap-5 overflow-auto px-[22px] pb-6">
    <!-- Sommaire de la page -->
    <div v-if="outline.length > 1">
      <div class="mb-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-[var(--studio-faint)]">
        Sommaire de la page
      </div>
      <div class="flex flex-col gap-0.5">
        <button
          v-for="(s, i) in outline"
          :key="s.id"
          type="button"
          class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors"
          :class="studio.selectedSectionId === s.id ? 'bg-[var(--studio-accent-wash)] font-semibold text-[var(--color-primary)]' : 'text-[var(--studio-muted)] hover:bg-[var(--studio-wash)]'"
          @click="studio.selectSection(s.id)"
        >
          <span class="mono shrink-0 text-[9.5px] text-[var(--studio-faint)]">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="min-w-0 flex-1 truncate">{{ s.title || SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === s.layout)?.label || 'Section' }}</span>
          <span v-if="s.anchorId" class="mono shrink-0 text-[9px] text-[var(--color-primary)]" title="Ancre (sommaire public)">#</span>
        </button>
      </div>
    </div>

    <p class="text-[12.5px] leading-[1.5] text-[var(--studio-muted)]">
      Glissez une mise en page sur le canevas pour l'insérer à un endroit précis, ou cliquez pour l'ajouter à la fin.
    </p>

    <!-- Column layouts -->
    <div>
      <div class="mb-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-[var(--studio-faint)]">
        Colonnes
      </div>
      <div class="flex flex-col gap-2.5">
        <button
          v-for="def in SECTION_LAYOUT_DEFINITIONS"
          :key="def.type"
          type="button"
          class="cursor-grab select-none rounded-[13px] border-[1.5px] border-[var(--studio-line)] p-3.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)] active:cursor-grabbing"
          draggable="true"
          :title="`Ajouter une section : ${def.label}`"
          @dragstart="onDragStart($event, def.type)"
          @click="studio.addSection(def.type)"
        >
          <div class="mb-2.5 flex h-[42px] gap-[5px]">
            <span
              v-for="(span, i) in def.gridCols"
              :key="i"
              class="rounded-[5px]"
              :style="{ flex: span, background: i === 0 ? 'var(--color-secondary)' : 'color-mix(in srgb, var(--color-secondary) 55%, white)' }"
            />
          </div>
          <div class="text-[13px] font-bold text-[var(--studio-ink)]">{{ def.label }}</div>
          <div class="mt-0.5 text-[11.5px] text-[var(--studio-faint)]">{{ def.cols }} colonne{{ def.cols > 1 ? 's' : '' }}</div>
        </button>
      </div>
    </div>

    <!-- Presets -->
    <div>
      <div class="mb-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-[var(--studio-faint)]">
        Mises en page prêtes à l'emploi
      </div>
      <div class="flex flex-col gap-2.5">
        <button
          v-for="preset in SECTION_PRESETS"
          :key="preset.key"
          type="button"
          class="rounded-[13px] border-[1.5px] border-[var(--studio-line)] p-3.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)]"
          @click="studio.addSectionPreset(preset.key)"
        >
          <div class="mb-2.5 flex h-[42px] gap-[5px]">
            <span
              v-for="(w, i) in preset.shape"
              :key="i"
              class="rounded-[5px]"
              :style="{ flex: w, background: i === 0 ? 'var(--color-secondary)' : 'color-mix(in srgb, var(--color-secondary) 55%, white)' }"
            />
          </div>
          <div class="text-[13px] font-bold text-[var(--studio-ink)]">{{ preset.label }}</div>
          <div class="mt-0.5 text-[11.5px] text-[var(--studio-faint)]">{{ preset.hint }}</div>
        </button>
      </div>
    </div>
  </div>
</template>
