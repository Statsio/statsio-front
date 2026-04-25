<script setup lang="ts">
import draggable from 'vuedraggable'
import { computed } from 'vue'
import type { StudioBlock } from '@/types/studio-document'
import StudioBlockCard from '@/components/studio/StudioBlockCard.vue'

const props = defineProps<{
  modelValue: StudioBlock[]
  selectedBlockId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: StudioBlock[]]
  'select-block': [id: string]
  update: [block: StudioBlock]
  'duplicate-block': [id: string]
  'remove-block': [id: string]
}>()

const list = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const group = { name: 'studio-blocks', pull: true, put: true }
</script>

<template>
  <draggable
    v-model="list"
    item-key="id"
    :group="group"
    handle=".studio-canvas-drag-handle"
    :filter="'input, textarea, select, button, a, [contenteditable]'"
    :prevent-on-filter="false"
    class="studio-canvas flex min-h-[280px] flex-col gap-10 lg:gap-12"
    ghost-class="studio-dnd-ghost"
    chosen-class="studio-dnd-chosen"
    drag-class="studio-dnd-drag"
  >
    <template #item="{ element }">
      <StudioBlockCard
        :block="element"
        :selected="element.id === selectedBlockId"
        @select="emit('select-block', element.id)"
        @update="emit('update', $event)"
        @duplicate="emit('duplicate-block', $event)"
        @remove="emit('remove-block', $event)"
      />
    </template>
    <template #footer>
      <p
        v-if="modelValue.length === 0"
        class="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center text-sm leading-relaxed text-slate-500 motion-reduce:transition-none"
      >
        Glissez un bloc depuis la colonne de gauche ou utilisez « Ajouter » dans la bibliothèque.
      </p>
    </template>
  </draggable>
</template>

<style scoped>
:deep(.studio-dnd-ghost) {
  opacity: 0.65;
}
:deep(.studio-dnd-chosen) {
  opacity: 0.95;
}
:deep(.studio-dnd-drag) {
  opacity: 1;
}
</style>
