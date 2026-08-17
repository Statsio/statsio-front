<script setup lang="ts">
import { computed } from 'vue'
import type { PollStatus } from '@/lib/poll-status'

const props = defineProps<{
  to: string
  question: string
  options: { label: string; pct: number }[]
  status: PollStatus
  totalVotes: number
}>()

const top = computed(() => props.options[0])
</script>

<template>
  <RouterLink :to="to" class="flex h-full flex-col justify-between rounded-[22px] bg-[#141420] p-6 no-underline">
    <div>
      <span class="text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/45">Sondage</span>
      <p class="mb-4 mt-2.5 text-[17px] font-bold leading-[1.3] text-white">{{ question }}</p>
    </div>

    <div v-if="top">
      <div class="mb-2.5 flex h-2.5 w-full overflow-hidden rounded-md bg-white/10">
        <span class="h-full rounded-md bg-[linear-gradient(90deg,#8b5cf6,#3b82f6)]" :style="{ width: `${top.pct}%` }" />
      </div>
      <div class="mono flex justify-between text-[11px] text-white/60">
        <span>{{ top.label }} {{ top.pct }}%</span>
        <span>{{ totalVotes }} vote<span v-if="totalVotes > 1">s</span></span>
      </div>
    </div>
    <p v-else class="mono text-[11px] text-white/40">{{ status.label }}</p>
  </RouterLink>
</template>
