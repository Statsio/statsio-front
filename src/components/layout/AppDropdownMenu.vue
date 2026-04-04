<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    align?: 'left' | 'right'
    widthClass?: string
  }>(),
  {
    align: 'right',
    widthClass: 'min-w-[220px]',
  },
)
</script>

<template>
  <div
    :class="[
      'absolute top-[calc(100%+0.75rem)] z-50 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]',
      align === 'left' ? 'left-0' : 'right-0',
      widthClass,
    ]"
    role="menu"
    :aria-label="label"
  >
    <slot />
  </div>
</template>
