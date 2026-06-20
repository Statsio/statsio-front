<script setup lang="ts">
import { useStudioStore } from '@/stores/studio'
import type { SidebarLeftTab } from '@/types/studio'
import SidebarBlocks from './sidebar/SidebarBlocks.vue'
import SidebarLayouts from './sidebar/SidebarLayouts.vue'
import SidebarDataSources from './sidebar/SidebarDataSources.vue'
import DynamicParamsPanel from './sidebar/DynamicParamsPanel.vue'

const studio = useStudioStore()

const tabs: { id: SidebarLeftTab; label: string; icon: string }[] = [
  {
    id: 'blocks',
    label: 'Éléments',
    icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  },
  {
    id: 'layouts',
    label: 'Sections',
    icon: 'M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Zm9 7.5a.75.75 0 0 1 .728.568l.258 1.036a1.875 1.875 0 0 0 1.36 1.36l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258a1.875 1.875 0 0 0-1.36 1.36l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a1.875 1.875 0 0 0-1.36-1.36l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a1.875 1.875 0 0 0 1.36-1.36l.258-1.036A.75.75 0 0 1 18 12Z',
  },
  {
    id: 'sources',
    label: 'Données',
    icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
  },
]
</script>

<template>
  <!-- Icon strip (always visible) -->
  <nav class="w-14 shrink-0 flex flex-col items-center py-2 gap-1 border-r border-slate-200 bg-white z-10">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="flex flex-col items-center gap-0.5 w-12 py-2.5 rounded-xl transition-colors"
      :class="studio.isPanelOpen && studio.activeLeftTab === tab.id
        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'"
      :title="tab.label"
      @click="studio.setLeftTab(tab.id)"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" :d="tab.icon" />
      </svg>
      <span class="text-[9px] font-semibold tracking-wide">{{ tab.label }}</span>
    </button>
  </nav>

  <!-- Inline panel — in flex flow so the canvas is pushed, not overlaid -->
  <aside
    class="shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"
    :class="studio.isPanelOpen ? 'w-72' : 'w-0'"
  >
    <div class="w-72 h-full flex flex-col overflow-hidden">
      <!-- Panel header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <p class="text-sm font-bold text-slate-800">
          {{ tabs.find((t) => t.id === studio.activeLeftTab)?.label }}
        </p>
        <button
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          @click="studio.closePanel()"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Panel content -->
      <div class="flex-1 overflow-y-auto min-h-0">
        <SidebarBlocks v-if="studio.activeLeftTab === 'blocks'" />
        <SidebarLayouts v-else-if="studio.activeLeftTab === 'layouts'" />
        <SidebarDataSources v-else-if="studio.activeLeftTab === 'sources'" />
      </div>

      <!-- Dynamic params panel — shown at bottom when on a template page -->
      <DynamicParamsPanel />
    </div>
  </aside>
</template>
