<script setup lang="ts">
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'
import { useStudioStore } from '@/stores/studio'
import type { BlockType, StudioBlock } from '@/types/studio'
import BlockWrapper from './BlockWrapper.vue'

const props = defineProps<{
  zoneId: string
  colIndex: number
}>()

const studio = useStudioStore()

// vuedraggable v-model: handles reorder within zone AND cross-zone moves
const zoneBlocks = computed<StudioBlock[]>({
  get: () => studio.blocksByZone[props.zoneId] ?? [],
  set: (newBlocks: StudioBlock[]) => {
    studio.setZoneBlocks(props.zoneId, newBlocks.map((b) => b.id))
  },
})

const isEmpty = computed(() => zoneBlocks.value.length === 0)

const dragGroup = {
  name: 'canvas-blocks',
  put: true,
  pull: true,
}

// ─── Drop position tracking (sidebar → canvas) ────────────────────────────────

const isDragOver  = ref(false)
const dropIndex   = ref(-1) // -1 = append at end
const draggableEl = ref<{ $el: HTMLElement } | null>(null)

function getDropIndex(event: DragEvent): number {
  const el = draggableEl.value?.$el
  if (!el) return zoneBlocks.value.length

  // Block items are marked with data-block-index to survive indicator divs in the DOM
  const blockEls = Array.from(el.querySelectorAll('[data-block-index]')) as HTMLElement[]
  const mouseY   = event.clientY

  for (const blockEl of blockEls) {
    const idx  = parseInt(blockEl.dataset.blockIndex!, 10)
    const rect = blockEl.getBoundingClientRect()
    if (mouseY < rect.top + rect.height / 2) return idx
  }
  return zoneBlocks.value.length
}

function onDragOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes('studio-block-type')) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    isDragOver.value = true
    dropIndex.value  = getDropIndex(event)
  }
}

function onDragEnter(event: DragEvent) {
  if (event.dataTransfer?.types.includes('studio-block-type')) {
    isDragOver.value = true
  }
}

function onDragLeave(event: DragEvent) {
  if (!event.currentTarget || !(event.currentTarget as Element).contains(event.relatedTarget as Node)) {
    isDragOver.value = false
    dropIndex.value  = -1
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const idx = dropIndex.value
  isDragOver.value = false
  dropIndex.value  = -1
  const blockType = event.dataTransfer?.getData('studio-block-type') as BlockType
  if (blockType) {
    studio.addBlock(blockType, props.zoneId, idx >= 0 ? idx : undefined)
  }
}
</script>

<template>
  <div
    class="relative flex min-h-[120px] min-w-0 flex-col overflow-hidden rounded-2xl transition-all"
    :class="[
      isEmpty && !studio.isPreview
        ? 'border-2 border-dashed border-[var(--studio-line-strong)] bg-[var(--studio-wash)]/60'
        : 'bg-transparent',
      isDragOver
        ? 'border-2 border-dashed border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
        : '',
    ]"
    @dragover="onDragOver"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Empty placeholder -->
    <div
      v-if="isEmpty && !isDragOver && !studio.isPreview"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
    >
      <svg class="mb-1.5 h-6 w-6 text-[var(--studio-line-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      <p class="text-[11px] font-medium text-[var(--studio-faint)]">Glisser un bloc ici</p>
    </div>

    <!-- Drag over highlight text (empty zone) -->
    <div
      v-if="isDragOver && isEmpty"
      class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <span class="text-xs font-semibold text-[var(--color-primary)]">Déposer ici</span>
    </div>

    <!-- vuedraggable: handles reorder + cross-zone moves -->
    <draggable
      ref="draggableEl"
      v-model="zoneBlocks"
      :group="dragGroup"
      :disabled="studio.isPreview"
      item-key="id"
      class="flex min-h-[100px] min-w-0 flex-1 flex-col gap-3.5 p-1"
      ghost-class="opacity-30 ring-2 ring-[var(--color-primary)]/30 rounded-xl"
      animation="150"
    >
      <template #item="{ element, index }">
        <div :data-block-index="index" class="flex flex-col">
          <!-- Insertion indicator: above this block -->
          <div
            v-if="isDragOver && dropIndex === index"
            class="relative h-0.5 rounded-full bg-[var(--color-primary)] mx-1 mb-2 shrink-0"
          >
            <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
          </div>
          <BlockWrapper :block="element" />
        </div>
      </template>

      <!-- Insertion indicator: after all blocks (append) -->
      <template #footer>
        <div
          v-if="isDragOver && dropIndex >= zoneBlocks.length"
          class="relative h-0.5 rounded-full bg-[var(--color-primary)] mx-1 mt-2 shrink-0"
        >
          <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
        </div>
      </template>
    </draggable>
  </div>
</template>
