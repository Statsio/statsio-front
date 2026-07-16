<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBlockData } from '@/composables/useBlockData'
import { formatDisplayValue } from '@/utils/statsDataFormat'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const { data, isLoading, error } = useBlockData(() => props.block, props.readonly)
const page = ref(0)

const pageSize = computed(() => props.block.config.pageSize ?? 10)

const visibleColumns = computed(() => {
  const cols = props.block.fieldMapping.columns
  if (cols && cols.length > 0) return cols
  return data.value?.columns ?? []
})

function columnLabel(col: string) {
  return props.block.fieldMapping.columnLabels?.[col] ?? col
}

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
  <div class="w-full">
    <div v-if="isLoading" class="flex items-center justify-center py-10">
      <span class="text-sm text-slate-400">Chargement…</span>
    </div>

    <div v-else-if="error" class="flex items-center justify-center py-10">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!block.datasetId" class="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C6 8.496 6.504 9 7.125 9h9.75c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H7.125Z" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <template v-else>
      <div class="overflow-x-auto px-5 pb-5">
        <table class="w-full min-w-[480px] border-collapse">
          <thead class="sticky top-0 z-10">
            <tr>
              <th
                v-for="col in visibleColumns"
                :key="col"
                class="mono px-3 py-2 text-left text-[11px] font-bold text-[#18181f]/60 bg-[#f7f6fb] whitespace-nowrap select-none first:rounded-l-md last:rounded-r-md"
                :class="block.config.sortable ? 'cursor-pointer hover:text-[#18181f] transition-colors' : ''"
                @click="block.config.sortable && sortBy(col)"
              >
                <span class="flex items-center gap-1">
                  {{ columnLabel(col) }}
                  <svg v-if="block.config.sortable" class="w-3 h-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in pagedRows"
              :key="i"
              class="group border-b border-[#18181f]/[0.06] last:border-0 transition-colors hover:bg-[var(--color-primary)]/[0.025]"
            >
              <td
                v-for="col in visibleColumns"
                :key="col"
                class="mono px-3 py-2.5 text-xs whitespace-nowrap"
                :class="typeof row[col] === 'number' ? 'font-semibold text-[#18181f]' : 'text-[#18181f]/70'"
              >
                {{ formatDisplayValue(row[col]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="block.config.showPagination && totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-[#18181f]/[0.06]">
        <span class="mono text-xs text-[#18181f]/45">Page <span class="font-semibold text-[#18181f]/70">{{ page + 1 }}</span> / {{ totalPages }}</span>
        <div class="flex gap-1.5">
          <button
            class="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            :disabled="page === 0"
            @click="page--"
          >←</button>
          <button
            class="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            :disabled="page >= totalPages - 1"
            @click="page++"
          >→</button>
        </div>
      </div>
    </template>
  </div>
</template>
