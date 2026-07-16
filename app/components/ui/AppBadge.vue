<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'soft-primary' | 'live' | 'outline' | 'dark'
    mono?: boolean
    dot?: boolean
  }>(),
  {
    variant: 'soft-primary',
    mono: false,
    dot: false,
  },
)

const variantClasses = {
  'soft-primary': 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  live: 'bg-emerald-50 text-emerald-600',
  outline: 'border border-slate-200 bg-white text-slate-600',
  dark: 'border border-white/20 bg-white/10 text-white',
} as const
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
    :class="[variantClasses[variant], mono ? 'mono normal-case tracking-wider' : '']"
  >
    <span v-if="dot" class="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-current" aria-hidden="true" />
    <slot />
  </span>
</template>
