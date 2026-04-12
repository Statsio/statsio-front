<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { studioDataSourcesKey } from '@/lib/studio-inject-keys'
import type { StudioBlockDataBinding } from '@/types/studio-data-source'
import { resolveTableFromBinding } from '@/types/studio-data-source'

type Payload = { type: 'table'; caption: string; dataBinding: StudioBlockDataBinding }

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
  emit('update:payload', { type: 'table', caption, dataBinding: { ...props.payload.dataBinding } })
}

const table = computed(() => resolveTableFromBinding(props.payload.dataBinding, sources.value))
</script>

<template>
  <figure class="content-block content-block--table my-2">
    <figcaption class="mb-3">
      <label class="sr-only" :for="`${fieldId}-tbl`">Titre du tableau</label>
      <input
        v-if="editable"
        :id="`${fieldId}-tbl`"
        :value="payload.caption"
        type="text"
        class="w-full border-0 border-b border-transparent bg-transparent px-0 py-1 text-base font-semibold tracking-tight text-slate-900 outline-none transition focus-visible:border-slate-300 motion-reduce:transition-none"
        @input="emitCaption(($event.target as HTMLInputElement).value)"
      />
      <span v-else class="text-base font-semibold tracking-tight text-slate-900">{{ payload.caption }}</span>
    </figcaption>
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table v-if="table.headers.length" class="w-full border-collapse text-left text-sm text-slate-700">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50">
            <th
              v-for="h in table.headers"
              :key="h"
              scope="col"
              class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              {{ h }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in table.rows" :key="ri" class="border-b border-slate-100 last:border-0">
            <td v-for="(cell, ci) in row" :key="ci" class="px-4 py-3 text-slate-700">
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="px-4 py-10 text-center text-sm text-slate-500">
        Sélectionnez une source et les colonnes à afficher dans le panneau de droite.
      </div>
    </div>
  </figure>
</template>
