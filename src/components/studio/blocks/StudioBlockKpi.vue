<script setup lang="ts">
import { computed } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'

type Payload = {
  type: 'kpi'
  label: string
  value: string
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'slate'
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
  const t = props.payload.tone ?? 'primary'
  if (t === 'success') return 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
  if (t === 'warning') return 'border-amber-200 bg-amber-50/60 text-amber-950'
  if (t === 'danger') return 'border-rose-200 bg-rose-50/50 text-rose-950'
  if (t === 'slate') return 'border-slate-200 bg-slate-50/70 text-slate-950'
  return 'border-[color:var(--color-primary)]/20 bg-[color:var(--color-primary)]/5 text-slate-950'
})

const patch = (p: Partial<Payload>) => {
  emit('update:payload', { ...props.payload, ...p })
}

const toneSelectOptions = [
  { value: 'primary', label: 'Primary' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
  { value: 'slate', label: 'Slate' },
]
</script>

<template>
  <div class="content-block content-block--kpi">
    <div class="rounded-2xl border px-4 py-4" :class="toneClass">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <label class="sr-only" :for="`${fieldId}-kpi-label`">Libellé KPI</label>
          <input
            v-if="editable"
            :id="`${fieldId}-kpi-label`"
            :value="payload.label"
            class="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 outline-none focus:border-slate-200 focus:bg-white/70"
            @input="patch({ label: ($event.target as HTMLInputElement).value })"
          />
          <p v-else class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{{ payload.label }}</p>

          <label class="sr-only" :for="`${fieldId}-kpi-value`">Valeur KPI</label>
          <input
            v-if="editable"
            :id="`${fieldId}-kpi-value`"
            :value="payload.value"
            class="mt-2 w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-3xl font-semibold tracking-tight text-slate-950 outline-none focus:border-slate-200 focus:bg-white/70"
            @input="patch({ value: ($event.target as HTMLInputElement).value })"
          />
          <p v-else class="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{{ payload.value }}</p>
        </div>

        <AppSelect
          v-if="editable"
          :model-value="payload.tone ?? 'primary'"
          :options="toneSelectOptions"
          size="sm"
          button-class="h-9 min-h-0 rounded-xl bg-white/85 px-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20"
          panel-class="mt-1"
          aria-label="Ton KPI"
          @change="(v) => patch({ tone: String(v) as Payload['tone'] })"
        />
      </div>
    </div>
  </div>
</template>

