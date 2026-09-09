<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'ou' })
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="h-px flex-1 bg-slate-900/[0.09]" />
    <span class="text-xs text-slate-950/40">{{ label }}</span>
    <div class="h-px flex-1 bg-slate-900/[0.09]" />
  </div>
</template>
