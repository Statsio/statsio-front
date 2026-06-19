<script setup lang="ts">
import { useStudioStore } from '@/stores/studio'
import BlockConfigPanel from './sidebar/BlockConfigPanel.vue'

const studio = useStudioStore()
</script>

<template>
  <aside
    class="flex shrink-0 border-l border-slate-200 bg-white transition-all duration-200 overflow-hidden"
    :class="studio.isSidebarRightOpen ? 'w-72' : 'w-0'"
  >
    <div class="w-72 h-full overflow-hidden">
      <BlockConfigPanel />
    </div>
  </aside>
</template>
