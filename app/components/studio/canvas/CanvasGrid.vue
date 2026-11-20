<script setup lang="ts">
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'
import { useStudioStore } from '@/stores/studio'
import type { CanvasItemRef } from '@/types/studio'
import CanvasSection from './CanvasSection.vue'
import BlockWrapper from './BlockWrapper.vue'
import CanvasDocHeader from './CanvasDocHeader.vue'
import StudioIcon from '../ui/StudioIcon.vue'

const studio = useStudioStore()

const items = computed(() => studio.currentPageCanvasItems)

const isDropTargetActive = ref(false)
const dropInsertIndex = ref<number | null>(null)

/** Bandes de drop entre éléments : accepte une mise en page de section ou un bloc « Boucle »/« Condition » de page. */
function acceptsDrag(event: DragEvent): boolean {
  const types = event.dataTransfer?.types
  if (!types) return false
  return types.includes('studio-section-layout') || (studio.supportsPages && types.includes('studio-page-block-type'))
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
  else if (pageBlock && studio.supportsPages) studio.addPageBlock(pageBlock, atIndex)
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
  if (event.target === event.currentTarget) selectDocument()
}

/** Rien de sélectionné = inspecteur « Propriétés » du document. */
function selectDocument() {
  studio.selectBlock(null)
  studio.selectSection(null)
}
const documentSelected = computed(() => !studio.selectedBlockId && !studio.selectedSectionId)
const addSectionLabel = computed(() => (studio.content?.type === 'survey' ? 'Ajouter une étape' : 'Ajouter une section'))
</script>

<template>
  <div class="st-paper-wrap" @click.self="selectDocument">
   <article
    class="st-paper sd-public ds-scope"
    :class="{ 'st-paper--mobile': studio.previewDevice === 'mobile' }"
    aria-label="Canevas"
   >
    <CanvasDocHeader :selected="documentSelected" @select="selectDocument" />
    <div class="flex flex-1 flex-col gap-4" @click="onCanvasClick">
      <!-- Zone de dépôt avant le premier élément -->
      <div
        v-if="!studio.isPreview"
        class="rounded-full transition-all"
        :class="dropInsertIndex === 0 && isDropTargetActive
          ? 'flex h-10 items-center justify-center rounded-[3px] border-2 border-dashed border-[var(--ds-blue-500)] bg-[color-mix(in_srgb,var(--ds-blue-500)_8%,transparent)]'
          : 'h-1.5'"
        @dragenter="onGapDragEnter($event, 0)"
        @dragleave="onGapDragLeave"
        @dragover="onGapDragOver"
        @drop="onGapDrop($event, 0)"
      >
        <span v-if="dropInsertIndex === 0 && isDropTargetActive" class="pointer-events-none text-xs font-semibold text-[var(--ds-blue-700)]">
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
                class="section-drag-handle absolute left-0 top-0 z-30 flex h-7 cursor-grab items-center gap-1.5 rounded-[3px] border-2 border-[var(--ds-ol)] bg-[var(--ds-surface)] px-2 opacity-0 shadow-[2px_2px_0_var(--ds-sh)] transition-opacity active:cursor-grabbing group-hover/pageblk:opacity-100"
                title="Réordonner ce bloc"
              >
                <StudioIcon name="grip" :size="13" class="text-[var(--ds-muted)]" />
                <span class="st-lbl !text-[10px] !text-[var(--ds-accent)]">{{ item.block.type === 'loop' ? 'Boucle' : 'Condition' }} (page)</span>
              </div>
              <BlockWrapper :block="item.block" />
            </div>

            <!-- Bande de dépôt après cet élément -->
            <div
              v-if="!studio.isPreview"
              class="mt-3.5 rounded-full transition-all"
              :class="dropInsertIndex === index + 1 && isDropTargetActive
                ? 'flex h-10 items-center justify-center rounded-[3px] border-2 border-dashed border-[var(--ds-blue-500)] bg-[color-mix(in_srgb,var(--ds-blue-500)_8%,transparent)]'
                : 'h-1.5'"
              @dragenter="onGapDragEnter($event, index + 1)"
              @dragleave="onGapDragLeave"
              @dragover="onGapDragOver"
              @drop="onGapDrop($event, index + 1)"
            >
              <span v-if="dropInsertIndex === index + 1 && isDropTargetActive" class="pointer-events-none text-xs font-semibold text-[var(--ds-blue-700)]">
                Déposer ici
              </span>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Empty state -->
      <div
        v-if="items.length === 0 && !studio.isPreview"
        class="flex min-h-[96px] items-center justify-center rounded-[4px] border-2 border-dashed border-[var(--ds-divide)] text-[13.5px] text-[var(--ds-muted)]"
      >
        Ajoutez une première section.
      </div>

      <!-- Ajouter une section / étape -->
      <div v-if="!studio.isPreview" class="flex justify-center pt-2">
        <button type="button" class="st-add-ghost" @click="studio.addSection()">
          <StudioIcon name="plus" :size="14" />{{ addSectionLabel }}
        </button>
      </div>
    </div>
   </article>
  </div>
</template>
