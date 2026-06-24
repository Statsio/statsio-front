<script setup lang="ts">
const config = useRuntimeConfig()
const isComingSoon = (config.public.comingSoon as string) === 'true'
</script>

<template>
  <ComingSoonPage v-if="isComingSoon" />
  <slot v-else />
</template>
