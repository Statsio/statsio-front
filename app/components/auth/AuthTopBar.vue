<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'dark' | 'light' }>(), { variant: 'dark' })
</script>

<template>
  <NuxtLink
    to="/"
    class="inline-flex items-center gap-1.5 text-[13px] font-semibold transition"
    :class="
      variant === 'light'
        ? 'text-slate-950/45 hover:text-[var(--color-primary)]'
        : 'text-white/60 hover:text-white'
    "
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
    Retour à l'accueil
  </NuxtLink>
</template>
