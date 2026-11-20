<script setup lang="ts">
/** Étiquette mono capitales (« eyebrow »). Un `<b>` dans le slot prend la couleur du lien. */
withDefaults(defineProps<{ as?: string }>(), { as: 'span' })
</script>

<template>
  <component :is="as" class="ds-lbl"><slot /></component>
</template>

<style scoped>
.ds-lbl {
  display: block;
  margin: 0;
  color: var(--ds-muted);
  font: 500 11.5px/1.3 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.ds-lbl :deep(b) {
  color: var(--ds-link);
  font-weight: 500;
}
</style>
