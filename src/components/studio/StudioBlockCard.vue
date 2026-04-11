<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload } from '@/types/studio-document'
import { blockToPayload, mergeBlockWithPayload } from '@/types/studio-document'
import { resolveStudioBlock } from '@/components/studio/blocks/studio-block-registry'

const props = defineProps<{
  block: StudioBlock
  selected: boolean
}>()

const emit = defineEmits<{
  select: []
  update: [StudioBlock]
}>()

const inner = computed(() => resolveStudioBlock(props.block.type))

const onPayload = (payload: StudioBlockPayload) => {
  emit('update', mergeBlockWithPayload(props.block.id, payload))
}
</script>

<template>
  <div
    class="group flex gap-3 rounded-xl transition motion-reduce:transition-none"
    :class="
      selected
        ? 'ring-2 ring-primary/40 ring-offset-2 ring-offset-white'
        : 'ring-1 ring-transparent ring-offset-0 hover:ring-slate-200/80'
    "
  >
    <button
      type="button"
      class="studio-drag-handle mt-1 flex h-9 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-slate-300 opacity-60 transition hover:bg-slate-100 hover:text-slate-500 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:cursor-grabbing motion-reduce:transition-none lg:opacity-80"
      aria-label="Déplacer le bloc"
      @click.stop
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="7" r="1.5" />
        <circle cx="15" cy="7" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="17" r="1.5" />
        <circle cx="15" cy="17" r="1.5" />
      </svg>
    </button>

    <div
      class="min-w-0 flex-1 py-1 outline-none"
      @pointerdown="emit('select')"
      @focusin.capture="emit('select')"
    >
      <component
        :is="inner"
        :payload="blockToPayload(block)"
        :field-id="block.id"
        :editable="true"
        @update:payload="onPayload"
      />
    </div>
  </div>
</template>
