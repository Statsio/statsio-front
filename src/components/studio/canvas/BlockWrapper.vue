<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock } from '@/types/studio'
import BlockRenderer from '../blocks/BlockRenderer.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

const isSelected = computed(() => studio.selectedBlockId === props.block.id)

const blockLabel: Record<string, string> = {
  bar: 'Barres', line: 'Lignes', table: 'Tableau', kpi: 'KPI', pie: 'Camembert',
}
</script>

<template>
  <div
    class="relative group bg-white rounded-xl border-2 flex flex-col overflow-hidden transition-all duration-150 min-h-[180px] cursor-pointer"
    :class="isSelected
      ? 'border-[var(--color-primary)] shadow-lg shadow-purple-100'
      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'"
    @click.stop="studio.selectBlock(block.id)"
  >
    <!-- Block header bar (visible on hover / selection) -->
    <div
      class="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 shrink-0 transition-opacity"
      :class="isSelected ? 'bg-purple-50/60 opacity-100' : 'opacity-0 group-hover:opacity-100'"
    >
      <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {{ block.config.title || blockLabel[block.type] || block.type }}
      </span>

      <div class="flex items-center gap-1">
        <!-- Edit: open right panel -->
        <button
          class="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Configurer"
          @click.stop="studio.selectBlock(block.id)"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>

        <!-- Delete -->
        <button
          class="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          title="Supprimer"
          @click.stop="studio.removeBlock(block.id)"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Block content -->
    <div class="flex-1 min-h-0 p-3">
      <BlockRenderer :block="block" />
    </div>
  </div>
</template>
