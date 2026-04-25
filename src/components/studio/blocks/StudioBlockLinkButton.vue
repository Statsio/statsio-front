<script setup lang="ts">
import { computed } from 'vue'
import type { StudioTextStyle } from '@/types/studio-document'

type Payload = { type: 'link_button'; label: string; url: string; targetPageId?: string; style?: StudioTextStyle }

const props = withDefaults(
  defineProps<{
    payload: Payload
    fieldId: string
    editable?: boolean
  }>(),
  { editable: true },
)

const emit = defineEmits<{
  'update:payload': [Payload]
}>()

const alignClass = computed(() => {
  const a = props.payload.style?.align ?? 'left'
  if (a === 'center') return 'text-center'
  if (a === 'right') return 'text-right'
  if (a === 'justify') return 'text-justify'
  return 'text-left'
})

const buttonStyle = computed(() => {
  const s = props.payload.style
  return {
    color: s?.color,
    backgroundColor: s?.highlight,
    fontFamily: s?.fontFamily,
    fontWeight: s?.fontWeight,
    fontStyle: s?.italic ? 'italic' : undefined,
  } as Record<string, string | number | undefined>
})

const emitLabel = (label: string) => {
  emit('update:payload', {
    type: 'link_button',
    label,
    url: props.payload.url,
    ...(props.payload.targetPageId ? { targetPageId: props.payload.targetPageId } : {}),
    ...(props.payload.style ? { style: { ...props.payload.style } } : {}),
  })
}

const href = computed(() => {
  if (props.payload.targetPageId) {
    return `#page-${props.payload.targetPageId}`
  }
  return props.payload.url || '#'
})
</script>

<template>
  <div class="content-block content-block--link-button" :class="alignClass">
    <label v-if="editable" class="sr-only" :for="fieldId">Label du bouton</label>
    <input
      v-if="editable"
      :id="fieldId"
      :value="payload.label"
      type="text"
      class="inline-block rounded-xl border-0 px-4 py-2 text-sm outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20 motion-reduce:transition-none"
      :style="buttonStyle"
      autocomplete="off"
      @input="emitLabel(($event.target as HTMLInputElement).value)"
    />
    <a
      v-else
      :href="href"
      :style="buttonStyle"
      class="inline-block rounded-xl px-4 py-2 text-sm transition hover:opacity-90 motion-reduce:transition-none"
    >
      {{ payload.label }}
    </a>
  </div>
</template>
