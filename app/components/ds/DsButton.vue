<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

/**
 * Bouton de la charte « Tranches » (Bold Outline) : contour 2px, ombre décalée
 * nette, balayage oblique au survol, enfoncement au clic.
 * - `to` → RouterLink ; `href` → <a> ; sinon <button type="button">.
 * - `primary` : fond action, ombre bleue. `secondary` : fond surface, contour
 *   violet, le balayage remplit de la couleur du contour.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary'
    size?: 'md' | 'sm'
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button', disabled: false, block: false },
)

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))

const bindings = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href }
  return { type: props.type, disabled: props.disabled }
})
</script>

<template>
  <component
    :is="tag"
    v-bind="bindings"
    class="ds-btn"
    :class="[`ds-btn--${variant}`, `ds-btn--${size}`, { 'ds-btn--block': block }]"
  >
    <slot />
  </component>
</template>

<style scoped>
.ds-btn {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 18px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  box-shadow: 3px 3px 0 var(--ds-sh2);
  background: var(--ds-action);
  color: var(--ds-action-ink);
  font: 700 15px/1 var(--ds-ui);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.09s,
    box-shadow 0.09s,
    color 0.32s var(--ds-e-glisse);
}
.ds-btn::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: -2px;
  bottom: -2px;
  left: -40%;
  width: 0;
  background: var(--ds-action-wipe);
  transform: skewX(-45deg);
  transition: width 0.42s var(--ds-e-glisse);
}
.ds-btn:hover::before,
.ds-btn:focus-visible::before {
  width: 180%;
}
.ds-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ds-sh2);
}
.ds-btn:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.ds-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

.ds-btn--secondary {
  background: var(--ds-surface);
  color: var(--ds-ol);
  box-shadow: 3px 3px 0 var(--ds-sh);
}
.ds-btn--secondary::before {
  background: var(--ds-ol);
}
.ds-btn--secondary:hover,
.ds-btn--secondary:focus-visible {
  color: var(--ds-action-ink);
}
.ds-btn--secondary:active {
  box-shadow: 1px 1px 0 var(--ds-sh);
}

.ds-btn--sm {
  height: 36px;
  padding: 0 12px;
  font-size: 13.5px;
}
.ds-btn--block {
  width: 100%;
}
</style>
