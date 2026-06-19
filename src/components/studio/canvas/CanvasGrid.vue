<script setup lang="ts">
import { ref } from 'vue'
import draggable from 'vuedraggable'
import { useStudioStore } from '@/stores/studio'
import { type SectionLayout, type Section } from '@/types/studio'
import CanvasSection from './CanvasSection.vue'

const studio = useStudioStore()

// ─── Section drag & drop to reorder ─────────────────────────────────────────

const sectionList = {
  get: () => studio.sections,
  set: (newOrder: Section[]) => studio.reorderSections(newOrder),
}

// ─── Drop zone for adding sections from sidebar ───────────────────────────────

const isDropTargetActive = ref(false)
let dropInsertIndex = ref<number | null>(null)

function onSectionDragEnter(event: DragEvent, index?: number) {
  if (!event.dataTransfer?.types.includes('studio-section-layout')) return
  isDropTargetActive.value = true
  dropInsertIndex.value = index ?? studio.sections.length
}

function onSectionDragLeave() {
  isDropTargetActive.value = false
  dropInsertIndex.value = null
}

function onSectionDragOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes('studio-section-layout')) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }
}

function onSectionDrop(event: DragEvent, atIndex?: number) {
  event.preventDefault()
  isDropTargetActive.value = false
  dropInsertIndex.value = null
  const layout = event.dataTransfer?.getData('studio-section-layout') as SectionLayout
  if (layout) {
    studio.addSection(layout, atIndex)
  }
}

function onCanvasClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    studio.selectBlock(null)
  }
}
</script>

<template>
  <div
    class="min-h-full w-full max-w-5xl mx-auto flex flex-col gap-2"
    @click="onCanvasClick"
  >
    <!-- Section drop zone (before first section) -->
    <div
      class="h-1.5 rounded-full transition-all"
      :class="dropInsertIndex === 0 && isDropTargetActive
        ? 'h-10 bg-[var(--color-primary)]/20 border-2 border-dashed border-[var(--color-primary)] flex items-center justify-center'
        : 'hover:h-3 hover:bg-slate-200/50'"
      @dragenter="onSectionDragEnter($event, 0)"
      @dragleave="onSectionDragLeave"
      @dragover="onSectionDragOver"
      @drop="onSectionDrop($event, 0)"
    >
      <span v-if="dropInsertIndex === 0 && isDropTargetActive" class="text-xs text-[var(--color-primary)] font-semibold pointer-events-none">
        Déposer la section ici
      </span>
    </div>

    <!-- Sections (reorderable) -->
    <draggable
      :model-value="studio.sections"
      @update:model-value="studio.reorderSections"
      item-key="id"
      handle=".section-drag-handle"
      class="flex flex-col gap-2"
      ghost-class="opacity-30"
      animation="150"
    >
      <template #item="{ element: section, index }">
        <div>
          <CanvasSection :section="section" />

          <!-- Drop zone after each section -->
          <div
            class="h-1.5 mt-2 rounded-full transition-all"
            :class="dropInsertIndex === index + 1 && isDropTargetActive
              ? 'h-10 bg-[var(--color-primary)]/20 border-2 border-dashed border-[var(--color-primary)] flex items-center justify-center'
              : 'hover:h-3 hover:bg-slate-200/50'"
            @dragenter="onSectionDragEnter($event, index + 1)"
            @dragleave="onSectionDragLeave"
            @dragover="onSectionDragOver"
            @drop="onSectionDrop($event, index + 1)"
          >
            <span v-if="dropInsertIndex === index + 1 && isDropTargetActive" class="text-xs text-[var(--color-primary)] font-semibold pointer-events-none">
              Déposer la section ici
            </span>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Empty state / add first section -->
    <div
      v-if="studio.sections.length === 0"
      class="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white/50"
      @dragenter="onSectionDragEnter($event)"
      @dragleave="onSectionDragLeave"
      @dragover="onSectionDragOver"
      @drop="onSectionDrop($event)"
    >
      <div class="text-slate-400 text-center">
        <svg class="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <p class="text-sm font-medium">Glissez une section depuis le panel de gauche</p>
        <p class="text-xs mt-1">ou cliquez sur un template dans "Sections"</p>
      </div>
    </div>

    <!-- Bottom drop zone when sections exist -->
    <div
      v-else
      class="min-h-[80px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed mt-2 transition-all"
      :class="isDropTargetActive && dropInsertIndex === null
        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
        : 'border-slate-200 hover:border-slate-300'"
      @dragenter="onSectionDragEnter($event)"
      @dragleave="onSectionDragLeave"
      @dragover="onSectionDragOver"
      @drop="onSectionDrop($event)"
    >
      <span class="text-xs text-slate-400 flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Ajouter une section
      </span>
    </div>
  </div>
</template>
