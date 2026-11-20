<script setup lang="ts">
/**
 * Surface Bold Outline : contour 2px, coins 6px, ombre décalée nette.
 * `shadow` : `md` (5px, défaut), `sm` (3px), `none`. `as` : balise rendue.
 * `interactive` : se soulève au survol (cartes cliquables).
 */
withDefaults(
  defineProps<{
    as?: string
    shadow?: 'md' | 'sm' | 'none'
    interactive?: boolean
  }>(),
  { as: 'div', shadow: 'md', interactive: false },
)
</script>

<template>
  <component :is="as" class="ds-box" :class="[`ds-box--${shadow}`, { 'ds-box--interactive': interactive }]">
    <slot />
  </component>
</template>

<style scoped>
.ds-box {
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-surface);
  color: var(--ds-text);
}
.ds-box--md {
  box-shadow: 5px 5px 0 var(--ds-sh);
}
.ds-box--sm {
  box-shadow: 3px 3px 0 var(--ds-sh);
}
.ds-box--interactive {
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.ds-box--interactive:hover {
  transform: translate(-2px, -2px);
}
.ds-box--interactive.ds-box--md:hover {
  box-shadow: 7px 7px 0 var(--ds-sh);
}
.ds-box--interactive.ds-box--sm:hover {
  box-shadow: 5px 5px 0 var(--ds-sh);
}
</style>
