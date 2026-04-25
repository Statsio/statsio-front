<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload } from '@/types/studio-document'

const props = defineProps<{
  block: Extract<StudioBlock, { type: 'image' }>
  idPrefix: string
}>()

const emit = defineEmits<{
  'push-payload': [StudioBlockPayload]
}>()

const imageAlt = computed({
  get: () => props.block.alt,
  set: (v) => emit('push-payload', { type: 'image', alt: v }),
})
</script>

<template>
  <div>
    <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-img`">Texte alternatif</label>
    <input
      :id="`${idPrefix}-img`"
      v-model="imageAlt"
      type="text"
      class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
      autocomplete="off"
    />
  </div>
</template>

