<script setup lang="ts">
import { computed } from 'vue'
import type { StudioTextStyle } from '@/types/studio-document'

type Payload = { type: 'text_heading'; text: string; style?: StudioTextStyle }

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

const emitText = (text: string) => {
  emit('update:payload', {
    type: 'text_heading',
    text,
    ...(props.payload.style ? { style: { ...props.payload.style } } : {}),
  })
}
</script>

<template>
  <div class="content-block content-block--text-heading">
    <label class="sr-only" :for="fieldId">Titre</label>
    <input
      v-if="editable"
      :id="fieldId"
      :value="payload.text"
      type="text"
      :class="[
        'block w-full border-0 border-b border-transparent bg-transparent px-0 py-1 text-3xl tracking-[-0.04em] outline-none transition placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-0 motion-reduce:transition-none sm:text-4xl',
        alignClass,
      ]"
      :style="textStyle"
      autocomplete="off"
      @input="emitText(($event.target as HTMLInputElement).value)"
    />
    <h2 v-else :class="['text-3xl tracking-[-0.04em] sm:text-4xl', alignClass]" :style="textStyle">
      {{ payload.text }}
    </h2>
  </div>
</template>
