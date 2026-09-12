<script setup lang="ts">
import { useStudioStore } from '@/stores/studio'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { useStudioLeftTabs } from '@/composables/useStudioLeftTabs'
import { useBlockConfigTabs } from '@/composables/useBlockConfigTabs'
import type { SidebarLeftTab } from '@/types/studio'

const studio = useStudioStore()
const mediaLibrary = useMediaLibrary()
const { tabs: sidebarTabs } = useStudioLeftTabs()
const { block, currentTabs } = useBlockConfigTabs()

const MEDIA_ICON =
  'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z'

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
  <nav
    class="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch gap-1 overflow-x-auto border-t border-[var(--studio-line)] bg-white px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
  >
    <template v-if="!block">
      <button
        v-for="tab in sidebarTabs"
        :key="tab.id"
        type="button"
        class="flex shrink-0 flex-col items-center justify-center gap-1 rounded-[11px] px-3.5 py-1.5 transition-colors"
        :class="studio.activeLeftTab === tab.id && studio.mobileSheetSnap !== 'closed' ? 'bg-[var(--studio-accent-wash)]' : ''"
        :title="tab.label"
        @click="onSidebarTabClick(tab.id)"
      >
        <span class="relative">
          <svg
            class="h-[19px] w-[19px]"
            :class="studio.activeLeftTab === tab.id && studio.mobileSheetSnap !== 'closed' ? 'text-[var(--color-primary)]' : 'text-[var(--studio-muted)]'"
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
          :class="studio.activeLeftTab === tab.id && studio.mobileSheetSnap !== 'closed' ? 'text-[var(--color-primary)]' : 'text-[var(--studio-muted)]'"
        >{{ tab.label }}</span>
      </button>

      <button
        type="button"
        class="flex shrink-0 flex-col items-center justify-center gap-1 rounded-[11px] px-3.5 py-1.5"
        title="Médias"
        @click="mediaLibrary.open({ mode: 'browse', studioContentSlug: studio.content?.slug })"
      >
        <svg class="h-[19px] w-[19px] text-[var(--studio-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
          <path stroke-linecap="round" stroke-linejoin="round" :d="MEDIA_ICON" />
        </svg>
        <span class="text-[9.5px] font-bold text-[var(--studio-muted)]">Médias</span>
      </button>
    </template>

    <template v-else>
      <button
        type="button"
        class="flex shrink-0 flex-col items-center justify-center gap-1 rounded-[11px] px-3.5 py-1.5"
        aria-label="Fermer la configuration du bloc"
        @click="onCloseBlock"
      >
        <svg class="h-[19px] w-[19px] text-[var(--studio-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
        <span class="text-[9.5px] font-bold text-[var(--studio-muted)]">Fermer</span>
      </button>

      <span class="my-2.5 w-px shrink-0 bg-[var(--studio-line)]" aria-hidden="true" />

      <button
        v-for="tab in currentTabs"
        :key="tab.id"
        type="button"
        class="flex shrink-0 items-center justify-center whitespace-nowrap rounded-[11px] px-4 text-[12.5px] font-bold transition-colors"
        :class="studio.activeBlockTab === tab.id && studio.mobileSheetSnap !== 'closed' ? 'bg-[var(--studio-accent-wash)] text-[var(--color-primary)]' : 'text-[var(--studio-muted)]'"
        @click="onBlockTabClick(tab.id)"
      >
        {{ tab.label }}
      </button>
    </template>
  </nav>
</template>
