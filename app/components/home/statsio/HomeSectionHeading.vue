<script setup lang="ts">
import { RouterLink } from 'vue-router'

withDefaults(
  defineProps<{
    eyebrow: string
    eyebrowColor?: string
    title: string
    allLabel?: string
    allTo?: string
  }>(),
  { eyebrowColor: 'var(--color-primary)' },
)
</script>

<template>
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <span
        class="font-mono text-[10px] font-semibold tracking-[0.11em]"
        :style="{ color: eyebrowColor }"
      >
        {{ eyebrow }}
      </span>
      <h2 class="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-slate-950 text-pretty sm:text-[28px]">
        {{ title }}
      </h2>
    </div>
    <RouterLink
      v-if="allTo && allLabel"
      :to="allTo"
      class="shrink-0 text-[13.5px] font-bold text-primary transition hover:opacity-70"
    >
      {{ allLabel }} →
    </RouterLink>
  </div>
</template>
