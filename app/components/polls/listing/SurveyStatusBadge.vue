<script setup lang="ts">
/** Statut de la consultation : « Ouvert » (vert, pastille qui pulse) ou « Clos ». */
defineProps<{ open: boolean }>()
</script>

<template>
  <span class="svst" :class="{ 'is-open': open }"
    ><i aria-hidden="true" />{{ open ? 'Ouvert' : 'Clos' }}</span
  >
</template>

<style scoped>
.svst {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 7px;
  border: 2px solid var(--ds-divide);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-muted);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.svst i {
  width: 8px;
  height: 8px;
  border-radius: 1px;
  background: currentColor;
}
.svst.is-open {
  border-color: var(--ds-ok);
  color: var(--ds-ok);
}
.svst.is-open i {
  border-radius: 50%;
  animation: svst-pulse 1.8s ease-in-out infinite;
}
@keyframes svst-pulse {
  50% {
    opacity: 0.35;
  }
}
</style>
