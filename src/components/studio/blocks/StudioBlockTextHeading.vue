<script setup lang="ts">
type Payload = { type: 'text_heading'; text: string }

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
  emit('update:payload', { type: 'text_heading', text })
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
      class="block w-full border-0 border-b border-transparent bg-transparent px-0 py-1 text-3xl font-semibold tracking-[-0.04em] text-slate-950 outline-none transition placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-0 motion-reduce:transition-none sm:text-4xl"
      autocomplete="off"
      @input="emitText(($event.target as HTMLInputElement).value)"
    />
    <h2 v-else class="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
      {{ payload.text }}
    </h2>
  </div>
</template>
