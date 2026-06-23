<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    initials: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    src: undefined,
    alt: 'Photo de profil',
    size: 'md',
  },
)

const sizeClasses = {
  sm: 'h-10 w-10 text-sm rounded-full',
  md: 'h-12 w-12 text-base rounded-full',
  lg: 'h-16 w-16 text-xl rounded-[1.5rem]',
} as const
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden bg-accent font-semibold text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.9)]"
    :class="sizeClasses[props.size]">
    <img v-if="props.src" :src="props.src" :alt="props.alt" class="h-full w-full object-cover" />
    <span v-else>{{ props.initials }}</span>
  </div>
</template>
