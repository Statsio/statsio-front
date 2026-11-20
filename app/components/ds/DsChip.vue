<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

/**
 * Pastille : filtre pressable (`pressed` → aria-pressed) ou lien (`to`).
 * - `variant="default"` : contour violet, 34px (filtres, suggestions, thèmes).
 * - `variant="scope"` : plus discrète, contour clair (portée de recherche).
 * Slots : `swatch` (pastille en quart de disque, voir DsSwatch), `count`.
 */
const props = withDefaults(
  defineProps<{
    pressed?: boolean
    variant?: 'default' | 'scope'
    to?: RouteLocationRaw
  }>(),
  { pressed: undefined, variant: 'default' },
)

const tag = computed(() => (props.to ? RouterLink : 'button'))
const bindings = computed(() =>
  props.to
    ? { to: props.to }
    : { type: 'button' as const, 'aria-pressed': props.pressed === undefined ? undefined : String(props.pressed) },
)
</script>

<template>
  <component :is="tag" v-bind="bindings" class="ds-chip" :class="[`ds-chip--${variant}`, { 'is-on': pressed }]">
    <slot name="swatch" />
    <span class="ds-chip__text"><slot /></span>
    <b v-if="$slots.count" class="ds-chip__count"><slot name="count" /></b>
  </component>
</template>

<style scoped>
.ds-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 4px 12px;
  border: 2px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-text);
  font: 600 13.5px/1.25 var(--ds-ui);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.ds-chip:hover {
  background: var(--ds-tint);
}
.ds-chip.is-on {
  background: var(--ds-action);
  color: var(--ds-action-ink);
}
.ds-chip:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.ds-chip__count {
  font: 500 12px var(--ds-num);
  opacity: 0.8;
}

.ds-chip--scope {
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  border-color: var(--ds-divide);
  color: var(--ds-muted);
  font-size: 12.5px;
  font-weight: 700;
}
.ds-chip--scope.is-on {
  border-color: var(--ds-ol);
  background: var(--ds-tint);
  color: var(--ds-link);
}
</style>
