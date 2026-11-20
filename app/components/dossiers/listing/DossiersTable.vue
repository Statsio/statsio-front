<script setup lang="ts">
import DsBox from '@/components/ds/DsBox.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import ListingRubricTag from '@/components/listing/tranches/ListingRubricTag.vue'
import DossierComposition from './DossierComposition.vue'
import DossierContentThumb from './DossierContentThumb.vue'
import DossierFollowButton from './DossierFollowButton.vue'
import { formatRelativePublished } from '@/lib/catalog-format'
import { compositionText, dossierTypeMeta } from '@/lib/dossiers-listing'
import type { RubricBadge } from '@/lib/listing-rubrics'
import type { DossierCatalogItem } from '@/types/dossier'

/** Vue « liste » : un vrai tableau (en-têtes de colonne), défilant à l'horizontale sur mobile. */
defineProps<{
  items: DossierCatalogItem[]
  query?: string
  linkOf: (item: DossierCatalogItem) => string
  rubricOf: (item: DossierCatalogItem) => RubricBadge | null
  isFollowing: (item: DossierCatalogItem) => boolean
}>()
const emit = defineEmits<{ follow: [item: DossierCatalogItem] }>()
</script>

<template>
  <DsBox class="dtbl">
    <table class="dtbl__t">
      <thead>
        <tr>
          <th scope="col">Dossier</th>
          <th scope="col">Thème</th>
          <th scope="col">Contenus</th>
          <th scope="col">Dernier ajout</th>
          <th scope="col"><span class="sr-only">Suivre</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            <div class="dtbl__main">
              <span class="dtbl__stack" aria-hidden="true">
                <span class="dtbl__thumb">
                  <DossierContentThumb
                    v-if="item.recent?.[0]"
                    :type="item.recent[0].type"
                    :src="item.recent[0].thumbnail_url"
                    :seed="item.recent[0].id"
                  />
                  <img v-else-if="item.image_url" :src="item.image_url" alt="" loading="lazy" />
                </span>
              </span>
              <span>
                <NuxtLink :to="linkOf(item)" class="dtbl__title">
                  <DsHighlight :text="item.name" :query="query" />
                </NuxtLink>
                <span v-if="item.is_pinned" class="dtbl__pin">Épinglé</span>
              </span>
            </div>
          </td>
          <td><ListingRubricTag :rubric="rubricOf(item)" /></td>
          <td>
            <div class="dtbl__comp">
              <DossierComposition :counts="item.counts" />
              <span class="dtbl__muted">
                <b class="ds-tnum">{{ item.content_count }}</b>
                <template v-if="item.content_count"> · {{ compositionText(item.counts) }}</template>
              </span>
            </div>
          </td>
          <td>
            <span v-if="item.recent?.[0]" class="dtbl__last">
              <span :style="{ color: dossierTypeMeta(item.recent[0].type).color }" class="dtbl__gl">
                <DsTypeGlyph :kind="dossierTypeMeta(item.recent[0].type).glyph" :size="13" />
              </span>
              <span :title="item.recent[0].title">
                <DsHighlight :text="item.recent[0].title" :query="query" />
              </span>
            </span>
            <span class="dtbl__muted">{{ formatRelativePublished(item.updated_at) }}</span>
          </td>
          <td class="r">
            <DossierFollowButton
              :following="isFollowing(item)"
              :name="item.name"
              @toggle="emit('follow', item)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </DsBox>
</template>

<style scoped>
.dtbl {
  overflow-x: auto;
}
.dtbl__t {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}
.dtbl__t th {
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
.dtbl__t td {
  padding: 12px 14px;
  border-bottom: 2px solid var(--ds-divide);
  font-size: 14px;
  vertical-align: middle;
}
.dtbl__t .r {
  text-align: right;
}
.dtbl__t tbody tr:last-child td {
  border-bottom: 0;
}
.dtbl__t tbody tr:hover {
  background: var(--ds-tint);
}
.dtbl__main {
  display: flex;
  align-items: center;
  gap: 12px;
}
/* mini-classeur : deux feuilles décalées derrière la vignette */
.dtbl__stack {
  position: relative;
  flex: none;
  width: 64px;
  height: 42px;
  margin: 6px 6px 0 0;
}
.dtbl__stack::before,
.dtbl__stack::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
}
.dtbl__stack::before {
  background: var(--ds-violet-200);
  transform: translate(7px, -6px);
}
.dtbl__stack::after {
  background: var(--ds-blue-100);
  transform: translate(3.5px, -3px);
}
.dtbl__thumb {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
}
.dtbl__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dtbl__title {
  display: block;
  color: var(--ds-text);
  font: 800 20px/1 var(--ds-display);
  font-stretch: 92%;
  text-decoration: none;
}
.dtbl__title:hover {
  color: var(--ds-link);
}
.dtbl__title:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.dtbl__pin {
  display: inline-block;
  margin-top: 6px;
  padding: 3px 6px;
  border: 2px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-action);
  color: var(--ds-action-ink);
  font: 500 10px/1 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.dtbl__comp {
  --dcomp-h: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 170px;
}
.dtbl__muted {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
}
.dtbl__muted b {
  color: var(--ds-text);
  font-weight: 500;
}
.dtbl__last {
  display: flex;
  align-items: center;
  gap: 7px;
  max-width: 280px;
}
.dtbl__last > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dtbl__gl {
  display: flex;
  flex: none;
}
</style>
