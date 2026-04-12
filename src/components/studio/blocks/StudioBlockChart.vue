<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { studioDataSourcesKey } from '@/lib/studio-inject-keys'
import type { StudioBlockDataBinding } from '@/types/studio-data-source'
import { resolveChartSeriesFromBinding } from '@/types/studio-data-source'

type Payload = { type: 'chart'; caption: string; dataBinding: StudioBlockDataBinding }

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

const sources = inject(studioDataSourcesKey, ref([]))

const emitCaption = (caption: string) => {
  emit('update:payload', { type: 'chart', caption, dataBinding: { ...props.payload.dataBinding } })
}

const series = computed(() => resolveChartSeriesFromBinding(props.payload.dataBinding, sources.value))

const maxVal = computed(() => {
  const v = series.value.values
  if (!v.length) return 1
  return Math.max(...v, 1)
})
</script>

<template>
  <figure class="content-block content-block--chart my-2">
    <div
      class="flex aspect-[16/9] max-h-[min(22rem,55vw)] flex-col rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,#fafbfc_0%,#f1f5f9_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
      role="img"
      :aria-label="payload.caption"
    >
      <template v-if="series.labels.length && series.values.length">
        <div class="flex h-44 items-end gap-1 sm:h-48 sm:gap-2">
          <div
            v-for="(lab, i) in series.labels"
            :key="i"
            class="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
          >
            <div
              class="w-full max-w-[3.25rem] rounded-t-md bg-[color-mix(in_srgb,var(--color-primary)_78%,white)] transition-[height] motion-reduce:transition-none"
              :style="{ height: `${Math.round(Math.max(6, (series.values[i]! / maxVal) * 168))}px` }"
              :title="`${lab}: ${series.values[i]}`"
            />
            <span class="max-w-full truncate text-center text-[10px] font-medium text-slate-500 sm:text-xs">{{ lab }}</span>
          </div>
        </div>
      </template>
      <div v-else class="flex flex-1 flex-col items-center justify-center text-center">
        <span class="text-sm font-medium text-slate-500">Graphique</span>
        <span class="mt-1 max-w-[90%] text-xs leading-relaxed text-slate-400">
          Choisissez une source et les champs dans le panneau de droite.
        </span>
      </div>
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
