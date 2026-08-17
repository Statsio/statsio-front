<script setup lang="ts">
defineProps<{
  channelName: string
}>()
</script>

<template>
  <nav class="flex items-center gap-2 pt-5 text-xs font-semibold text-[#18181f]/40">
    <RouterLink to="/chaines" class="shrink-0 transition-colors hover:text-[#18181f]/70">Chaînes</RouterLink>
    <span>/</span>
    <span class="min-w-0 truncate text-[#18181f]">{{ channelName }}</span>
  </nav>
</template>
