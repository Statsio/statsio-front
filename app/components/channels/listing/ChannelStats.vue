<script setup lang="ts">
import { formatCatalogCount } from '@/lib/catalog-format'

/** Abonnés · publications · StatsData, sur trois colonnes entre deux filets. */
defineProps<{ followers: number; publications: number; statsdata: number }>()
</script>

<template>
  <dl class="chst">
    <div>
      <dt>Abonnés</dt>
      <dd class="ds-tnum">{{ formatCatalogCount(followers) }}</dd>
    </div>
    <div>
      <dt>Publications</dt>
      <dd class="ds-tnum">{{ formatCatalogCount(publications) }}</dd>
    </div>
    <div>
      <dt>StatsData</dt>
      <dd class="ds-tnum">{{ formatCatalogCount(statsdata) }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.chst {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding-block: 10px;
  border-block: 2px solid var(--ds-divide);
}
.chst dt {
  color: var(--ds-muted);
  font: 500 9.5px/1.2 var(--ds-num);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.chst dd {
  margin: 4px 0 0;
  color: var(--ds-text);
  font: 500 16px/1 var(--ds-num);
}
</style>
