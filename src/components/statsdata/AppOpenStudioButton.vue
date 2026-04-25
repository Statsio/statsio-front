<script setup lang="ts">
import StudioGlyphIcon from '@/components/studio/StudioGlyphIcon.vue'

withDefaults(
  defineProps<{
    to: string
    label?: string
    size?: 'sm' | 'md'
  }>(),
  {
    label: 'Ouvrir dans Studio',
    size: 'md',
  },
)
</script>

<template>
  <RouterLink
    :to="to"
    class="group inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 font-semibold text-primary transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
    :class="size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'"
  >
    <StudioGlyphIcon :class="size === 'sm' ? 'h-[18px] w-[18px] shrink-0' : 'h-[22px] w-[22px] shrink-0'" />
    <span>{{ label }}</span>
  </RouterLink>
</template>
