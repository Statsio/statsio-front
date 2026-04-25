<script setup lang="ts">
import { computed } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const props = defineProps<{
  fieldId: string
  pageIndex: number
  pageSize: number
  pageSizeOptions?: number[]
  hasNextPage: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:pageIndex': [number]
  'update:pageSize': [number]
  'refresh': []
}>()

const pageSizeOptions = computed(() => props.pageSizeOptions ?? [100, 500, 1000, 5000, 10000])
const pageSizeSelectOptions = computed(() => pageSizeOptions.value.map((n) => ({ value: n, label: `${n} lignes` })))

const canPageBack = computed(() => props.pageIndex > 0 && !props.disabled)
const canPageNext = computed(() => props.hasNextPage && !props.disabled)

const goPrev = () => {
  if (!canPageBack.value) return
  emit('update:pageIndex', Math.max(0, props.pageIndex - 1))
  emit('refresh')
}
const goNext = () => {
  if (!canPageNext.value) return
  emit('update:pageIndex', props.pageIndex + 1)
  emit('refresh')
}
const onPageSizeChange = (v: unknown) => {
  emit('update:pageSize', Number(v))
  emit('update:pageIndex', 0)
  emit('refresh')
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-[11px] font-semibold text-slate-600">Pagination</span>
      <label class="sr-only" :for="`${fieldId}-tbl-page-size`">Taille de page</label>
      <AppSelect
        :id="`${fieldId}-tbl-page-size`"
        :model-value="pageSize"
        :options="pageSizeSelectOptions"
        size="sm"
        button-class="min-h-0 rounded-xl bg-white px-2 py-1 text-xs focus:ring-2 focus:ring-primary/20"
        panel-class="mt-1"
        aria-label="Taille de page"
        @change="onPageSizeChange"
      />
      <span class="text-[11px] text-slate-500">Page {{ pageIndex + 1 }}</span>
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        class="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
        :disabled="!canPageBack"
        @click="goPrev"
      >
        Précédent
      </button>
      <button
        type="button"
        class="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
        :disabled="!canPageNext"
        @click="goNext"
      >
        Suivant
      </button>
    </div>
  </div>
</template>

