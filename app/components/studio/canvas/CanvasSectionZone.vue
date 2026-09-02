<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { Section } from '@/types/studio'
import CanvasSection from './CanvasSection.vue'

/**
 * Pendant de `CanvasZone.vue` mais pour des SECTIONS : rend la liste des sections
 * nichées dans la zone d'un bloc `loop`/`if` de page (`scriptZoneId(blockId, branch)`).
 * Réutilise `CanvasSection.vue` pour chaque élément.
 */
const draggable = defineAsyncComponent(() => import('vuedraggable'))

const props = defineProps<{ zoneId: string }>()
const studio = useStudioStore()

const editable = computed(() => import.meta.client && !studio.isPreview)
const sections = computed<Section[]>(() => studio.sectionsInZone(props.zoneId))
const isDragOver = ref(false)

interface DragItem { ref?: { kind: string; id: string }; section?: { id: string }; block?: unknown; id?: string; layout?: string }

function itemSectionId(el: DragItem): string | undefined {
  if (el.section) return el.section.id
  if (el.ref?.kind === 'section') return el.ref.id
  if (!el.ref && el.id && el.layout) return el.id
  return undefined
}
/** Un bloc de page (loop/if) ne peut pas entrer dans une zone de section. */
function onMove(evt: { draggedContext: { element: DragItem } }) {
  return !evt.draggedContext.element.block
}
function onChange(evt: {
  moved?: { oldIndex: number; newIndex: number }
  added?: { element: DragItem; newIndex: number }
}) {
  if (evt.moved) {
    const list = [...sections.value]
    const [m] = list.splice(evt.moved.oldIndex, 1)
    list.splice(evt.moved.newIndex, 0, m!)
    studio.reorderSectionZone(props.zoneId, list)
  } else if (evt.added) {
    const sid = itemSectionId(evt.added.element)
    if (sid) studio.moveSectionToZone(sid, props.zoneId, evt.added.newIndex)
  }
}
function onDragOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes('studio-section-layout')) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    isDragOver.value = true
  }
}
function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  if (event.dataTransfer?.types.includes('studio-section-layout')) {
    studio.addSection(undefined, undefined, props.zoneId)
  }
}
function addSection() {
  studio.addSection(undefined, undefined, props.zoneId)
}
</script>

<template>
  <div
    data-canvas-zone
    class="rounded-xl transition-colors"
    :class="isDragOver ? 'ring-2 ring-[var(--color-primary)]' : ''"
    @dragover="onDragOver"
    @dragleave="isDragOver = false"
    @drop="onDrop"
  >
    <component
      :is="draggable"
      v-if="editable"
      :model-value="sections"
      :group="{ name: 'canvas-flow-zone', pull: true, put: ['canvas-flow', 'canvas-flow-zone'] }"
      :move="onMove"
      item-key="id"
      handle=".section-drag-handle"
      class="flex min-h-[24px] flex-col gap-4"
      ghost-class="opacity-30"
      animation="150"
      @change="onChange"
    >
      <template #item="{ element }">
        <CanvasSection :section="element" />
      </template>
    </component>

    <div v-else class="flex flex-col gap-4">
      <CanvasSection v-for="s in sections" :key="s.id" :section="s" />
    </div>

    <div
      v-if="sections.length === 0 && !studio.isPreview"
      class="mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200 bg-white/60 py-8 text-center"
    >
      <p class="text-[12px] font-medium text-violet-500">Glissez une section ici, ou :</p>
    </div>

    <button
      v-if="!studio.isPreview"
      type="button"
      class="mt-3 w-full rounded-xl border-2 border-dashed border-violet-200 py-2 text-center text-[12px] font-semibold text-violet-500 transition-colors hover:border-violet-400 hover:bg-violet-50"
      @click="addSection"
    >
      + Ajouter une section
    </button>
  </div>
</template>
