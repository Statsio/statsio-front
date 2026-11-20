<script setup lang="ts">
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'

/** Pastille « StatsData lié » : l'article réutilise les blocs d'un ou plusieurs StatsData. */
defineProps<{ count: number }>()
</script>

<template>
  <span v-if="count > 0" class="art-sd">
    <DsTypeGlyph kind="statsdata" :size="11" />
    {{ count > 1 ? `${count} StatsData liés` : 'StatsData lié' }}
  </span>
</template>

<style scoped>
.art-sd {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border: 2px solid var(--ds-blue-300);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-blue-700);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
:root[data-color-scheme='dark'] .art-sd {
  color: var(--ds-blue-300);
}
</style>
