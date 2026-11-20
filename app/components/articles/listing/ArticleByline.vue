<script setup lang="ts">
import { computed } from 'vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import ListingPublisherMark from '@/components/listing/tranches/ListingPublisherMark.vue'
import ArticleReadingTime from './ArticleReadingTime.vue'
import { formatRelativePublished } from '@/lib/catalog-format'
import type { CatalogItem } from '@/types/catalog'

/** Signature d'une carte : éditeur, date de parution relative, temps de lecture. */
const props = defineProps<{ item: CatalogItem; query?: string }>()
const when = computed(() => formatRelativePublished(props.item.created_at ?? props.item.updated_at))
</script>

<template>
  <span class="art-by">
    <ListingPublisherMark :publisher="item.publisher" />
    <span class="art-by__txt">
      <b class="art-by__name">
        <DsHighlight :text="item.publisher.name" :query="query" />
        <span
          v-if="item.publisher.verified"
          class="art-by__ok"
          title="Éditeur vérifié"
          aria-label="vérifié"
          >✔</span
        >
      </b>
      <span class="art-by__meta"
        >{{ when }} · <ArticleReadingTime :minutes="item.reading_minutes"
      /></span>
    </span>
  </span>
</template>

<style scoped>
.art-by {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.art-by__txt {
  min-width: 0;
}
.art-by__name {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.art-by__ok {
  color: var(--ds-link);
  font-size: 11px;
}
.art-by__meta {
  display: block;
  color: var(--ds-faint);
  font: 400 12px/1.3 var(--ds-num);
}
</style>
