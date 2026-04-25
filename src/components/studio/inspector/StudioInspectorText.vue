<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload } from '@/types/studio-document'

const props = defineProps<{
  block: Extract<StudioBlock, { type: 'text_heading' | 'text_paragraph' }>
  idPrefix: string
}>()

const emit = defineEmits<{
  'push-payload': [StudioBlockPayload]
}>()

const headingText = computed({
  get: () => (props.block.type === 'text_heading' ? props.block.text : ''),
  set: (v) => {
    if (props.block.type === 'text_heading') emit('push-payload', { type: 'text_heading', text: v })
  },
})

const paragraphText = computed({
  get: () => (props.block.type === 'text_paragraph' ? props.block.text : ''),
  set: (v) => {
    if (props.block.type === 'text_paragraph') emit('push-payload', { type: 'text_paragraph', text: v })
  },
})
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-3">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Contenu
        </label>
        <div class="h-px bg-slate-100 mb-2" />
        
        <div v-if="block.type === 'text_heading'">
          <label class="mb-1.5 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-h`">
            Texte du titre
          </label>
          <input
            :id="`${idPrefix}-h`"
            v-model="headingText"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20"
            autocomplete="off"
          />
        </div>
        <div v-else>
          <label class="mb-1.5 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-para`">
            Corps du texte
          </label>
          <textarea
            :id="`${idPrefix}-para`"
            v-model="paragraphText"
            rows="6"
            class="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </section>

    <!-- On pourrait ajouter une section Style ici plus tard -->
  </div>
</template>

