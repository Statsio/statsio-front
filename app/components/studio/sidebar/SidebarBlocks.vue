<script setup lang="ts">
import { ref, computed } from 'vue'
import { BLOCK_CATEGORIES, BLOCK_META } from '@/types/studio'
import type { BlockType } from '@/types/studio'
import { useStudioStore } from '@/stores/studio'

const studio = useStudioStore()
const search = ref('')

// Blocs de formulaire → sondages ; bloc Recherche → StatsData (pages template).
const availableCategories = computed(() => {
  const type = studio.content?.type
  return BLOCK_CATEGORIES.filter((cat) => {
    if (cat.id === 'script') return false // onglet dédié « Script »
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
            <span class="flex h-9 w-9 items-center justify-center rounded-[10px]" :class="BLOCK_META[block.type].tint">
              <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
                <path stroke-linecap="round" stroke-linejoin="round" :d="BLOCK_META[block.type].iconPath" />
              </svg>
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
