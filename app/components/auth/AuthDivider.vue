<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'ou' })
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="h-px flex-1 bg-slate-100" />
    <span class="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">{{ label }}</span>
    <div class="h-px flex-1 bg-slate-100" />
  </div>
</template>
