<script setup lang="ts">
defineProps<{
  show: boolean
}>()
</script>

<template>
  <div v-if="show" class="mb-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
    <slot />
  </div>
</template>

