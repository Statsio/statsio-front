<script setup lang="ts">
import DsHighlight from '@/components/ds/DsHighlight.vue'
import ListingPublisherMark from '@/components/listing/tranches/ListingPublisherMark.vue'
import type { CatalogItem } from '@/types/catalog'

/** Signature d'une carte : éditeur (logo + nom) et une ligne de contexte (vues, clôture…). */
defineProps<{ item: CatalogItem; meta: string; query?: string }>()
</script>

<template>
  <span class="lby">
    <ListingPublisherMark :publisher="item.publisher" />
    <span class="lby__txt">
      <b class="lby__name">
        <DsHighlight :text="item.publisher.name" :query="query" />
        <span
          v-if="item.publisher.verified"
          class="lby__ok"
          title="Éditeur vérifié"
          aria-label="vérifié"
          >✔</span
        >
      </b>
      <span class="lby__meta">{{ meta }}</span>
    </span>
  </span>
</template>

<style scoped>
.lby {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.lby__txt {
  min-width: 0;
}
.lby__name {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.lby__ok {
  color: var(--ds-link);
  font-size: 11px;
}
.lby__meta {
  display: block;
  color: var(--ds-faint);
  font: 400 12px/1.3 var(--ds-num);
}
</style>
