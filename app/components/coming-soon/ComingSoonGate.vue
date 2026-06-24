<script setup lang="ts">
const config = useRuntimeConfig()
const raw = config.public.comingSoon
console.log('[ComingSoonGate] comingSoon raw value:', raw, typeof raw)
const isComingSoon = String(raw).trim() === 'true'
</script>

<template>
  <ComingSoonPage v-if="isComingSoon" />
  <slot v-else />
</template>
