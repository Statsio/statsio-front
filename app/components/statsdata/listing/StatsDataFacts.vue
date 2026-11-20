<script setup lang="ts">
import type { CatalogItem } from '@/types/catalog'

/** Chiffres d'un StatsData : sources de données branchées et graphiques. */
defineProps<{ item: CatalogItem }>()
const plural = (n: number, word: string) => `${word}${n > 1 ? 's' : ''}`
</script>

<template>
  <span class="sdfacts">
    <span
      ><b class="ds-tnum">{{ item.linked_datasets_count }}</b>
      {{ plural(item.linked_datasets_count, 'source') }}</span
    >
    <span
      ><b class="ds-tnum">{{ item.charts_count }}</b>
      {{ plural(item.charts_count, 'graphique') }}</span
    >
  </span>
</template>

<style scoped>
.sdfacts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  color: var(--ds-faint);
  font: 400 12px/1.4 var(--ds-num);
}
.sdfacts b {
  color: var(--ds-text);
  font-weight: 500;
}
</style>
