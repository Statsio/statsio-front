<script setup lang="ts">
import { formatRowCount } from '@/utils/statsDataFormat'

defineProps<{
  datasets: { id: string; name: string; row_count?: number }[]
}>()
</script>

<template>
  <div v-if="datasets.length > 0" class="rounded-2xl border border-[#18181f]/[0.08] bg-white px-5 py-5">
    <p class="mb-3.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#18181f]/45">Sources de données</p>
    <div class="flex flex-col gap-3">
      <div v-for="dataset in datasets" :key="dataset.id" class="flex items-center justify-between gap-3">
        <span class="truncate text-[13px] font-semibold text-[#18181f]">{{ dataset.name }}</span>
        <span v-if="formatRowCount(dataset.row_count)" class="mono shrink-0 text-[11.5px] text-[#18181f]/45">{{ formatRowCount(dataset.row_count) }}</span>
      </div>
    </div>
  </div>
</template>
