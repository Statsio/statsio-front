<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBlockData } from '@/composables/useBlockData'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock }>()

const { data, isLoading, error } = useBlockData(() => props.block)
const page = ref(0)

const pageSize = computed(() => props.block.config.pageSize ?? 10)

const visibleColumns = computed(() => {
  const cols = props.block.fieldMapping.columns
  if (cols && cols.length > 0) return cols
  return data.value?.columns ?? []
})

const pagedRows = computed(() => {
  const rows = data.value?.rows ?? []
  if (!props.block.config.showPagination) return rows.slice(0, 50)
  const start = page.value * pageSize.value
  return rows.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  const rows = data.value?.rows ?? []
  return Math.ceil(rows.length / pageSize.value)
})

function sortBy(col: string) {
  // Client-side sort on visible data only — full sort requires backend query
  if (!data.value) return
  const sorted = [...data.value.rows].sort((a, b) => {
    const av = String(a[col] ?? '')
    const bv = String(b[col] ?? '')
    return av.localeCompare(bv, undefined, { numeric: true })
  })
  data.value.rows = sorted
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <span class="text-sm text-slate-400">Chargement…</span>
    </div>

    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!block.datasetId" class="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C6 8.496 6.504 9 7.125 9h9.75c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H7.125Z" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <template v-else>
      <div class="flex-1 overflow-auto">
        <table class="w-full text-xs border-collapse">
          <thead class="sticky top-0 bg-white z-10">
            <tr>
              <th
                v-for="col in visibleColumns"
                :key="col"
                class="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 cursor-pointer hover:text-slate-900 whitespace-nowrap"
                @click="block.config.sortable && sortBy(col)"
              >
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in pagedRows"
              :key="i"
              class="hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <td
                v-for="col in visibleColumns"
                :key="col"
                class="px-3 py-2 text-slate-700 font-mono"
              >
                {{ row[col] ?? '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="block.config.showPagination && totalPages > 1" class="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-white shrink-0">
        <span class="text-xs text-slate-400">Page {{ page + 1 }} / {{ totalPages }}</span>
        <div class="flex gap-1">
          <button class="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50" :disabled="page === 0" @click="page--">←</button>
          <button class="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50" :disabled="page >= totalPages - 1" @click="page++">→</button>
        </div>
      </div>
    </template>
  </div>
</template>
