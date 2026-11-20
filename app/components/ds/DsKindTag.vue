<script setup lang="ts">
import type { DsKind } from '@/lib/ds/types'
/**
 * Étiquette typée (fil « En direct », bandeau « En continu »).
 * - `tone="pill"` : pastille bordée sur fond surface (fil).
 * - `tone="flash"` : étiquette pleine pour fond violet (bandeau).
 */
withDefaults(defineProps<{ kind: DsKind; tone?: 'pill' | 'flash' }>(), { tone: 'pill' })
</script>

<template>
  <span class="ds-kind" :class="[`ds-kind--${tone}`, `is-${kind}`]"><slot /></span>
</template>

<style scoped>
.ds-kind {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.ds-kind--pill {
  padding: 2px 8px;
  border: 2px solid var(--ds-divide);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-link);
  font: 600 11px/1.4 var(--ds-ui);
}
.ds-kind--pill.is-data,
.ds-kind--pill.is-maj {
  border-color: var(--ds-blue-300);
  color: var(--ds-blue-700);
}

.ds-kind--flash {
  padding: 5px 7px;
  border-radius: 2px;
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.ds-kind--flash.is-une {
  background: #fff;
  color: #1d4ed8;
}
.ds-kind--flash.is-actu {
  background: #a78bfa;
  color: #1b1530;
}
.ds-kind--flash.is-chiffre {
  background: #dbeafe;
  color: #1d4ed8;
}
.ds-kind--flash.is-sondage {
  background: #ede9fe;
  color: #6d28d9;
}
.ds-kind--flash.is-maj {
  padding: 3.5px 6px;
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  color: #fff;
}
</style>
