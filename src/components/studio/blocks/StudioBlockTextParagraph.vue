<script setup lang="ts">
type Payload = { type: 'text_paragraph'; text: string }

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

const emitText = (text: string) => {
  emit('update:payload', { type: 'text_paragraph', text })
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
      class="block min-h-[6rem] w-full resize-y border-0 bg-transparent px-0 py-1 text-base leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/15 motion-reduce:transition-none"
      @input="emitText(($event.target as HTMLTextAreaElement).value)"
    />
    <p v-else class="text-base leading-relaxed text-slate-700">
      {{ payload.text }}
    </p>
  </div>
</template>
