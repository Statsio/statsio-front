<script setup lang="ts">
/** Puce de légende de la charte : un quart de disque cerclé (jamais un point rond). */
withDefaults(defineProps<{ color: string; size?: number }>(), { size: 12 })
</script>

<template>
  <i class="ds-swatch" :style="{ background: color, width: `${size}px`, height: `${size}px` }" aria-hidden="true" />
</template>

<style scoped>
.ds-swatch {
  flex: none;
  display: inline-block;
  border-radius: 100% 0 0 0;
  outline: 2px solid var(--ds-ol);
}
</style>
