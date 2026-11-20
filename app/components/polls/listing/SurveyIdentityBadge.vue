<script setup lang="ts">
/** « Identité vérifiée » : une voix par personne, identité contrôlée avant de participer. */
</script>

<template>
  <span class="svid" title="Une voix par personne, identité vérifiée avant de participer">
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M6 1 L10.5 2.8 V6 C10.5 8.6 8.5 10.4 6 11 C3.5 10.4 1.5 8.6 1.5 6 V2.8 Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path d="M4 6 L5.5 7.5 L8 4.8" fill="none" stroke="currentColor" stroke-width="1.5" />
    </svg>
    Identité vérifiée
  </span>
</template>

<style scoped>
.svid {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border: 2px solid var(--ds-blue-300);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-blue-700);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
:root[data-color-scheme='dark'] .svid {
  color: var(--ds-blue-300);
}
</style>
