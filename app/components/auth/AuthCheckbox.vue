<script setup lang="ts">
import { useId } from 'vue'

/** Case à cocher Bold Outline des formulaires d'auth (contour 2px, coche sur fond action). */
withDefaults(defineProps<{ label?: string; disabled?: boolean }>(), { label: undefined, disabled: false })

const model = defineModel<boolean>({ required: true })
const id = `auth-check-${useId()}`
</script>

<template>
  <div class="ds-check" :class="{ 'is-disabled': disabled }">
    <input :id="id" v-model="model" type="checkbox" class="ds-check__input" :disabled="disabled" />
    <span class="ds-check__box" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.2">
        <path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <label :for="id" class="ds-check__label"><slot>{{ label }}</slot></label>
  </div>
</template>

<style scoped>
.ds-check {
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}
.ds-check__input {
  position: absolute;
  top: 0;
  left: 0;
  width: 22px;
  height: 22px;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
.ds-check__box {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
  color: transparent;
  box-shadow: 2px 2px 0 var(--ds-sh);
  pointer-events: none;
  transition:
    background 0.15s,
    color 0.15s;
}
.ds-check__input:checked + .ds-check__box {
  background: var(--ds-action);
  color: var(--ds-action-ink);
}
.ds-check__input:focus-visible + .ds-check__box {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.ds-check__label {
  grid-column: 2;
  color: var(--ds-text);
  font-size: 14.5px;
  font-weight: 500;
  line-height: 22px;
  cursor: pointer;
}
.ds-check__label :deep(a) {
  color: var(--ds-link);
  font-weight: 700;
}
.ds-check__label :deep(a:hover) {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.ds-check.is-disabled {
  opacity: 0.55;
}
</style>
