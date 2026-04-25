<script setup lang="ts">
withDefaults(
  defineProps<{
    class?: string
  }>(),
  {
    class: 'h-[22px] w-[22px]',
  },
)
</script>

<template>
  <svg viewBox="0 0 24 24" :class="class" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="3.5" y="4" width="17" height="14.5" rx="3.2" class="fill-current opacity-20" />
    <rect x="6.3" y="7" width="5.1" height="4.1" rx="0.9" class="fill-current opacity-90" />
    <rect x="12.5" y="7" width="5.1" height="4.1" rx="0.9" class="fill-current opacity-65" />
    <rect x="6.3" y="12.2" width="11.3" height="3.3" rx="0.9" class="fill-current opacity-45" />
    <path d="M9.2 20.3H14.8" class="stroke-current opacity-85" stroke-width="1.8" stroke-linecap="round" />
  </svg>
</template>
