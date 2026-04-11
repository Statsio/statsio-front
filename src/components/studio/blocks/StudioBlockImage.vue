<script setup lang="ts">
type Payload = { type: 'image'; alt: string }

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

const emitAlt = (alt: string) => {
  emit('update:payload', { type: 'image', alt })
}
</script>

<template>
  <figure class="content-block content-block--image my-2">
    <div
      class="flex aspect-[16/10] max-h-[min(24rem,70vw)] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500"
      role="img"
      :aria-label="payload.alt"
    >
      <span class="px-6 text-sm leading-relaxed">Image — média géré par l’API</span>
    </div>
    <figcaption class="mt-3">
      <label class="sr-only" :for="`${fieldId}-alt`">Légende</label>
      <input
        v-if="editable"
        :id="`${fieldId}-alt`"
        :value="payload.alt"
        type="text"
        class="w-full border-0 border-b border-transparent bg-transparent px-0 py-1 text-sm text-slate-700 outline-none transition focus-visible:border-slate-300 motion-reduce:transition-none"
        @input="emitAlt(($event.target as HTMLInputElement).value)"
      />
      <span v-else class="text-sm text-slate-700">{{ payload.alt }}</span>
    </figcaption>
  </figure>
</template>
