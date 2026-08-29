<script setup lang="ts">
import { computed } from 'vue'
import { freshnessLabel, type DatasetFreshness } from '@/lib/statsdata-freshness'

const props = defineProps<{ dataset: DatasetFreshness; compact?: boolean }>()

const label = computed(() => freshnessLabel(props.dataset))

const dotClass = computed(() => ({
  live: 'bg-emerald-500',
  fresh: 'bg-emerald-500',
  stale: 'bg-amber-500',
  unknown: 'bg-slate-300',
}[label.value?.tone ?? 'unknown']))
</script>

<template>
  <span
    v-if="label"
    class="inline-flex items-center gap-1.5 text-[11.5px] text-[#18181f]/50"
    :title="label.detail"
  >
    <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="dotClass" />
    <span>{{ label.text }}</span>
    <span v-if="label.detail && !compact" class="text-[#18181f]/35">· {{ label.detail }}</span>
  </span>
</template>
