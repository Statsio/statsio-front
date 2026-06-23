<script setup lang="ts">
import { computed } from 'vue'
import { CHANNEL_CHART_COLORS } from '@/composables/useTvAudiences'
import type { YearDataWithChannel } from '@/composables/useTvAudiences'

const props = defineProps<{
  data: YearDataWithChannel[]
  year: number
  maxPda: number
}>()

const logoFailed = defineModel<Record<string, boolean>>('logoFailed', { default: () => ({}) })

const withRank = computed(() =>
  props.data.map((d, idx) => ({ ...d, rank: idx + 1 }))
)
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div class="border-b border-slate-100 px-5 py-4">
      <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Classement {{ year }}</p>
    </div>

    <div class="divide-y divide-slate-50">
      <div
        v-for="row in withRank"
        :key="row.channelId"
        class="flex items-center gap-3 px-4 py-3 transition-colors"
        :class="row.rank === 1 ? 'bg-tvstats-soft/20' : 'hover:bg-slate-50'"
      >
        <!-- Rank -->
        <span
          class="w-5 shrink-0 text-center text-xs font-bold"
          :class="row.rank === 1 ? 'text-tvstats-primary' : 'text-slate-400'"
        >
          {{ row.rank }}
        </span>

        <!-- Logo -->
        <div class="flex h-8 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-1">
          <img
            v-if="!logoFailed[row.channelId]"
            :src="row.channel.logoUrl"
            :alt="row.channel.displayName"
            class="h-full w-full object-contain"
            loading="lazy"
            @error="logoFailed[row.channelId] = true"
          />
          <span
            v-else
            class="flex h-full w-full items-center justify-center rounded text-[9px] font-bold text-white"
            :class="row.channel.fallbackBg"
          >
            {{ row.channel.displayName.slice(0, 2).toUpperCase() }}
          </span>
        </div>

        <!-- Name + bar -->
        <div class="min-w-0 flex-1">
          <p class="mb-1 truncate text-xs font-semibold text-slate-800">{{ row.channel.displayName }}</p>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{
                width: `${(row.pda / maxPda) * 100}%`,
                backgroundColor: CHANNEL_CHART_COLORS[row.channelId] ?? '#94a3b8',
              }"
            />
          </div>
        </div>

        <!-- PDA -->
        <span
          class="shrink-0 text-sm font-bold tabular-nums"
          :class="row.rank === 1 ? 'text-tvstats-primary' : 'text-slate-700'"
        >
          {{ row.pda.toFixed(1) }}%
        </span>
      </div>
    </div>
  </div>
</template>
