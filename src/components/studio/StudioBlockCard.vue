<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload, StudioBlockAction } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import { blockToPayload, mergeBlockWithPayload } from '@/types/studio-document'
import { resolveStudioBlock } from '@/components/studio/blocks/studio-block-registry'

const props = withDefaults(
  defineProps<{
    block: StudioBlock
    selected: boolean
    /** Empêche un bloc parent (ex. layout) de capter la sélection via bubbling. */
    stopSelectBubble?: boolean
    dataSources?: StudioDataSource[]
    pages?: Array<{ id: string; name: string }>
  }>(),
  { stopSelectBubble: false },
)

const emit = defineEmits<{
  select: []
  update: [StudioBlock]
  duplicate: [id: string]
  remove: [id: string]
  action: [payload: { action: StudioBlockAction; context: Record<string, unknown> }]
}>()

const inner = computed(() => resolveStudioBlock(props.block.type))

const onPayload = (payload: StudioBlockPayload) => {
  emit('update', mergeBlockWithPayload(props.block.id, payload))
}

const onAction = (action: StudioBlockAction, context: Record<string, unknown>) => {
  emit('action', { action, context })
}

const onSelectClick = (e: MouseEvent) => {
  if (props.stopSelectBubble) e.stopPropagation()
  emit('select')
}

const onSelectFocusIn = (e: FocusEvent) => {
  if (props.stopSelectBubble) e.stopPropagation()
  emit('select')
}
</script>

<template>
  <div
    class="group flex gap-3 rounded-xl transition motion-reduce:transition-none"
    :class="
      selected
        ? 'ring-2 ring-primary/40 ring-offset-0'
        : 'ring-1 ring-transparent ring-offset-0 hover:ring-slate-200/80'
    "
  >
    <div
      class="relative min-w-0 flex-1 p-3 outline-none"
      @click="onSelectClick"
      @focusin.capture="onSelectFocusIn"
    >
      <div
        class="studio-canvas-drag-handle pointer-events-auto absolute left-2 top-2 inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-600 shadow-sm opacity-0 backdrop-blur-sm transition hover:bg-white hover:text-slate-900 active:cursor-grabbing group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
        role="button"
        tabindex="0"
        aria-label="Déplacer le bloc"
        title="Déplacer"
        @click.stop
        @keydown.enter.prevent.stop
        @keydown.space.prevent.stop
      >
        <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="7" r="1.25" />
          <circle cx="15" cy="7" r="1.25" />
          <circle cx="9" cy="12" r="1.25" />
          <circle cx="15" cy="12" r="1.25" />
          <circle cx="9" cy="17" r="1.25" />
          <circle cx="15" cy="17" r="1.25" />
        </svg>
      </div>

      <div
        class="pointer-events-none absolute right-2 top-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
      >
        <button
          type="button"
          class="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-600 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          aria-label="Dupliquer le bloc"
          title="Dupliquer"
          @click.stop="emit('duplicate', block.id)"
        >
          <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
            <path
              d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1Zm4 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2Zm0 16H8V7h12v14Z"
            />
          </svg>
        </button>

        <button
          type="button"
          class="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-rose-700 shadow-sm backdrop-blur-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/40 motion-reduce:transition-none"
          aria-label="Supprimer le bloc"
          title="Supprimer"
          @click.stop="emit('remove', block.id)"
        >
          <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
            <path
              d="M6 7h12l-1 14H7L6 7Zm3-3h6l1 2H8l1-2Zm-5 2h16v2H4V6Z"
            />
          </svg>
        </button>
      </div>

      <component
        :is="inner"
        :payload="blockToPayload(block)"
        :field-id="block.id"
        :editable="true"
        :data-sources="dataSources"
        :pages="pages"
        @update:payload="onPayload"
        @action="onAction"
      />
    </div>
  </div>
</template>
