<script setup lang="ts">
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'
import { useStudioStore } from '@/stores/studio'
import { type SectionLayout } from '@/types/studio'
import CanvasSection from './CanvasSection.vue'

const studio = useStudioStore()

const activeParams = computed(() => Object.entries(studio.pageParams))

const isDropTargetActive = ref(false)
const dropInsertIndex = ref<number | null>(null)

function onSectionDragEnter(event: DragEvent, index?: number) {
  if (!event.dataTransfer?.types.includes('studio-section-layout')) return
  isDropTargetActive.value = true
  dropInsertIndex.value = index ?? studio.currentPageSections.length
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
  if (layout) studio.addSection(layout, atIndex)
}

function onCanvasClick(event: MouseEvent) {
  if (event.target === event.currentTarget) studio.selectBlock(null)
}
</script>

<template>
  <div class="mx-auto flex min-h-full w-full max-w-[1000px] flex-col px-10 pb-[120px] pt-8">
    <!-- Active params banner -->
    <div
      v-if="activeParams.length > 0"
      class="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2"
    >
      <span class="text-[11px] font-medium text-amber-700">Filtres actifs :</span>
      <span
        v-for="[key, value] in activeParams"
        :key="key"
        class="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-100 px-2 py-0.5 font-mono text-[11px] text-amber-800"
      >
        <span class="text-amber-500">{{ '{' + '{' + key + '}' + '}' }}</span>
        <span class="mx-0.5 text-amber-400">=</span>
        <span class="font-semibold">{{ value }}</span>
      </span>
      <button
        v-if="!studio.isPreview"
        type="button"
        class="ml-auto text-[10px] text-amber-500 underline underline-offset-2 hover:text-amber-700"
        @click="studio.clearPageParams()"
      >
        Réinitialiser
      </button>
    </div>

    <div class="flex flex-1 flex-col gap-3.5" @click="onCanvasClick">
      <!-- Drop zone before first section -->
      <div
        v-if="!studio.isPreview"
        class="rounded-full transition-all"
        :class="dropInsertIndex === 0 && isDropTargetActive
          ? 'flex h-10 items-center justify-center border-2 border-dashed border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
          : 'h-1.5'"
        @dragenter="onSectionDragEnter($event, 0)"
        @dragleave="onSectionDragLeave"
        @dragover="onSectionDragOver"
        @drop="onSectionDrop($event, 0)"
      >
        <span v-if="dropInsertIndex === 0 && isDropTargetActive" class="pointer-events-none text-xs font-semibold text-[var(--color-primary)]">
          Déposer la section ici
        </span>
      </div>

      <!-- Sections -->
      <draggable
        :key="studio.currentPageId"
        :model-value="studio.currentPageSections"
        :disabled="studio.isPreview"
        item-key="id"
        handle=".section-drag-handle"
        class="flex flex-col gap-3.5"
        ghost-class="opacity-30"
        animation="150"
        @update:model-value="studio.reorderCurrentPageSections"
      >
        <template #item="{ element: section, index }">
          <div>
            <CanvasSection :section="section" />
            <div
              v-if="!studio.isPreview"
              class="mt-3.5 rounded-full transition-all"
              :class="dropInsertIndex === index + 1 && isDropTargetActive
                ? 'flex h-10 items-center justify-center border-2 border-dashed border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
                : 'h-1.5'"
              @dragenter="onSectionDragEnter($event, index + 1)"
              @dragleave="onSectionDragLeave"
              @dragover="onSectionDragOver"
              @drop="onSectionDrop($event, index + 1)"
            >
              <span v-if="dropInsertIndex === index + 1 && isDropTargetActive" class="pointer-events-none text-xs font-semibold text-[var(--color-primary)]">
                Déposer la section ici
              </span>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Empty state -->
      <div
        v-if="studio.currentPageSections.length === 0 && !studio.isPreview"
        class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--studio-line-strong)] bg-white/50 py-24 text-center"
        @dragenter="onSectionDragEnter($event)"
        @dragleave="onSectionDragLeave"
        @dragover="onSectionDragOver"
        @drop="onSectionDrop($event)"
      >
        <p class="text-sm font-medium text-[var(--studio-muted)]">Glissez une mise en page depuis le panneau « Sections »</p>
        <p class="mt-1 text-xs text-[var(--studio-faint)]">ou cliquez sur une mise en page pour l'ajouter</p>
      </div>

      <!-- Add section -->
      <button
        v-else-if="!studio.isPreview"
        type="button"
        class="mt-1 rounded-2xl border-2 border-dashed border-[var(--studio-line-strong)] py-[26px] text-center text-[14.5px] font-semibold text-[var(--studio-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        :class="isDropTargetActive && dropInsertIndex === null ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]' : ''"
        @click="studio.setLeftTab('layouts')"
        @dragenter="onSectionDragEnter($event)"
        @dragleave="onSectionDragLeave"
        @dragover="onSectionDragOver"
        @drop="onSectionDrop($event)"
      >
        + Ajouter une section
      </button>
    </div>
  </div>
</template>
