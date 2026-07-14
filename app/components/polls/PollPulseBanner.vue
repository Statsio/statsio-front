<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue'

defineProps<{
  question: string
  options: { label: string; pct: number }[]
  voteCount: number
  windowLabel?: string
}>()

const barColor = (index: number) => (index === 0 ? 'var(--color-primary)' : 'var(--color-accent)')
</script>

<template>
  <div class="flex flex-col gap-8 rounded-[1.5rem] bg-slate-950 p-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
    <div class="max-w-md">
      <AppBadge variant="dark" mono>Sondage du jour</AppBadge>
      <p class="mt-2.5 text-lg font-bold leading-snug text-white sm:text-xl">{{ question }}</p>
    </div>
    <div class="flex w-full flex-col gap-2 sm:w-80">
      <div v-for="(option, index) in options" :key="option.label" class="flex items-center gap-2.5">
        <span class="w-12 shrink-0 text-xs text-white">{{ option.label }}</span>
        <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full transition-all" :style="{ width: `${option.pct}%`, backgroundColor: barColor(index) }" />
        </div>
        <span class="mono w-10 shrink-0 text-right text-xs text-white">{{ option.pct }}%</span>
      </div>
      <p class="mt-1 text-[11px] text-white/50">
        {{ voteCount.toLocaleString('fr-FR') }} votes<span v-if="windowLabel"> · {{ windowLabel }}</span>
      </p>
    </div>
  </div>
</template>
