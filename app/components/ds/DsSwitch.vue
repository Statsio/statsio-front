<script setup lang="ts">
/** Interrupteur en pastille (`role="switch"`) : le libellé est dans le slot. */
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <button type="button" role="switch" class="ds-switch" :aria-checked="model" @click="model = !model">
    <span class="ds-switch__track" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.ds-switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding: 4px 12px 4px 6px;
  border: 2px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-text);
  font: 600 13.5px/1.25 var(--ds-ui);
  cursor: pointer;
}
.ds-switch:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.ds-switch__track {
  position: relative;
  flex: none;
  width: 32px;
  height: 20px;
  border: 2px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-tint);
  transition: background 0.2s;
}
.ds-switch__track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ds-ol);
  transition:
    transform 0.25s var(--ds-e-glisse),
    background 0.2s;
}
.ds-switch[aria-checked='true'] .ds-switch__track {
  background: var(--ds-action);
}
.ds-switch[aria-checked='true'] .ds-switch__track::after {
  transform: translateX(12px);
  background: var(--ds-action-ink);
}
</style>
