<script setup lang="ts">
/** Rosette « chaîne vérifiée » (identité de l'éditeur contrôlée). */
withDefaults(defineProps<{ size?: number }>(), { size: 18 })
</script>

<template>
  <span class="chvf" title="Chaîne vérifiée">
    <svg :width="size" :height="size" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1 L9.8 2.6 L12.2 2.4 L12.6 4.8 L14.6 6.2 L13.6 8.4 L14.6 10.6 L12.6 12 L12.2 14.4 L9.8 14.2 L8 15.8 L6.2 14.2 L3.8 14.4 L3.4 12 L1.4 10.6 L2.4 8.4 L1.4 6.2 L3.4 4.8 L3.8 2.4 L6.2 2.6 Z"
        fill="currentColor"
      />
      <path
        d="M5.2 8.3 L7.2 10.2 L10.9 6.2"
        fill="none"
        stroke="#fff"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span class="sr-only">Chaîne vérifiée</span>
  </span>
</template>

<style scoped>
.chvf {
  display: inline-flex;
  flex: none;
  color: var(--ds-blue-500);
}
</style>
