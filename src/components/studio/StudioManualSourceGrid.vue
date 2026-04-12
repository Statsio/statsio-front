<script setup lang="ts">
import type { StudioDataSourceManual } from '@/types/studio-data-source'

const props = defineProps<{
  source: StudioDataSourceManual
}>()

const emit = defineEmits<{
  update: [StudioDataSourceManual]
}>()

const cell = (row: number, col: number, value: string) => {
  const rows = props.source.rows.map((r) => [...r])
  while (rows.length <= row) {
    rows.push(Array.from({ length: Math.max(...rows.map((x) => x.length), 3) }, () => ''))
  }
  const width = Math.max(rows[row]!.length, col + 1, props.source.rows[0]?.length ?? 3)
  while (rows[row]!.length < width) rows[row]!.push('')
  rows[row]![col] = value
  emit('update', { ...props.source, rows })
}

const addRow = () => {
  const w = Math.max(...props.source.rows.map((r) => r.length), props.source.rows[0]?.length ?? 3, 1)
  const rows = [...props.source.rows, Array.from({ length: w }, () => '')]
  emit('update', { ...props.source, rows })
}

const addCol = () => {
  const rows = props.source.rows.map((r) => [...r, ''])
  emit('update', { ...props.source, rows })
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table class="w-full min-w-[280px] border-collapse text-left text-xs">
      <tbody>
        <tr v-for="(row, ri) in source.rows" :key="ri">
          <td v-for="(_, ci) in row" :key="ci" class="border border-slate-200 p-0">
            <input
              :value="source.rows[ri]![ci] ?? ''"
              type="text"
              class="w-full min-w-[4.5rem] bg-transparent px-2 py-1.5 text-slate-800 outline-none focus:bg-indigo-50/50"
              @input="cell(ri, ci, ($event.target as HTMLInputElement).value)"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <div class="flex flex-wrap gap-2 border-t border-slate-100 p-2">
      <button
        type="button"
        class="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
        @click="addRow"
      >
        + Ligne
      </button>
      <button
        type="button"
        class="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
        @click="addCol"
      >
        + Colonne
      </button>
    </div>
  </div>
</template>
