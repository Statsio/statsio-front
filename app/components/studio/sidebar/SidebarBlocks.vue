<script setup lang="ts">
import { ref, computed } from 'vue'
import { BLOCK_CATEGORIES } from '@/types/studio'
import type { BlockType } from '@/types/studio'
import { useStudioStore } from '@/stores/studio'

const studio = useStudioStore()
const search = ref('')

// Blocs de formulaire → sondages ; bloc Recherche → StatsData (pages template).
const availableCategories = computed(() => {
  const type = studio.content?.type
  return BLOCK_CATEGORIES.filter((cat) => {
    if (cat.id === 'form') return type === 'survey'
    if (cat.id === 'special') return type !== 'survey' && type !== 'article'
    return true
  })
})

const filteredCategories = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return availableCategories.value
  return availableCategories.value
    .map((cat) => ({
      ...cat,
      blocks: cat.blocks.filter(
        (b) => b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q),
      ),
    }))
    .filter((cat) => cat.blocks.length > 0)
})

// Mini barres décoratives par type de bloc (rappel visuel de la maquette).
const BARS: Partial<Record<BlockType, [number, number, number]>> = {
  heading: [16, 22, 12], paragraph: [20, 20, 20], quote: [12, 22, 16], callout: [22, 14, 22],
  bar: [11, 22, 16], line: [22, 13, 18], pie: [18, 18, 18],
  table: [20, 20, 20], kpi: [10, 24, 14],
  image: [18, 22, 14], video: [14, 20, 24], button: [12, 12, 12], 'link-card': [16, 16, 22], retenir: [22, 18, 14],
  choice: [14, 14, 14], checkboxes: [16, 16, 16], dropdown: [12, 20, 12], scale: [10, 16, 22], rating: [22, 14, 22],
  search: [18, 12, 18],
}
function bars(type: BlockType): [number, number, number] {
  return BARS[type] ?? [16, 20, 12]
}

function onDragStart(event: DragEvent, type: BlockType) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('studio-block-type', type)
  event.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Search -->
    <div class="shrink-0 px-[22px] pb-3">
      <div class="flex items-center gap-[9px] rounded-full border-[1.5px] border-[var(--studio-line-strong)] px-[15px] py-2.5 focus-within:border-[var(--color-primary)]">
        <span class="h-3 w-3 shrink-0 rounded-full border-[1.6px] border-[color:color-mix(in_srgb,var(--studio-ink)_35%,transparent)]" />
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher un bloc…"
          class="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:outline-none"
        />
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-auto px-[22px] pb-6">
      <div v-for="category in filteredCategories" :key="category.id" class="mb-5">
        <div class="mb-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-[var(--studio-faint)]">
          {{ category.label }}
        </div>
        <div class="grid grid-cols-2 gap-[9px]">
          <button
            v-for="block in category.blocks"
            :key="block.type"
            type="button"
            class="flex cursor-grab select-none flex-col items-center gap-[9px] rounded-[13px] border-[1.5px] border-[var(--studio-line)] bg-white px-2 py-[15px] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)] active:cursor-grabbing"
            draggable="true"
            :data-block-type="block.type"
            :title="block.description"
            @dragstart="onDragStart($event, block.type)"
            @click="studio.addBlockSmart(block.type)"
          >
            <span class="flex h-[22px] items-end justify-center gap-[3px]">
              <span
                v-for="(h, i) in bars(block.type)"
                :key="i"
                class="w-[5px] rounded-[2px]"
                :style="{
                  height: h + 'px',
                  background: 'var(--color-primary)',
                  opacity: [1, 0.6, 0.35][i],
                }"
              />
            </span>
            <span class="text-center text-[12px] font-bold leading-[1.25] text-[var(--studio-ink)]">{{ block.label }}</span>
          </button>
        </div>
      </div>

      <p v-if="filteredCategories.length === 0" class="py-4 text-[13px] text-[var(--studio-faint)]">
        Aucun bloc ne correspond à «&nbsp;{{ search }}&nbsp;».
      </p>
    </div>
  </div>
</template>
