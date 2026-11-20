<script setup lang="ts">
import DsBox from '@/components/ds/DsBox.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import ArticleDataBadge from './ArticleDataBadge.vue'
import ListingFavButton from '@/components/listing/tranches/ListingFavButton.vue'
import ListingPublisherMark from '@/components/listing/tranches/ListingPublisherMark.vue'
import ArticleReadingTime from './ArticleReadingTime.vue'
import { CATALOG_FORMAT_STYLE } from '@/lib/catalog-theme'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import type { RubricBadge } from '@/lib/articles-listing'
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

const subline = (item: CatalogItem) =>
  [
    item.format ? CATALOG_FORMAT_STYLE[item.format]?.label : null,
    formatRelativePublished(item.created_at ?? item.updated_at),
  ]
    .filter(Boolean)
    .join(' · ')
</script>

<template>
  <DsBox class="tbl">
    <table class="tbl__t">
      <thead>
        <tr>
          <th scope="col">Article</th>
          <th scope="col">Rubrique</th>
          <th scope="col">Publié par</th>
          <th scope="col" class="r">Lecture</th>
          <th scope="col" class="r">Vues</th>
          <th scope="col"><span class="sr-only">Favori</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            <div class="tbl__art" :class="{ 'tbl__art--noimg': !item.thumbnail_url }">
              <AppMediaImage
                v-if="item.thumbnail_url"
                :src="item.thumbnail_url"
                alt=""
                class="tbl__img"
                loading="lazy"
              />
              <span class="tbl__main">
                <NuxtLink :to="linkOf(item)" class="tbl__title"
                  ><DsHighlight :text="item.title" :query="query"
                /></NuxtLink>
                <span class="tbl__sub">{{ subline(item) }}</span>
                <ArticleDataBadge :count="item.linked_datasets_count" class="tbl__sd" />
              </span>
            </div>
          </td>
          <td>
            <span v-if="rubricOf(item)" class="tbl__rub">
              <DsSwatch :color="rubricOf(item)!.color" :size="9" />{{ rubricOf(item)!.label }}
            </span>
            <span v-else class="tbl__muted">—</span>
          </td>
          <td>
            <span class="tbl__who">
              <ListingPublisherMark :publisher="item.publisher" :size="22" />
              <b><DsHighlight :text="item.publisher.name" :query="query" /></b>
            </span>
          </td>
          <td class="r"><ArticleReadingTime :minutes="item.reading_minutes" class="tbl__rt" /></td>
          <td class="r ds-tnum">{{ formatCatalogCount(item.views_count) }}</td>
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
.tbl {
  overflow-x: auto;
}
.tbl__t {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}
.tbl__t th {
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
.tbl__t td {
  padding: 12px 14px;
  border-bottom: 2px solid var(--ds-divide);
  font-size: 14px;
  vertical-align: middle;
}
.tbl__t .r {
  text-align: right;
}
.tbl__t tbody tr:last-child td {
  border-bottom: 0;
}
.tbl__t tbody tr:hover {
  background: var(--ds-tint);
}
.tbl__art {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}
.tbl__art--noimg {
  grid-template-columns: minmax(0, 1fr);
}
.tbl__img {
  position: relative;
  width: 72px;
  height: 48px;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 2px;
  object-fit: cover;
}
.tbl__main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}
.tbl__title {
  color: var(--ds-text);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  text-decoration: none;
}
.tbl__title:hover {
  color: var(--ds-link);
}
.tbl__title:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.tbl__sub,
.tbl__muted {
  color: var(--ds-faint);
  font: 400 12px/1.4 var(--ds-num);
}
.tbl__sd {
  margin-top: 4px;
}
.tbl__rub {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-link);
  font: 500 10.5px/1.2 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.tbl__who {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tbl__rt {
  font: 400 12px var(--ds-num);
}
</style>
