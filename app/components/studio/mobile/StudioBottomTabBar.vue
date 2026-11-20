<script setup lang="ts">
import { useStudioStore } from '@/stores/studio'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { useStudioLeftTabs } from '@/composables/useStudioLeftTabs'
import { useBlockConfigTabs } from '@/composables/useBlockConfigTabs'
import type { SidebarLeftTab } from '@/types/studio'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'

const studio = useStudioStore()
const mediaLibrary = useMediaLibrary()
const { tabs: sidebarTabs } = useStudioLeftTabs()
const { block, currentTabs } = useBlockConfigTabs()

const isOn = (id: SidebarLeftTab) => studio.activeLeftTab === id && studio.mobileSheetSnap !== 'closed'


function onSidebarTabClick(tabId: SidebarLeftTab) {
  const wasActiveOpen = studio.activeLeftTab === tabId && studio.mobileSheetSnap !== 'closed'
  studio.setLeftTab(tabId)
  if (wasActiveOpen) studio.closeMobileSheet()
  else if (studio.mobileSheetSnap === 'closed') studio.openMobileSheet('half')
}

function onBlockTabClick(tabId: string) {
  const wasActiveOpen = studio.activeBlockTab === tabId && studio.mobileSheetSnap !== 'closed'
  studio.activeBlockTab = tabId
  if (wasActiveOpen) studio.closeMobileSheet()
  else if (studio.mobileSheetSnap === 'closed') studio.openMobileSheet('half')
}

function onCloseBlock() {
  studio.selectBlock(null)
  studio.closeMobileSheet()
}
</script>

<template>
  <nav class="st-mnav fixed inset-x-0 bottom-0 z-30 h-16 md:hidden" aria-label="Panneaux">
    <template v-if="!block">
      <button
        v-for="tab in sidebarTabs"
        :key="tab.id"
        type="button"
        :aria-pressed="isOn(tab.id)"
        :title="tab.label"
        @click="onSidebarTabClick(tab.id)"
      >
        <DsTypeGlyph v-if="tab.icon.startsWith('glyph:')" kind="statsdata" :size="18" mono />
        <StudioIcon v-else :name="tab.icon" :size="18" />
        {{ tab.label }}
      </button>
      <button type="button" :aria-pressed="isOn('properties')" title="Propriétés" @click="onSidebarTabClick('properties')">
        <StudioIcon name="gear" :size="18" />
        Réglages
      </button>
      <button type="button" title="Médias" @click="mediaLibrary.open({ mode: 'browse', studioContentSlug: studio.content?.slug })">
        <StudioIcon name="media" :size="18" />
        Médias
      </button>
    </template>

    <template v-else>
      <button type="button" aria-label="Fermer la configuration du bloc" @click="onCloseBlock">
        <StudioIcon name="x" :size="18" />
        Fermer
      </button>
      <button
        v-for="tab in currentTabs"
        :key="tab.id"
        type="button"
        class="!flex-row !justify-center !text-[12.5px]"
        :aria-pressed="studio.activeBlockTab === tab.id && studio.mobileSheetSnap !== 'closed'"
        @click="onBlockTabClick(tab.id)"
      >
        {{ tab.label }}
      </button>
    </template>
  </nav>
</template>
