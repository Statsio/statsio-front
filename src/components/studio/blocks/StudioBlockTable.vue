<script setup lang="ts">
type Payload = { type: 'table'; caption: string }

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
  emit('update:payload', { type: 'table', caption })
}

const cols = ['Col 1', 'Col 2', 'Col 3', 'Col 4']
const placeholderRows = 3
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
      <table class="w-full border-collapse text-left text-sm text-slate-700">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50">
            <th v-for="c in cols" :key="c" scope="col" class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ c }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in placeholderRows" :key="r" class="border-b border-slate-100 last:border-0">
            <td v-for="(_, ci) in cols" :key="`${r}-${ci}`" class="px-4 py-3 text-slate-500">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>
