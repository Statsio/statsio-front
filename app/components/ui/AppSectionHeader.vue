<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
}>()
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-6">
    <div>
      <p class="eyebrow">{{ eyebrow }}</p>
      <h2 class="mt-1 text-3xl font-semibold text-slate-900 md:text-4xl">{{ title }}</h2>
    </div>
    <slot />
  </div>
</template>
