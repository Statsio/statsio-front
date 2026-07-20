<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { PollStatus } from '@/lib/poll-status'
import { getCategoryStripeBackground } from '@/lib/poll-visuals'

const props = withDefaults(
  defineProps<{
    to: string
    category: string
    questionType: string
    question: string
    status: PollStatus
    options: { label: string; pct: number }[]
    totalVotes: number
    size?: 'hero' | 'medium'
  }>(),
  { size: 'medium' },
)

const background = computed(() => getCategoryStripeBackground(props.category, props.size === 'hero' ? 14 : 8))
const topOptions = computed(() => props.options.slice(0, 2))
</script>

<template>
  <RouterLink
    :to="to"
    class="relative block h-full overflow-hidden rounded-2xl"
    :style="{ background }"
  >
    <div
      class="absolute inset-0 flex flex-col justify-end"
      :class="size === 'hero' ? 'p-6' : 'p-4'"
      style="background: linear-gradient(0deg, rgba(20, 10, 40, 0.85), rgba(20, 10, 40, 0.1) 60%)"
    >
      <span
        class="font-bold uppercase tracking-wide text-white/85"
        :class="size === 'hero' ? 'text-[11px]' : 'text-[10px]'"
      >
        {{ category }} · {{ questionType }}
      </span>
      <p
        class="font-bold leading-tight text-white"
        :class="size === 'hero' ? 'mb-3.5 mt-2 text-xl' : 'mb-2 mt-1 text-[13.5px]'"
      >
        {{ question }}
      </p>
      <div class="flex flex-col gap-1.5">
        <div v-for="opt in topOptions" :key="opt.label" class="flex items-center gap-2.5">
          <span
            class="flex-none overflow-hidden text-ellipsis whitespace-nowrap text-white"
            :class="size === 'hero' ? 'w-28 text-xs' : 'w-[74px] text-[10.5px]'"
          >
            {{ opt.label }}
          </span>
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
            <div class="h-full rounded-full bg-white" :style="{ width: `${opt.pct}%` }" />
          </div>
          <span
            class="font-mono flex-none text-right text-white"
            :class="size === 'hero' ? 'w-9 text-[11.5px]' : 'w-6 text-[10px]'"
          >
            {{ opt.pct }}%
          </span>
        </div>
      </div>
      <div class="mt-2.5 text-white/70" :class="size === 'hero' ? 'text-xs' : 'text-[10.5px]'">
        {{ status.label }} · {{ totalVotes }} vote<span v-if="totalVotes > 1">s</span>
      </div>
    </div>
  </RouterLink>
</template>
