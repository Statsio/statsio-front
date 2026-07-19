<script setup lang="ts">
import { computed } from 'vue'
import { PASSWORD_STRENGTH_COLORS, PASSWORD_STRENGTH_LABELS } from '@/lib/password-strength'

const props = defineProps<{ strength: number; hasPassword: boolean }>()

const bars = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    color: i < props.strength ? PASSWORD_STRENGTH_COLORS[Math.max(0, props.strength - 1)] : 'rgba(20,20,30,0.09)',
  })),
)

const label = computed(() => (props.hasPassword ? PASSWORD_STRENGTH_LABELS[Math.max(0, props.strength - 1)] : ' '))
</script>

<template>
  <div>
    <div class="flex gap-1">
      <span
        v-for="(bar, i) in bars"
        :key="i"
        class="h-1 flex-1 rounded-full transition-colors duration-200"
        :style="{ background: bar.color }"
      />
    </div>
    <p class="mt-1.5 text-[11.5px] text-slate-950/45">{{ label }}</p>
  </div>
</template>
