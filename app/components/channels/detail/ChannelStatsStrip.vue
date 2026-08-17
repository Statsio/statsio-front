<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelEntry } from '@/data/channels'
import { formatCompactNumber } from '@/lib/format'

const props = defineProps<{
  channel: ChannelEntry
  articlesCount: number
  statsDataCount: number
}>()

const stats = computed(() => [
  { label: 'Abonnés', value: formatCompactNumber(props.channel.followers) },
  { label: 'Vues', value: formatCompactNumber(props.channel.viewCount ?? 0) },
  { label: 'Articles', value: String(props.articlesCount) },
  { label: 'StatsData', value: String(props.statsDataCount) },
])
</script>

<template>
  <div
    class="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-[#18181f]/[0.09] bg-[#18181f]/[0.09] sm:grid-cols-4"
  >
    <div v-for="stat in stats" :key="stat.label" class="bg-white px-5 py-[18px] sm:px-6 sm:py-5">
      <p class="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#18181f]/45">{{ stat.label }}</p>
      <p class="mono mt-2 text-[22px] font-semibold tracking-[-0.02em] text-[#18181f] sm:text-[26px]">{{ stat.value }}</p>
    </div>
  </div>
</template>
