<script setup lang="ts">
import { computed } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'

type Payload = {
  type: 'callout'
  title: string
  text: string
  tone?: 'info' | 'success' | 'warning' | 'danger'
}

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

const toneClass = computed(() => {
  const t = props.payload.tone ?? 'info'
  if (t === 'success') return 'border-emerald-200 bg-emerald-50/50'
  if (t === 'warning') return 'border-amber-200 bg-amber-50/60'
  if (t === 'danger') return 'border-rose-200 bg-rose-50/50'
  return 'border-sky-200 bg-sky-50/60'
})

const patch = (p: Partial<Payload>) => emit('update:payload', { ...props.payload, ...p })

const toneSelectOptions = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
]
</script>

<template>
  <div class="content-block content-block--callout">
    <div class="rounded-2xl border px-4 py-4" :class="toneClass">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <label class="sr-only" :for="`${fieldId}-callout-title`">Titre encadré</label>
          <input
            v-if="editable"
            :id="`${fieldId}-callout-title`"
            :value="payload.title"
            class="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-slate-900 outline-none focus:border-slate-200 focus:bg-white/70"
            @input="patch({ title: ($event.target as HTMLInputElement).value })"
          />
          <p v-else class="text-sm font-semibold text-slate-900">{{ payload.title }}</p>

          <label class="sr-only" :for="`${fieldId}-callout-text`">Texte encadré</label>
          <textarea
            v-if="editable"
            :id="`${fieldId}-callout-text`"
            :value="payload.text"
            rows="2"
            class="mt-2 w-full resize-y rounded-xl border border-transparent bg-transparent px-2 py-1 text-sm leading-relaxed text-slate-700 outline-none focus:border-slate-200 focus:bg-white/70"
            @input="patch({ text: ($event.target as HTMLTextAreaElement).value })"
          />
          <p v-else class="mt-2 text-sm leading-relaxed text-slate-700">{{ payload.text }}</p>
        </div>

        <AppSelect
          v-if="editable"
          :model-value="payload.tone ?? 'info'"
          :options="toneSelectOptions"
          size="sm"
          button-class="h-9 min-h-0 rounded-xl bg-white/85 px-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20"
          panel-class="mt-1"
          aria-label="Ton encadré"
          @change="(v) => patch({ tone: String(v) as Payload['tone'] })"
        />
      </div>
    </div>
  </div>
</template>

