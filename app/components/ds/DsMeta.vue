<script setup lang="ts">
/** Méta en mono (date, auteur, compteur). */
withDefaults(defineProps<{ as?: string }>(), { as: 'span' })
</script>

<template>
  <component :is="as" class="ds-meta"><slot /></component>
</template>

<style scoped>
.ds-meta {
  display: block;
  color: var(--ds-faint);
  font: 400 12px/1.45 var(--ds-num);
}
</style>
