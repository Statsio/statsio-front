<script setup lang="ts">
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'
import { useStudioStore } from '@/stores/studio'
import type { CanvasItemRef } from '@/types/studio'
import CanvasSection from './CanvasSection.vue'
import BlockWrapper from './BlockWrapper.vue'

const studio = useStudioStore()

const items = computed(() => studio.currentPageCanvasItems)
const isStatsdata = computed(() => studio.content?.type === 'statsdata')

const isDropTargetActive = ref(false)
const dropInsertIndex = ref<number | null>(null)

/** Bandes de drop entre éléments : accepte une mise en page de section ou un bloc « Boucle »/« Condition » de page. */
function acceptsDrag(event: DragEvent): boolean {
  const types = event.dataTransfer?.types
  return !!types && (types.includes('studio-section-layout') || types.includes('studio-page-block-type'))
}
function onGapDragEnter(event: DragEvent, index: number) {
  if (!acceptsDrag(event)) return
  isDropTargetActive.value = true
  dropInsertIndex.value = index
}
function onGapDragLeave() {
  isDropTargetActive.value = false
  dropInsertIndex.value = null
}
function onGapDragOver(event: DragEvent) {
  if (acceptsDrag(event)) {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }
}
function onGapDrop(event: DragEvent, atIndex: number) {
  event.preventDefault()
  isDropTargetActive.value = false
  dropInsertIndex.value = null
  const layout = event.dataTransfer?.getData('studio-section-layout')
  const pageBlock = event.dataTransfer?.getData('studio-page-block-type') as 'loop' | 'if' | ''
  if (layout) studio.addSectionInFlow(atIndex)
  else if (pageBlock && isStatsdata.value) studio.addPageBlock(pageBlock, atIndex)
}

interface FlowItem { ref?: CanvasItemRef; section?: { id: string }; block?: unknown; id?: string; layout?: string }

/** Un élément du flux OU une section brute entrée depuis une zone de script. */
function itemSectionId(el: FlowItem): string | undefined {
  if (el.section) return el.section.id
  if (el.ref?.kind === 'section') return el.ref.id
  if (!el.ref && el.id && el.layout) return el.id
  return undefined
}

function onFlowChange(evt: {
  moved?: { oldIndex: number; newIndex: number }
  added?: { element: FlowItem; newIndex: number }
}) {
  if (evt.moved) {
    const next = [...items.value]
    const [m] = next.splice(evt.moved.oldIndex, 1)
    next.splice(evt.moved.newIndex, 0, m!)
    studio.reorderPageCanvas(next.map((i) => i.ref))
  } else if (evt.added) {
    const sid = itemSectionId(evt.added.element)
    if (sid) studio.moveSectionToFlow(sid, evt.added.newIndex)
  }
}


function onCanvasClick(event: MouseEvent) {
  if (event.target === event.currentTarget) studio.selectBlock(null)
}
</script>

<template>
  <div class="mx-auto flex min-h-full w-full max-w-[1000px] flex-col px-10 pb-[120px] pt-8">
    <div class="flex flex-1 flex-col gap-4" @click="onCanvasClick">
      <!-- Zone de dépôt avant le premier élément -->
      <div
        v-if="!studio.isPreview"
        class="rounded-full transition-all"
        :class="dropInsertIndex === 0 && isDropTargetActive
          ? 'flex h-10 items-center justify-center border-2 border-dashed border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
          : 'h-1.5'"
        @dragenter="onGapDragEnter($event, 0)"
        @dragleave="onGapDragLeave"
        @dragover="onGapDragOver"
        @drop="onGapDrop($event, 0)"
      >
        <span v-if="dropInsertIndex === 0 && isDropTargetActive" class="pointer-events-none text-xs font-semibold text-[var(--color-primary)]">
          Déposer ici
        </span>
      </div>

      <!-- Flux de la page : sections racine + blocs loop/if de page, entrelacés -->
      <draggable
        :key="studio.currentPageId"
        :model-value="items"
        :disabled="studio.isPreview"
        :item-key="(i: { ref: CanvasItemRef }) => i.ref.kind + ':' + i.ref.id"
        :group="{ name: 'canvas-flow', pull: true, put: ['canvas-flow', 'canvas-flow-zone'] }"
        handle=".section-drag-handle"
        class="flex flex-col gap-4"
        ghost-class="opacity-30"
        animation="150"
        @change="onFlowChange"
      >
        <template #item="{ element: item, index }">
          <div>
            <CanvasSection v-if="item.section" :section="item.section" />
            <div v-else-if="item.block" class="group/pageblk relative pt-9">
              <div
                v-if="!studio.isPreview"
                class="section-drag-handle absolute left-0 top-0 z-30 flex h-8 cursor-grab items-center gap-1 rounded-lg border border-violet-200 bg-white px-2 py-1 opacity-0 shadow-[var(--studio-shadow-card)] transition-opacity hover:bg-violet-50 active:cursor-grabbing group-hover/pageblk:opacity-100"
                title="Réordonner ce bloc"
              >
                <svg class="h-3.5 w-3.5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                </svg>
                <span class="text-[10px] font-medium text-violet-500">{{ item.block.type === 'loop' ? 'Boucle' : 'Condition' }} (page)</span>
              </div>
              <BlockWrapper :block="item.block" />
            </div>

            <!-- Bande de dépôt après cet élément -->
            <div
              v-if="!studio.isPreview"
              class="mt-3.5 rounded-full transition-all"
              :class="dropInsertIndex === index + 1 && isDropTargetActive
                ? 'flex h-10 items-center justify-center border-2 border-dashed border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
                : 'h-1.5'"
              @dragenter="onGapDragEnter($event, index + 1)"
              @dragleave="onGapDragLeave"
              @dragover="onGapDragOver"
              @drop="onGapDrop($event, index + 1)"
            >
              <span v-if="dropInsertIndex === index + 1 && isDropTargetActive" class="pointer-events-none text-xs font-semibold text-[var(--color-primary)]">
                Déposer ici
              </span>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Empty state -->
      <div
        v-if="items.length === 0 && !studio.isPreview"
        class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--studio-line-strong)] bg-white/50 py-24 text-center"
      >
        <p class="text-sm font-medium text-[var(--studio-muted)]">Ajoutez une première section</p>
      </div>

      <!-- Ajouter une section -->
      <button
        v-if="!studio.isPreview"
        type="button"
        class="mt-1 rounded-2xl border-2 border-dashed border-[var(--studio-line-strong)] py-[26px] text-center text-[14.5px] font-semibold text-[var(--studio-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        @click="studio.addSection()"
      >
        + Ajouter une section
      </button>
    </div>
  </div>
</template>
