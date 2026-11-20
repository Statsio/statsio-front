<script setup lang="ts" generic="T extends string">
/**
 * Contrôle segmenté Bold Outline (tri, mode d'affichage) : un groupe de boutons
 * `aria-pressed`, un seul actif. Slot `option` pour un contenu personnalisé
 * (icône seule : renseigner alors `ariaLabel` sur l'option).
 */
defineProps<{
  options: { value: T; label: string; ariaLabel?: string }[]
  /** libellé du groupe (lecteurs d'écran) */
  label: string
  size?: 'md' | 'sm'
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="ds-seg" :class="`ds-seg--${size ?? 'md'}`" role="group" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="ds-seg__btn"
      :aria-pressed="model === option.value"
      :aria-label="option.ariaLabel"
      @click="model = option.value"
    >
      <slot name="option" :option="option" :active="model === option.value">{{ option.label }}</slot>
    </button>
  </div>
</template>

<style scoped>
.ds-seg {
  display: inline-flex;
  flex: none;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 4px;
  background: var(--ds-surface);
}
.ds-seg__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 12px;
  border: 0;
  background: none;
  color: var(--ds-muted);
  font: 700 13.5px/1 var(--ds-ui);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.ds-seg__btn + .ds-seg__btn {
  border-left: 2px solid var(--ds-divide);
}
.ds-seg__btn[aria-pressed='true'] {
  background: var(--ds-action);
  color: var(--ds-action-ink);
}
.ds-seg__btn:not([aria-pressed='true']):hover {
  background: var(--ds-tint);
  color: var(--ds-text);
}
.ds-seg__btn:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: -4px;
}
@media (max-width: 640px) {
  .ds-seg--sm .ds-seg__btn {
    padding: 0 9px;
    font-size: 12.5px;
  }
}
</style>
