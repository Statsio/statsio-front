<script setup lang="ts">
import { computed } from 'vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import { compositionParts, compositionText } from '@/lib/dossiers-listing'
import type { DossierContentCounts } from '@/types/dossier'

/** Composition d'un dossier en « tranche » : barre proportionnelle par type (+ légende). */
const props = defineProps<{ counts?: DossierContentCounts; legend?: boolean }>()
const parts = computed(() => compositionParts(props.counts))
const label = computed(() => compositionText(props.counts))
</script>

<template>
  <div v-if="parts.length" class="dcomp">
    <div class="dcomp__bar" role="img" :aria-label="label">
      <span v-for="p in parts" :key="p.value" :style="{ flex: `${p.count} 1 0`, background: p.color }" />
    </div>
    <div v-if="legend" class="dcomp__leg" aria-hidden="true">
      <span v-for="p in parts" :key="p.value">
        <DsSwatch :color="p.color" :size="10" /><b>{{ p.count }}</b> {{ p.count > 1 ? p.many : p.one }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.dcomp {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dcomp__bar {
  display: flex;
  height: var(--dcomp-h, 14px);
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
}
.dcomp__bar span {
  min-width: 0;
}
.dcomp__bar span + span {
  border-left: 2px solid var(--ds-ol);
}
.dcomp__leg {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  color: var(--ds-muted);
  font: 400 12px var(--ds-num);
}
.dcomp__leg span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dcomp__leg :deep(.ds-swatch) {
  outline-width: 1.5px;
}
.dcomp__leg b {
  color: var(--ds-text);
  font-weight: 500;
}
</style>
