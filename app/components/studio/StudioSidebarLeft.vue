<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { SidebarLeftTab } from '@/types/studio'
import SidebarBlocks from './sidebar/SidebarBlocks.vue'
import SidebarLayouts from './sidebar/SidebarLayouts.vue'
import SidebarDataSources from './sidebar/SidebarDataSources.vue'

const studio = useStudioStore()

interface RailTab {
  id: SidebarLeftTab
  label: string
  bars: [string, string, string]
}

const allTabs: RailTab[] = [
  { id: 'blocks', label: 'Éléments', bars: ['7px', '11px', '5px'] },
  { id: 'layouts', label: 'Sections', bars: ['11px', '4px', '11px'] },
  { id: 'sources', label: 'Données', bars: ['4px', '11px', '7px'] },
]

// « Données » (sources) ne concerne que les StatsData.
const tabs = computed(() =>
  studio.content?.type === 'article' || studio.content?.type === 'survey'
    ? allTabs.filter((tab) => tab.id !== 'sources')
    : allTabs,
)

const activeLabel = computed(
  () => tabs.value.find((t) => t.id === studio.activeLeftTab)?.label ?? '',
)

watch(tabs, (newTabs) => {
  if (!newTabs.some((tab) => tab.id === studio.activeLeftTab)) studio.closePanel()
})
</script>

<template>
  <!-- Icon rail -->
  <nav class="z-10 flex w-16 shrink-0 flex-col items-center gap-1.5 border-r border-[var(--studio-line)] bg-white py-3.5">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="flex w-[52px] flex-col items-center gap-1.5 rounded-[11px] py-[9px] transition-colors"
      :class="studio.isPanelOpen && studio.activeLeftTab === tab.id
        ? 'bg-[var(--studio-accent-wash)]'
        : 'hover:bg-[var(--studio-wash)]'"
      :title="tab.label"
      @click="studio.setLeftTab(tab.id)"
    >
      <span class="flex h-[17px] w-[17px] flex-col justify-center gap-[2px]">
        <span
          v-for="(h, i) in tab.bars"
          :key="i"
          class="rounded-[2px]"
          :style="{
            height: h,
            opacity: [1, 0.6, 0.35][i],
            background: studio.isPanelOpen && studio.activeLeftTab === tab.id ? 'var(--color-primary)' : 'var(--studio-muted)',
          }"
        />
      </span>
      <span
        class="text-[9.5px] font-bold"
        :class="studio.isPanelOpen && studio.activeLeftTab === tab.id ? 'text-[var(--color-primary)]' : 'text-[var(--studio-muted)]'"
      >{{ tab.label }}</span>
    </button>
  </nav>

  <!-- Inline panel -->
  <aside
    class="shrink-0 overflow-hidden border-r border-[var(--studio-line)] bg-white transition-[width] duration-200 ease-in-out"
    :class="studio.isPanelOpen ? 'w-[300px]' : 'w-0'"
  >
    <div class="flex h-full w-[300px] flex-col overflow-hidden">
      <div class="flex shrink-0 items-center justify-between gap-3 px-[22px] pb-3 pt-[18px]">
        <span class="text-[17px] font-extrabold text-[var(--studio-ink)]">{{ activeLabel }}</span>
        <button
          type="button"
          class="text-[16px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
          aria-label="Fermer le panneau"
          @click="studio.closePanel()"
        >✕</button>
      </div>

      <div class="min-h-0 flex-1 overflow-hidden">
        <SidebarBlocks v-if="studio.activeLeftTab === 'blocks'" />
        <SidebarLayouts v-else-if="studio.activeLeftTab === 'layouts'" />
        <SidebarDataSources v-else-if="studio.activeLeftTab === 'sources'" />
      </div>
    </div>
  </aside>
</template>
