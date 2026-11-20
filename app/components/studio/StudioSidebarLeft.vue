<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { useStudioLeftTabs } from '@/composables/useStudioLeftTabs'
import type { SidebarLeftTab } from '@/types/studio'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import StudioIcon from './ui/StudioIcon.vue'
import SidebarBlocks from './sidebar/SidebarBlocks.vue'
import SidebarScript from './sidebar/SidebarScript.vue'
import SidebarFilters from './sidebar/SidebarFilters.vue'
import SidebarDataSources from './sidebar/SidebarDataSources.vue'
import SidebarStatsDataLibrary from './sidebar/SidebarStatsDataLibrary.vue'
import SidebarSurveySettings from './sidebar/SidebarSurveySettings.vue'
import StudioAssistantPanel from './assistant/StudioAssistantPanel.vue'

const studio = useStudioStore()
const mediaLibrary = useMediaLibrary()
const { tabs } = useStudioLeftTabs()

const PANEL_TITLES: Partial<Record<SidebarLeftTab, string>> = {
  filters: 'Filtres de page',
  sdlib: 'Blocs StatsData',
  settings: 'Réglages du sondage',
}
const PANEL_HINTS: Partial<Record<SidebarLeftTab, string>> = {
  sources: 'Les sources branchées sur ce StatsData. Chaque bloc de données en choisit une.',
  filters: 'Appliqués à tous les blocs de la page qui utilisent la source.',
  script: 'Paramètres de page et blocs qui répètent ou conditionnent l’affichage.',
  sdlib: 'Reprenez un bloc d’un StatsData publié. Il reste relié à sa source et se met à jour avec elle.',
}

const activeLabel = computed(() => {
  const tab = tabs.value.find((t) => t.id === studio.activeLeftTab)
  if (!tab) return ''
  return PANEL_TITLES[tab.id] ?? tab.label
})
const activeHint = computed(() => PANEL_HINTS[studio.activeLeftTab] ?? '')

const isOn = (id: SidebarLeftTab) => studio.isPanelOpen && studio.activeLeftTab === id

watch(tabs, (newTabs) => {
  if (!newTabs.some((tab) => tab.id === studio.activeLeftTab)) studio.closePanel()
})
</script>

<template>
  <!-- Rail d'onglets -->
  <nav class="st-rail" aria-label="Panneaux">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      :aria-pressed="isOn(tab.id)"
      :title="tab.label"
      @click="studio.setLeftTab(tab.id)"
    >
      <DsTypeGlyph v-if="tab.icon.startsWith('glyph:')" kind="statsdata" :size="20" mono />
      <StudioIcon v-else :name="tab.icon" :size="20" />
      {{ tab.label }}
      <span v-if="tab.id === 'filters' && studio.hasActivePageFilters" class="st-badge" aria-label="Filtres actifs">●</span>
    </button>

    <span class="flex-1" aria-hidden="true" />

    <!-- Médias : ouvre la bibliothèque partagée (pas un panneau) -->
    <button
      type="button"
      title="Médias"
      @click="mediaLibrary.open({ mode: 'browse', studioContentSlug: studio.content?.slug })"
    >
      <StudioIcon name="media" :size="20" />
      Médias
    </button>
  </nav>

  <!-- Panneau -->
  <aside
    class="st-pnl"
    :class="{ 'st-pnl--closed': !studio.isPanelOpen }"
    :style="{ width: studio.activeLeftTab === 'assistant' ? '360px' : '300px' }"
    aria-label="Panneau"
  >
    <!-- Assistant : panneau plein, avec son propre entête -->
    <div v-if="studio.activeLeftTab === 'assistant'" class="h-full w-[360px] overflow-hidden">
      <StudioAssistantPanel />
    </div>

    <div v-else class="flex h-full w-[300px] flex-col overflow-hidden">
      <div class="shrink-0 px-4 pb-3 pt-4">
        <div class="st-pnl-h">
          <h2 class="st-h2">{{ activeLabel }}</h2>
          <button type="button" class="st-ibtn" aria-label="Fermer le panneau" @click="studio.closePanel()">
            <StudioIcon name="x" :size="16" />
          </button>
        </div>
        <p v-if="activeHint" class="st-hint mt-2">{{ activeHint }}</p>
      </div>

      <div class="min-h-0 flex-1 overflow-hidden">
        <SidebarBlocks v-if="studio.activeLeftTab === 'blocks'" />
        <SidebarScript v-else-if="studio.activeLeftTab === 'script'" />
        <SidebarFilters v-else-if="studio.activeLeftTab === 'filters'" />
        <SidebarDataSources v-else-if="studio.activeLeftTab === 'sources'" />
        <SidebarStatsDataLibrary v-else-if="studio.activeLeftTab === 'sdlib'" />
        <SidebarSurveySettings v-else-if="studio.activeLeftTab === 'settings'" />
      </div>
    </div>
  </aside>
</template>
