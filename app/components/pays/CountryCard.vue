<script setup lang="ts">
import { isoToFlagEmoji } from '@/utils/flag'
import { formatCompactNumber } from '@/utils/number'

defineProps<{
  iso3: string
  iso2: string
  name: string
  region: string
  population: number
}>()
</script>

<template>
  <NuxtLink :to="`/medistats/pays/${iso3}`" class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
    <div class="flex items-center justify-between gap-2.5">
      <div class="flex min-w-0 items-center gap-2.5">
        <span
          class="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-base"
          aria-hidden="true"
        >
          {{ isoToFlagEmoji(iso2) }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-[13.5px] font-bold text-slate-900">{{ name }}</p>
          <p class="truncate text-[11px] text-slate-400">{{ region }} · {{ formatCompactNumber(population) }} hab.</p>
        </div>
      </div>
      <span class="mono shrink-0 rounded-lg bg-[var(--color-primary)]/10 px-2 py-1 text-xs font-bold text-[var(--color-primary)]">
        {{ iso3 }}
      </span>
    </div>

    <slot name="body" />
    <slot name="footer" />
  </NuxtLink>
</template>
