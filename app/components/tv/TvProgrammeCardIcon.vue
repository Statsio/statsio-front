<script setup lang="ts">
withDefaults(
  defineProps<{
    kind: 'programme'
    class?: string
  }>(),
  {
    class: 'h-5 w-5',
  },
)
</script>

<template>
  <svg
    v-if="kind === 'programme'"
    viewBox="0 0 24 24"
    :class="$props.class"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="4" y="5.5" width="16" height="11" rx="2.5" class="fill-secondary" />
    <path d="M9 18.5H15" class="stroke-primary" stroke-width="1.8" stroke-linecap="round" />
    <path d="M8.75 3.75L11 5.5M15.25 3.75L13 5.5" class="stroke-accent" stroke-width="1.6" stroke-linecap="round" />
    <rect x="7.25" y="8.25" width="6.5" height="5.5" rx="1.2" class="fill-primary" />
    <path d="M15.75 8.75V13.25M17.5 10.25V11.75" class="stroke-accent" stroke-width="1.5" stroke-linecap="round" />
  </svg>
</template>
