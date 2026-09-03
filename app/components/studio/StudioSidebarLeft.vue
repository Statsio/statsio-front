<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import type { SidebarLeftTab } from '@/types/studio'
import SidebarBlocks from './sidebar/SidebarBlocks.vue'
import SidebarScript from './sidebar/SidebarScript.vue'
import SidebarFilters from './sidebar/SidebarFilters.vue'
import SidebarDataSources from './sidebar/SidebarDataSources.vue'
import StudioAssistantPanel from './assistant/StudioAssistantPanel.vue'

const studio = useStudioStore()
const mediaLibrary = useMediaLibrary()

const MEDIA_ICON =
  'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z'

const assistantEnabled = computed(() => {
  // runtimeConfig type = boolean, mais un override runtime (NUXT_PUBLIC_…) peut injecter la chaîne "true".
  const v: unknown = useRuntimeConfig().public.studioAssistantEnabled
  return v === true || v === 'true'
})

interface RailTab {
  id: SidebarLeftTab
  label: string
  icon: string
}

const allTabs: RailTab[] = [
  {
    id: 'blocks',
    label: 'Éléments',
    icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  },
  {
    id: 'script',
    label: 'Script',
    icon: 'M17.25 6.75 22.5 12l-5.25 5.25M6.75 17.25 1.5 12l5.25-5.25m7.5-3-4.5 16.5',
  },
  {
    id: 'filters',
    label: 'Filtres',
    icon: 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 22.5v-8.47a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z',
  },
  {
    id: 'sources',
    label: 'Données',
    icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
  },
  {
    id: 'assistant',
    label: 'Assistant',
    icon: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 0 0 2.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z',
  },
]

// « Données » (sources) ne concerne que les StatsData ; « Assistant » est masqué tant que non activé.
const tabs = computed(() =>
  allTabs.filter((tab) => {
    if (tab.id === 'sources') {
      return studio.content?.type !== 'article' && studio.content?.type !== 'survey'
    }
    if (tab.id === 'assistant') {
      return assistantEnabled.value
    }
    return true
  }),
)

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
      @click="mediaLibrary.open({ mode: 'browse' })"
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
