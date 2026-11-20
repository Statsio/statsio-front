<script setup lang="ts">
import { computed } from 'vue'
import { sectorPath } from '@/lib/ds/pie'
import { PASSWORD_STRENGTH_LABELS } from '@/lib/password-strength'

/**
 * Solidité du mot de passe en tranches : un disque en 4 quarts, un quart par
 * critère rempli (8 caractères, majuscule, chiffre, symbole). Le libellé suit.
 */
const props = defineProps<{ strength: number; hasPassword: boolean }>()

const quarters = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    d: sectorPath(12, 12, 10, -90 + i * 90, i * 90),
    on: props.hasPassword && i < props.strength,
  })),
)

const label = computed(() => PASSWORD_STRENGTH_LABELS[Math.max(0, props.strength - 1)])
</script>

<template>
  <div class="ds-strength" :class="{ 'is-weak': hasPassword && strength <= 1 }">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path v-for="(q, i) in quarters" :key="i" :d="q.d" class="ds-strength__q" :class="{ 'is-on': q.on }" />
      <circle cx="12" cy="12" r="10.6" class="ds-strength__ring" />
    </svg>
    <span class="ds-strength__label" aria-live="polite">
      <template v-if="hasPassword"><b>{{ label }}</b> · {{ strength }}/4 · </template>8 caractères, majuscule, chiffre,
      symbole
    </span>
  </div>
</template>

<style scoped>
.ds-strength {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ds-strength svg {
  flex: none;
  overflow: visible;
}
.ds-strength__q {
  fill: var(--ds-tint);
  stroke: var(--ds-surface);
  stroke-width: 1.4;
  transition: fill 0.25s var(--ds-e-glisse);
}
.ds-strength__q.is-on {
  fill: var(--ds-t1);
}
.is-weak .ds-strength__q.is-on {
  fill: #be123c;
}
.ds-strength__ring {
  fill: none;
  stroke: var(--ds-ol);
  stroke-width: 1.6;
}
.ds-strength__label {
  color: var(--ds-muted);
  font: 400 12px/1.3 var(--ds-num);
}
.ds-strength__label b {
  color: var(--ds-text);
  font-weight: 500;
}
.is-weak .ds-strength__label b {
  color: #be123c;
}
:root[data-color-scheme='dark'] .is-weak .ds-strength__label b {
  color: #fda4af;
}
</style>
