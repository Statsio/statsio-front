<script setup lang="ts">
import AppTooltip from '@/components/ui/AppTooltip.vue'
import { CHANNEL_BADGE_LABELS } from '@/api/channels'

withDefaults(defineProps<{ size?: 'sm' | 'md' }>(), { size: 'md' })
</script>

<template>
  <AppTooltip :text="CHANNEL_BADGE_LABELS['verified']!">
    <svg viewBox="0 0 100 100" :class="size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'" class="shrink-0" aria-hidden="true">
      <polygon
        points="50.00,4.00 59.58,14.26 73.00,10.16 76.16,23.84 89.84,27.00 85.74,40.42 96.00,50.00 85.74,59.58 89.84,73.00 76.16,76.16 73.00,89.84 59.58,85.74 50.00,96.00 40.42,85.74 27.00,89.84 23.84,76.16 10.16,73.00 14.26,59.58 4.00,50.00 14.26,40.42 10.16,27.00 23.84,23.84 27.00,10.16 40.42,14.26"
        fill="var(--color-primary)"
      />
      <path
        d="M32 51.5 L44.5 64 L69 38"
        fill="none"
        stroke="white"
        stroke-width="8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </AppTooltip>
</template>
