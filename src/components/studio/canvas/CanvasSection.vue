<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { SECTION_LAYOUT_DEFINITIONS } from '@/types/studio'
import type { Section, SectionLayout } from '@/types/studio'
import CanvasZone from './CanvasZone.vue'

const props = defineProps<{ section: Section }>()
const studio = useStudioStore()

const showLayoutMenu = ref(false)

const def = computed(() =>
  SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === props.section.layout)!
)

const zoneIds = computed(() =>
  Array.from({ length: def.value.cols }, (_, i) => `${props.section.id}-${i}`)
)

function changeLayout(layout: SectionLayout) {
  studio.changeSectionLayout(props.section.id, layout)
  showLayoutMenu.value = false
}

const layoutIcons: Record<SectionLayout, string> = {
  '1-col':    '████████████',
  '2-cols':   '██████ ██████',
  '3-cols':   '████ ████ ████',
  '2-1-cols': '████████ ████',
  '1-2-cols': '████ ████████',
}
</script>

<template>
  <div class="group/section relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-visible">
    <!-- Section toolbar (visible on hover) -->
    <div
      class="absolute -top-8 left-0 right-0 flex items-center justify-between opacity-0 group-hover/section:opacity-100 transition-opacity z-10 pointer-events-none group-hover/section:pointer-events-auto"
    >
      <!-- Left: drag handle + layout label -->
      <div class="flex items-center gap-1.5">
        <div
          class="section-drag-handle flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-grab active:cursor-grabbing shadow-sm hover:bg-slate-50"
          title="Réordonner cette section"
        >
          <svg class="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
          <span class="text-[10px] text-slate-500 font-medium">Section</span>
        </div>
      </div>

      <!-- Right: layout selector + delete -->
      <div class="flex items-center gap-1">
        <!-- Layout picker -->
        <div class="relative">
          <button
            class="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-50 shadow-sm"
            @click.stop="showLayoutMenu = !showLayoutMenu"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            {{ def.label }}
          </button>

          <!-- Layout dropdown -->
          <div
            v-if="showLayoutMenu"
            class="absolute right-0 top-7 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 w-48"
            @click.stop
          >
            <button
              v-for="ld in SECTION_LAYOUT_DEFINITIONS"
              :key="ld.type"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left hover:bg-slate-50 transition-colors"
              :class="ld.type === section.layout ? 'text-[var(--color-primary)] font-semibold bg-purple-50' : 'text-slate-700'"
              @click="changeLayout(ld.type)"
            >
              <span class="font-mono text-[9px] text-slate-400 shrink-0 w-20">{{ layoutIcons[ld.type] }}</span>
              {{ ld.label }}
            </button>
          </div>
        </div>

        <!-- Delete section -->
        <button
          class="flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-slate-400 shadow-sm transition-colors"
          title="Supprimer cette section"
          @click.stop="studio.removeSection(section.id)"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Section body: columns -->
    <div class="grid gap-3 p-3" :style="{ gridTemplateColumns: def.gridCols.map((s) => `${s}fr`).join(' ') }">
      <CanvasZone
        v-for="(zoneId, i) in zoneIds"
        :key="zoneId"
        :zone-id="zoneId"
        :col-index="i"
      />
    </div>
  </div>

  <!-- Click outside to close layout menu -->
  <div
    v-if="showLayoutMenu"
    class="fixed inset-0 z-20"
    @click="showLayoutMenu = false"
  />
</template>
