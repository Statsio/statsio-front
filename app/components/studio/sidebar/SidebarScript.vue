<script setup lang="ts">
import { computed } from 'vue'
import { BLOCK_CATEGORIES, BLOCK_META } from '@/types/studio'
import type { BlockType } from '@/types/studio'
import { useStudioStore } from '@/stores/studio'

const studio = useStudioStore()

const scriptBlocks = computed(
  () => BLOCK_CATEGORIES.find((c) => c.id === 'script')?.blocks ?? [],
)

function onDragStart(event: DragEvent, type: BlockType) {
  if (!event.dataTransfer) return
  // Déposé dans une zone de bloc → boucle/condition de blocs (comportement historique).
  event.dataTransfer.setData('studio-block-type', type)
  // Déposé entre deux sections (niveau page) → bloc qui répète/conditionne des sections entières.
  if (type === 'loop' || type === 'if') event.dataTransfer.setData('studio-page-block-type', type)
  event.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="shrink-0 px-[22px] pb-3">
      <p class="text-[12px] leading-[1.5] text-[var(--studio-muted)]">
        Blocs de logique : ils répètent ou conditionnent d'autres blocs placés à l'intérieur.
        Déposés entre deux sections, ils répètent ou conditionnent des sections entières.
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-auto px-[22px] pb-6">
      <div class="grid grid-cols-2 gap-[9px]">
        <button
          v-for="block in scriptBlocks"
          :key="block.type"
          type="button"
          class="flex cursor-grab select-none flex-col items-center gap-[9px] rounded-[13px] border-[1.5px] border-[var(--studio-line)] bg-white px-2 py-[15px] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)] active:cursor-grabbing"
          draggable="true"
          :data-block-type="block.type"
          :title="block.description"
          @dragstart="onDragStart($event, block.type)"
          @click="studio.addBlockSmart(block.type)"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-[10px]" :class="BLOCK_META[block.type].tint">
            <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
              <path stroke-linecap="round" stroke-linejoin="round" :d="BLOCK_META[block.type].iconPath" />
            </svg>
          </span>
          <span class="text-center text-[12px] font-bold leading-[1.25] text-[var(--studio-ink)]">{{ block.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
