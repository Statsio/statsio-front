<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import BlockConfigPanel from './sidebar/BlockConfigPanel.vue'
import SectionInspector from './inspector/SectionInspector.vue'
import DocumentInspector from './inspector/DocumentInspector.vue'

/** Inspecteur (toujours visible) : bloc sélectionné → section → propriétés du document. */
const studio = useStudioStore()
const showSection = computed(() => !!studio.selectedSection && !studio.selectedBlock)
</script>

<template>
  <aside class="st-insp w-[324px]" aria-label="Réglages">
    <div class="h-full w-[324px] overflow-hidden">
      <BlockConfigPanel v-if="studio.selectedBlock" />
      <SectionInspector v-else-if="showSection" />
      <DocumentInspector v-else />
    </div>
  </aside>
</template>
