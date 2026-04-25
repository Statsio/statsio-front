<script setup lang="ts">
import { computed } from 'vue'
import type { StudioTextStyle } from '@/types/studio-document'

type Payload = { type: 'link'; label: string; url: string; targetPageId?: string; style?: StudioTextStyle }

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

const textStyle = computed(() => {
  const s = props.payload.style
  const deco: string[] = []
  if (s?.underline) deco.push('underline')
  if (s?.strike) deco.push('line-through')
  return {
    color: s?.color,
    backgroundColor: s?.highlight,
    fontFamily: s?.fontFamily,
    fontWeight: s?.fontWeight,
    fontStyle: s?.italic ? 'italic' : undefined,
    textDecoration: deco.length ? deco.join(' ') : undefined,
  } as Record<string, string | number | undefined>
})

const emitLabel = (label: string) => {
  emit('update:payload', {
    type: 'link',
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
  <div class="content-block content-block--link" :class="alignClass">
    <label v-if="editable" class="sr-only" :for="fieldId">Label du lien</label>
    <input
      v-if="editable"
      :id="fieldId"
      :value="payload.label"
      type="text"
      class="inline-block border-0 border-b border-transparent bg-transparent px-0 py-1 text-base outline-none transition placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-0 motion-reduce:transition-none"
      :style="textStyle"
      autocomplete="off"
      @input="emitLabel(($event.target as HTMLInputElement).value)"
    />
    <a v-else :href="href" :style="textStyle" class="inline-block text-base">
      {{ payload.label }}
    </a>
  </div>
</template>
