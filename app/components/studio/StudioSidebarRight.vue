<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import BlockConfigPanel from './sidebar/BlockConfigPanel.vue'
import SectionInspector from './inspector/SectionInspector.vue'

const studio = useStudioStore()
const showSection = computed(() => !!studio.selectedSection && !studio.selectedBlock)
</script>

<template>
  <aside
    class="flex shrink-0 overflow-hidden border-l border-[var(--studio-line)] bg-white transition-all duration-200"
    :class="studio.isSidebarRightOpen ? 'w-[372px]' : 'w-0'"
  >
    <div class="h-full w-[372px] overflow-hidden">
      <SectionInspector v-if="showSection" />
      <BlockConfigPanel v-else />
    </div>
  </aside>
</template>
