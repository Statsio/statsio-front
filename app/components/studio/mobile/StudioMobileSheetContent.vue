<script setup lang="ts">
import { useStudioStore } from '@/stores/studio'
import { useBlockConfigTabs } from '@/composables/useBlockConfigTabs'
import SidebarBlocks from '@/components/studio/sidebar/SidebarBlocks.vue'
import SidebarScript from '@/components/studio/sidebar/SidebarScript.vue'
import SidebarFilters from '@/components/studio/sidebar/SidebarFilters.vue'
import SidebarDataSources from '@/components/studio/sidebar/SidebarDataSources.vue'
import StudioAssistantPanel from '@/components/studio/assistant/StudioAssistantPanel.vue'
import FormBlockInspector from '@/components/studio/inspector/FormBlockInspector.vue'
import MediaBlockInspector from '@/components/studio/inspector/MediaBlockInspector.vue'
import RichBlockInspector from '@/components/studio/inspector/RichBlockInspector.vue'
import SearchBlockInspector from '@/components/studio/inspector/SearchBlockInspector.vue'
import ParamBlockInspector from '@/components/studio/inspector/ParamBlockInspector.vue'
import DataBlockInspector from '@/components/studio/inspector/DataBlockInspector.vue'
import MapBlockInspector from '@/components/studio/inspector/MapBlockInspector.vue'
import RecordBlockInspector from '@/components/studio/inspector/RecordBlockInspector.vue'
import SdEmbedBlockInspector from '@/components/studio/inspector/SdEmbedBlockInspector.vue'
import LoopBlockInspector from '@/components/studio/inspector/LoopBlockInspector.vue'
import IfBlockInspector from '@/components/studio/inspector/IfBlockInspector.vue'
import LayoutBlockInspector from '@/components/studio/inspector/LayoutBlockInspector.vue'
import FilterDrillInPanel from '@/components/studio/filters/FilterDrillInPanel.vue'
import ColumnDrillInPanel from '@/components/studio/filters/ColumnDrillInPanel.vue'
import SourceDrillInPanel from '@/components/studio/filters/SourceDrillInPanel.vue'

const studio = useStudioStore()
const {
  block,
  isText,
  isSearch,
  isParam,
  isMap,
  isSdEmbed,
  isLoop,
  isCondition,
  isLayout,
  isEditorial,
  isForm,
  isRecord,
  activeTab,
} = useBlockConfigTabs()
</script>

<template>
  <!-- ─── Bloc sélectionné : mêmes inspecteurs que le panneau desktop ──────────── -->
  <div v-if="block" class="relative h-full">
    <FilterDrillInPanel />
    <ColumnDrillInPanel />
    <SourceDrillInPanel />

    <SearchBlockInspector v-if="isSearch" :block="block" :active-tab="activeTab" />
    <ParamBlockInspector v-if="isParam" :block="block" :active-tab="activeTab" />
    <SdEmbedBlockInspector v-if="isSdEmbed && activeTab === 'config'" :block="block" />
    <IfBlockInspector v-if="isCondition && activeTab === 'condition'" :block="block" />
    <MediaBlockInspector v-if="isEditorial && activeTab === 'editorial'" :block="block" />
    <FormBlockInspector v-if="isForm && activeTab === 'form'" :block="block" />
    <LoopBlockInspector v-if="isLoop" :block="block" :active-tab="activeTab" />
    <LayoutBlockInspector v-if="isLayout && activeTab === 'layout'" :block="block" />
    <RecordBlockInspector v-if="isRecord" :block="block" :active-tab="activeTab" />
    <MapBlockInspector v-if="isMap" :block="block" :active-tab="activeTab" />
    <DataBlockInspector
      v-if="!isText && !isSearch && !isParam && !isSdEmbed && !isEditorial && !isForm && !isLoop && !isCondition && !isLayout && !isRecord && !isMap"
      :block="block"
      :active-tab="activeTab"
    />
    <RichBlockInspector v-if="isText && activeTab === 'style'" :block="block" />
  </div>

  <!-- ─── Aucun bloc sélectionné : contenu de la sidebar gauche ────────────────── -->
  <template v-else>
    <StudioAssistantPanel v-if="studio.activeLeftTab === 'assistant'" />
    <SidebarBlocks v-else-if="studio.activeLeftTab === 'blocks'" />
    <SidebarScript v-else-if="studio.activeLeftTab === 'script'" />
    <SidebarFilters v-else-if="studio.activeLeftTab === 'filters'" />
    <SidebarDataSources v-else-if="studio.activeLeftTab === 'sources'" />
  </template>
</template>
