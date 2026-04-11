<script setup lang="ts">
type Payload = { type: 'chart'; caption: string }

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

const emitCaption = (caption: string) => {
  emit('update:payload', { type: 'chart', caption })
}
</script>

<template>
  <figure class="content-block content-block--chart my-2">
    <div
      class="flex aspect-[16/9] max-h-[min(22rem,55vw)] flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-[linear-gradient(145deg,#f8fafc_0%,#eef2ff_45%,#f1f5f9_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
      role="img"
      :aria-label="payload.caption"
    >
      <span class="text-sm font-medium text-slate-500">Graphique</span>
      <span class="mt-1 max-w-[90%] truncate text-xs text-slate-400">Données rattachées via l’API</span>
    </div>
    <figcaption class="mt-3">
      <label class="sr-only" :for="`${fieldId}-cap`">Légende</label>
      <input
        v-if="editable"
        :id="`${fieldId}-cap`"
        :value="payload.caption"
        type="text"
        class="w-full border-0 border-b border-transparent bg-transparent px-0 py-1 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus-visible:border-slate-300 motion-reduce:transition-none"
        @input="emitCaption(($event.target as HTMLInputElement).value)"
      />
      <span v-else class="text-sm font-medium text-slate-800">{{ payload.caption }}</span>
    </figcaption>
  </figure>
</template>
