<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    initials: string
    size?: 'sm' | 'md' | 'lg'
    /** Fond CSS pour l'état "sans image" (ex. dégradé de marque d'une chaîne). Par défaut : `bg-accent`. */
    background?: string
  }>(),
  {
    src: undefined,
    alt: 'Photo de profil',
    size: 'md',
    background: undefined,
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
    class="flex shrink-0 items-center justify-center overflow-hidden font-semibold text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.9)]"
    :class="[sizeClasses[props.size], props.src || props.background ? '' : 'bg-accent']"
    :style="!props.src && props.background ? { background: props.background } : undefined"
  >
    <img v-if="props.src" :src="props.src" :alt="props.alt" class="h-full w-full object-cover" />
    <span v-else>{{ props.initials }}</span>
  </div>
</template>
