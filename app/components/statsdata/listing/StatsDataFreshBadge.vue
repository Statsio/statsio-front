<script setup lang="ts">
import { computed } from 'vue'
import { freshBadge } from '@/lib/statsdata-listing'
import type { CatalogItem } from '@/types/catalog'

/** Fraîcheur des données : « il y a 2 h » (vert, animé si < 24 h) ou « Publié … » sans synchro. */
const props = defineProps<{ item: CatalogItem }>()
const badge = computed(() => freshBadge(props.item))
</script>

<template>
  <span class="sdfresh" :class="{ 'is-live': badge.live }" :title="badge.title">
    <i aria-hidden="true" />{{ badge.text }}
  </span>
</template>

<style scoped>
@property --sdfresh-sweep {
  syntax: '<angle>';
  inherits: false;
  initial-value: 270deg;
}
.sdfresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 7px;
  border: 2px solid var(--ds-divide);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-muted);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.sdfresh.is-live {
  border-color: var(--ds-ok);
  color: var(--ds-ok);
}
.sdfresh i {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: conic-gradient(
    currentColor var(--sdfresh-sweep),
    color-mix(in srgb, currentColor 25%, transparent) 0
  );
}
.sdfresh.is-live i {
  animation: sdfresh-sweep 2.4s var(--ds-e-balaye) infinite;
}
@keyframes sdfresh-sweep {
  from {
    --sdfresh-sweep: 0deg;
  }
  to {
    --sdfresh-sweep: 360deg;
  }
}
</style>
