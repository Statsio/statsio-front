<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { SidebarLeftTab } from '@/types/studio'
import SidebarBlocks from './sidebar/SidebarBlocks.vue'
import SidebarLayouts from './sidebar/SidebarLayouts.vue'
import SidebarScript from './sidebar/SidebarScript.vue'
import SidebarDataSources from './sidebar/SidebarDataSources.vue'
import StudioAssistantPanel from './assistant/StudioAssistantPanel.vue'

const studio = useStudioStore()

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
    id: 'layouts',
    label: 'Sections',
    icon: 'M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z',
  },
  {
    id: 'script',
    label: 'Script',
    icon: 'M17.25 6.75 22.5 12l-5.25 5.25M6.75 17.25 1.5 12l5.25-5.25m7.5-3-4.5 16.5',
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
        class="text-[9.5px] font-bold"
        :class="studio.isPanelOpen && studio.activeLeftTab === tab.id ? 'text-[var(--color-primary)]' : 'text-[var(--studio-muted)]'"
      >{{ tab.label }}</span>
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
        <SidebarLayouts v-else-if="studio.activeLeftTab === 'layouts'" />
        <SidebarScript v-else-if="studio.activeLeftTab === 'script'" />
        <SidebarDataSources v-else-if="studio.activeLeftTab === 'sources'" />
      </div>
    </div>
  </aside>
</template>
