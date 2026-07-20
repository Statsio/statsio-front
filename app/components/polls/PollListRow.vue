<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
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

const topOption = computed(() => [...props.options].sort((a, b) => b.pct - a.pct)[0])
</script>

<template>
  <RouterLink
    :to="to"
    class="flex items-center gap-5 border-b border-[#18181f]/[0.07] py-4 no-underline"
  >
    <div class="min-w-0 flex-1">
      <span class="text-[10.5px] font-bold uppercase tracking-wide text-primary">{{ category }} · {{ questionType }}</span>
      <p class="mt-1 text-[14.5px] font-bold leading-tight text-[#18181f]">{{ question }}</p>
    </div>

    <div class="flex w-56 flex-none flex-col gap-1.5">
      <div class="flex h-2 overflow-hidden rounded-full">
        <div
          v-for="(opt, i) in options"
          :key="opt.label"
          class="h-full"
          :style="{ width: `${opt.pct}%`, background: getOptionColor(i) }"
        />
      </div>
      <span v-if="topOption" class="text-[11.5px] text-[#18181f]/55">
        Tête : <span class="font-bold text-[#18181f]">{{ topOption.label }} {{ topOption.pct }}%</span>
      </span>
    </div>

    <div class="flex w-24 flex-none flex-col items-end gap-1">
      <span class="text-xs text-[#18181f]/45">{{ status.label }}</span>
      <span class="font-mono text-[11.5px] text-[#18181f]/50">{{ totalVotes }} vote<span v-if="totalVotes > 1">s</span></span>
    </div>
  </RouterLink>
</template>
