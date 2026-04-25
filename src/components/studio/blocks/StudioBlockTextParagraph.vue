<script setup lang="ts">
import { computed } from 'vue'
import type { StudioTextStyle } from '@/types/studio-document'

type Payload = { type: 'text_paragraph'; text: string; style?: StudioTextStyle }

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
    type: 'text_paragraph',
    text,
    ...(props.payload.style ? { style: { ...props.payload.style } } : {}),
  })
}
</script>

<template>
  <div class="content-block content-block--text-paragraph">
    <label class="sr-only" :for="`${fieldId}-para`">Paragraphe</label>
    <textarea
      v-if="editable"
      :id="`${fieldId}-para`"
      :value="payload.text"
      rows="1"
      :class="[
        'block min-h-[6rem] w-full resize-y border-0 bg-transparent px-0 py-1 text-base leading-relaxed outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/15 motion-reduce:transition-none',
        alignClass,
      ]"
      :style="textStyle"
      @input="emitText(($event.target as HTMLTextAreaElement).value)"
    />
    <p v-else :class="['text-base leading-relaxed', alignClass]" :style="textStyle">
      {{ payload.text }}
    </p>
  </div>
</template>
