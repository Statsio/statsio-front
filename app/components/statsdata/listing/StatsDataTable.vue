<script setup lang="ts">
import DsBox from '@/components/ds/DsBox.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import ListingFavButton from '@/components/listing/tranches/ListingFavButton.vue'
import ListingPublisherMark from '@/components/listing/tranches/ListingPublisherMark.vue'
import StatsDataFreshBadge from './StatsDataFreshBadge.vue'
import StatsDataSpark from './StatsDataSpark.vue'
import { formatCatalogCount } from '@/lib/catalog-format'
import type { RubricBadge } from '@/lib/listing-rubrics'
import type { CatalogItem } from '@/types/catalog'

/** Vue « liste » : un vrai tableau (en-têtes de colonne), défilant à l'horizontale sur mobile. */
defineProps<{
  items: CatalogItem[]
  query?: string
  linkOf: (item: CatalogItem) => string
  rubricOf: (item: CatalogItem) => RubricBadge | null
  isFavorited: (item: CatalogItem) => boolean
}>()
const emit = defineEmits<{ favorite: [item: CatalogItem] }>()
</script>

<template>
  <DsBox class="sdtbl">
    <table class="sdtbl__t">
      <thead>
        <tr>
          <th scope="col">StatsData</th>
          <th scope="col">Tendance</th>
          <th scope="col">Catégorie</th>
          <th scope="col">Publié par</th>
          <th scope="col" class="r">Sources</th>
          <th scope="col"><span class="sr-only">Favori</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            <div class="sdtbl__main" :class="{ 'sdtbl__main--noimg': !item.thumbnail_url }">
              <AppMediaImage
                v-if="item.thumbnail_url"
                :src="item.thumbnail_url"
                alt=""
                class="sdtbl__img"
                loading="lazy"
              />
              <span class="sdtbl__txt">
                <NuxtLink :to="linkOf(item)" class="sdtbl__title"
                  ><DsHighlight :text="item.title" :query="query"
                /></NuxtLink>
                <span class="sdtbl__sub">
                  <StatsDataFreshBadge :item="item" />
                  <span>{{ formatCatalogCount(item.views_count) }} vues</span>
                </span>
              </span>
            </div>
          </td>
          <td><StatsDataSpark :item="item" /></td>
          <td>
            <span v-if="rubricOf(item)" class="sdtbl__rub">
              <DsSwatch :color="rubricOf(item)!.color" :size="9" />{{ rubricOf(item)!.label }}
            </span>
            <span v-else class="sdtbl__muted">—</span>
          </td>
          <td>
            <span class="sdtbl__who">
              <ListingPublisherMark :publisher="item.publisher" :size="22" />
              <b><DsHighlight :text="item.publisher.name" :query="query" /></b>
            </span>
          </td>
          <td class="r ds-tnum">{{ item.linked_datasets_count }}</td>
          <td>
            <ListingFavButton
              :active="isFavorited(item)"
              :title="item.title"
              @toggle="emit('favorite', item)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </DsBox>
</template>

<style scoped>
.sdtbl {
  overflow-x: auto;
}
.sdtbl__t {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}
.sdtbl__t th {
  padding: 12px 14px;
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-tint);
  color: var(--ds-muted);
  font: 500 10.5px var(--ds-num);
  letter-spacing: 0.1em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}
.sdtbl__t td {
  padding: 12px 14px;
  border-bottom: 2px solid var(--ds-divide);
  font-size: 14px;
  vertical-align: middle;
}
.sdtbl__t .r {
  text-align: right;
}
.sdtbl__t tbody tr:last-child td {
  border-bottom: 0;
}
.sdtbl__t tbody tr:hover {
  background: var(--ds-tint);
}
.sdtbl__main {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}
.sdtbl__main--noimg {
  grid-template-columns: minmax(0, 1fr);
}
.sdtbl__img {
  width: 72px;
  height: 48px;
  border: 2px solid var(--ds-ol);
  border-radius: 2px;
  object-fit: cover;
}
.sdtbl__txt {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.sdtbl__title {
  color: var(--ds-text);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  text-decoration: none;
}
.sdtbl__title:hover {
  color: var(--ds-link);
}
.sdtbl__title:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.sdtbl__sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--ds-faint);
  font: 400 12px/1.4 var(--ds-num);
}
.sdtbl__muted {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
}
.sdtbl__rub {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-link);
  font: 500 10.5px/1.2 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.sdtbl__who {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
