<script setup lang="ts">
import draggable from 'vuedraggable'
import { ref, watch } from 'vue'
import { createEmptyBlock, type StudioPaletteItem } from '@/types/studio-document'
import StudioPaletteRow from '@/components/studio/StudioPaletteRow.vue'

const props = defineProps<{
  items: StudioPaletteItem[]
}>()

const emit = defineEmits<{
  add: [StudioPaletteItem['blockType']]
}>()

const rows = ref<StudioPaletteItem[]>([...props.items])

watch(
  () => props.items,
  (v) => {
    rows.value = [...v]
  },
  { deep: true },
)

const clonePaletteItem = (item: StudioPaletteItem) => createEmptyBlock(item.blockType)

const group = { name: 'studio-blocks', pull: 'clone', put: false }
</script>

<template>
  <draggable
    v-model="rows"
    item-key="paletteId"
    :group="group"
    :sort="false"
    :clone="clonePaletteItem"
    class="grid grid-cols-1 gap-3 sm:grid-cols-2"
  >
    <template #item="{ element }">
      <StudioPaletteRow :item="element" @add="emit('add', element.blockType)" />
    </template>
  </draggable>
</template>
