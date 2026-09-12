<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { useStudioLeftTabs } from '@/composables/useStudioLeftTabs'
import type { SidebarLeftTab } from '@/types/studio'
import SidebarBlocks from './sidebar/SidebarBlocks.vue'
import SidebarScript from './sidebar/SidebarScript.vue'
import SidebarFilters from './sidebar/SidebarFilters.vue'
import SidebarDataSources from './sidebar/SidebarDataSources.vue'
import StudioAssistantPanel from './assistant/StudioAssistantPanel.vue'

const studio = useStudioStore()
const mediaLibrary = useMediaLibrary()
const { tabs } = useStudioLeftTabs()

const MEDIA_ICON =
  'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z'

const PANEL_TITLES: Partial<Record<SidebarLeftTab, string>> = { filters: 'Filtres actifs' }

const activeLabel = computed(() => {
  const tab = tabs.value.find((t) => t.id === studio.activeLeftTab)
  if (!tab) return ''
  return PANEL_TITLES[tab.id] ?? tab.label
})

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
      <span class="relative">
        <svg
          class="h-[19px] w-[19px]"
          :class="studio.isPanelOpen && studio.activeLeftTab === tab.id ? 'text-[var(--color-primary)]' : 'text-[var(--studio-muted)]'"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.7"
        >
          <path stroke-linecap="round" stroke-linejoin="round" :d="tab.icon" />
        </svg>
        <span
          v-if="tab.id === 'filters' && studio.hasActivePageFilters"
          class="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
          aria-hidden="true"
        />
      </span>
      <span
        class="text-[9.5px] font-bold"
        :class="studio.isPanelOpen && studio.activeLeftTab === tab.id ? 'text-[var(--color-primary)]' : 'text-[var(--studio-muted)]'"
      >{{ tab.label }}</span>
    </button>

    <!-- Médias : ouvre la bibliothèque partagée (pas un panneau) -->
    <button
      type="button"
      class="flex w-[52px] flex-col items-center gap-1.5 rounded-[11px] py-[9px] transition-colors hover:bg-[var(--studio-wash)]"
      title="Médias"
      @click="mediaLibrary.open({ mode: 'browse', studioContentSlug: studio.content?.slug })"
    >
      <svg class="h-[19px] w-[19px] text-[var(--studio-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
        <path stroke-linecap="round" stroke-linejoin="round" :d="MEDIA_ICON" />
      </svg>
      <span class="text-[9.5px] font-bold text-[var(--studio-muted)]">Médias</span>
    </button>
  </nav>

  <!-- Inline panel -->
  <aside
    class="shrink-0 overflow-hidden border-r border-[var(--studio-line)] bg-white transition-[width] duration-200 ease-in-out"
    :class="studio.isPanelOpen ? (studio.activeLeftTab === 'assistant' ? 'w-[360px]' : 'w-[300px]') : 'w-0'"
  >
    <!-- Assistant : panneau plein, avec son propre entête -->
    <div v-if="studio.activeLeftTab === 'assistant'" class="h-full w-[360px] overflow-hidden">
      <StudioAssistantPanel />
    </div>

    <!-- Autres onglets : entête générique + contenu -->
    <div v-else class="flex h-full w-[300px] flex-col overflow-hidden">
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
        <SidebarScript v-else-if="studio.activeLeftTab === 'script'" />
        <SidebarFilters v-else-if="studio.activeLeftTab === 'filters'" />
        <SidebarDataSources v-else-if="studio.activeLeftTab === 'sources'" />
      </div>
    </div>
  </aside>
</template>
