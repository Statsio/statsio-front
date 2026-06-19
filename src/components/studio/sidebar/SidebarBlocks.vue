<script setup lang="ts">
import { ref, computed } from 'vue'
import { BLOCK_CATEGORIES } from '@/types/studio'
import type { BlockType } from '@/types/studio'

const search = ref('')
const collapsedCategories = ref<Set<string>>(new Set())

const filteredCategories = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return BLOCK_CATEGORIES

  return BLOCK_CATEGORIES.map((cat) => ({
    ...cat,
    blocks: cat.blocks.filter(
      (b) => b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q),
    ),
  })).filter((cat) => cat.blocks.length > 0)
})

function toggleCategory(id: string) {
  if (collapsedCategories.value.has(id)) {
    collapsedCategories.value.delete(id)
  } else {
    collapsedCategories.value.add(id)
  }
}

function onDragStart(event: DragEvent, type: BlockType) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('studio-block-type', type)
  event.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <div class="flex flex-col">
    <!-- Search bar -->
    <div class="px-3 pt-3 pb-2 sticky top-0 bg-white z-10 border-b border-slate-100">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher un bloc…"
          class="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
        />
      </div>
    </div>

    <!-- Categories -->
    <div class="px-3 py-2 flex flex-col gap-1">
      <div v-if="filteredCategories.length === 0" class="py-8 text-center text-sm text-slate-400">
        Aucun bloc pour "{{ search }}"
      </div>

      <div v-for="category in filteredCategories" :key="category.id">
        <!-- Category header -->
        <button
          class="w-full flex items-center justify-between px-1 py-2 text-left"
          @click="toggleCategory(category.id)"
        >
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {{ category.label }}
          </span>
          <svg
            class="w-3.5 h-3.5 text-slate-400 transition-transform"
            :class="collapsedCategories.has(category.id) ? '-rotate-90' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
          </svg>
        </button>

        <!-- Block items (2-col grid) -->
        <div
          v-if="!collapsedCategories.has(category.id)"
          class="grid grid-cols-2 gap-1.5 pb-2"
        >
          <div
            v-for="block in category.blocks"
            :key="block.type"
            class="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 cursor-grab active:cursor-grabbing hover:border-[var(--color-primary)] hover:bg-purple-50/40 hover:shadow-sm transition-all select-none"
            draggable="true"
            :data-block-type="block.type"
            :title="block.description"
            @dragstart="onDragStart($event, block.type)"
          >
            <span class="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-[var(--color-primary)] group-hover:bg-purple-100 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" :d="block.iconPath" />
              </svg>
            </span>
            <span class="text-xs font-semibold text-slate-700 text-center leading-tight">{{ block.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
