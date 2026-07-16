<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'white' | 'muted' | 'dark'
  }>(),
  {
    tone: 'white',
  },
)

const toneClasses = {
  white: 'bg-white',
  muted: 'bg-slate-50',
  dark: 'bg-slate-950',
} as const
</script>

<template>
  <section :class="toneClasses[tone]">
    <div class="container section">
      <slot />
    </div>
  </section>
</template>
