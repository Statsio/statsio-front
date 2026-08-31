<script setup lang="ts">
defineProps<{
  countLine: string
  contextLine: string
}>()
</script>

<template>
  <div class="mb-4 flex flex-wrap items-baseline justify-between gap-4">
    <p class="font-mono text-xs text-slate-500">{{ countLine }}</p>
    <p class="text-xs text-slate-400">{{ contextLine }}</p>
  </div>
</template>
