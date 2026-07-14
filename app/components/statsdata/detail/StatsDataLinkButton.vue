<script setup lang="ts">
import { RouterLink } from 'vue-router'

withDefaults(
  defineProps<{
    to: string
    size?: 'sm' | 'md'
    fullWidth?: boolean
  }>(),
  { size: 'md', fullWidth: false },
)
</script>

<template>
  <RouterLink
    :to="to"
    class="flex items-center gap-2 shrink-0 whitespace-nowrap rounded-[10px] border-[1.5px] border-[#18181f]/15 bg-white font-bold text-[#18181f] transition-colors hover:border-[#18181f]/25"
    :class="[
      size === 'sm' ? 'px-4 py-2.5 text-[13.5px]' : 'px-[22px] py-3 text-[14px]',
      fullWidth ? 'w-full justify-center' : '',
    ]"
  >
    <slot name="icon" />
    <slot />
  </RouterLink>
</template>
