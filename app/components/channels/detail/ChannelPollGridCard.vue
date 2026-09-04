<script setup lang="ts">
import { computed } from 'vue'
import type { PollStatus } from '@/lib/poll-status'
import { getOptionColor } from '@/lib/poll-visuals'

const props = defineProps<{
  to: string
  category: string
  questionType: string
  question: string
  status: PollStatus
  options: { label: string; pct: number }[]
  totalVotes: number
}>()

const topOptions = computed(() => props.options.slice(0, 2))
</script>

<template>
  <RouterLink :to="to" class="u-card card block px-6 py-6 no-underline hover:-translate-y-0.5">
    <span class="text-[10.5px] font-bold uppercase tracking-[0.08em] text-primary">{{ category }} · {{ questionType }}</span>
    <p class="u-card-title mb-4 mt-2.5 text-[17px] font-bold leading-[1.3] text-[#18181f]">{{ question }}</p>

    <div v-if="topOptions.length" class="mb-2.5 flex h-2.5 w-full overflow-hidden rounded-md bg-[#18181f]/[0.07]">
      <span
        v-for="(opt, i) in topOptions"
        :key="opt.label"
        class="h-full"
        :style="{ width: `${opt.pct}%`, background: getOptionColor(i) }"
      />
    </div>
    <div v-if="topOptions.length" class="mono flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] text-[#18181f]/55">
      <span v-for="opt in topOptions" :key="opt.label">{{ opt.label }} {{ opt.pct }}%</span>
    </div>

    <p class="mt-3.5 text-[11px] text-[#18181f]/40">
      {{ status.label }} · {{ totalVotes }} vote<span v-if="totalVotes > 1">s</span>
    </p>
  </RouterLink>
</template>
