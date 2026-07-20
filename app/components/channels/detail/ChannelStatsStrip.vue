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
  <div class="flex gap-8 border-b border-[#18181f]/[0.08] pb-4 pt-7">
    <div v-for="stat in stats" :key="stat.label">
      <p class="font-mono text-[18px] font-semibold text-[#18181f]">{{ stat.value }}</p>
      <p class="mt-1 text-[11.5px] text-[#18181f]/50">{{ stat.label }}</p>
    </div>
  </div>
</template>
