<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const src     = computed(() => props.block.config.imageUrl ?? '')
const alt     = computed(() => props.block.config.imageAlt ?? '')
const caption = computed(() => props.block.config.imageCaption ?? '')
const width   = computed(() => props.block.config.imageWidth ?? 'full')
const align   = computed(() => props.block.config.imageAlign ?? 'center')

const widthClass = computed(() => ({
  sm:   'max-w-xs',
  md:   'max-w-md',
  lg:   'max-w-2xl',
  full: 'w-full',
}[width.value]))

const alignClass = computed(() => ({
  left:   'mr-auto',
  center: 'mx-auto',
  right:  'ml-auto',
}[align.value]))
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="!src"
    class="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-14 text-slate-400"
  >
    <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
    </svg>
    <span class="text-xs font-medium">Ajouter une image →</span>
  </div>

  <!-- Image -->
  <figure v-else :class="['block', widthClass, alignClass]">
    <img
      :src="src"
      :alt="alt"
      class="w-full rounded-xl object-cover"
      loading="lazy"
    />
    <figcaption v-if="caption" class="mt-2 text-center text-sm italic text-slate-500">
      {{ caption }}
    </figcaption>
  </figure>
</template>
