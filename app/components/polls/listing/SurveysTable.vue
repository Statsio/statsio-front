<script setup lang="ts">
import DsBox from '@/components/ds/DsBox.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import ListingFavButton from '@/components/listing/tranches/ListingFavButton.vue'
import ListingPublisherMark from '@/components/listing/tranches/ListingPublisherMark.vue'
import SurveyIdentityBadge from './SurveyIdentityBadge.vue'
import SurveyKindGlyph from './SurveyKindGlyph.vue'
import SurveyStatusBadge from './SurveyStatusBadge.vue'
import { surveyKindOf, surveyState } from '@/lib/surveys-listing'
import type { CatalogItem } from '@/types/catalog'

/** Vue « liste » : un vrai tableau (en-têtes de colonne), défilant à l'horizontale sur mobile. */
defineProps<{
  items: CatalogItem[]
  query?: string
  linkOf: (item: CatalogItem) => string
  isFavorited: (item: CatalogItem) => boolean
}>()
const emit = defineEmits<{ favorite: [item: CatalogItem] }>()

const nf = (n: number) => n.toLocaleString('fr-FR')
</script>

<template>
  <DsBox class="svtbl">
    <table class="svtbl__t">
      <thead>
        <tr>
          <th scope="col">Consultation</th>
          <th scope="col">Type</th>
          <th scope="col">Publié par</th>
          <th scope="col" class="r">Participation</th>
          <th scope="col" class="r">Clôture</th>
          <th scope="col"><span class="sr-only">Favori</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            <div class="svtbl__main" :class="{ 'svtbl__main--noimg': !item.thumbnail_url }">
              <AppMediaImage
                v-if="item.thumbnail_url"
                :src="item.thumbnail_url"
                alt=""
                class="svtbl__img"
                loading="lazy"
              />
              <span class="svtbl__txt">
                <NuxtLink :to="linkOf(item)" class="svtbl__title"
                  ><DsHighlight :text="item.title" :query="query"
                /></NuxtLink>
                <span class="svtbl__sub">
                  <SurveyStatusBadge :open="surveyState(item).open" />
                  <SurveyIdentityBadge v-if="item.requires_identity_verification" />
                  <span v-if="item.has_participated" class="svtbl__done">Participé</span>
                </span>
              </span>
            </div>
          </td>
          <td>
            <span class="svtbl__kind"
              ><SurveyKindGlyph :kind="item.survey_kind" :size="12" />{{
                surveyKindOf(item).label
              }}</span
            >
          </td>
          <td>
            <span class="svtbl__who">
              <ListingPublisherMark :publisher="item.publisher" :size="22" />
              <b><DsHighlight :text="item.publisher.name" :query="query" /></b>
            </span>
          </td>
          <td class="r ds-tnum">
            {{ nf(item.responses_count ?? 0) }}
            <span v-if="item.survey_kind === 'petition' && item.petition_goal" class="svtbl__muted"
              >/ {{ nf(item.petition_goal) }}</span
            >
          </td>
          <td class="r">
            <span class="svtbl__close">{{ surveyState(item).short }}</span>
          </td>
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
.svtbl {
  overflow-x: auto;
}
.svtbl__t {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}
.svtbl__t th {
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
.svtbl__t td {
  padding: 12px 14px;
  border-bottom: 2px solid var(--ds-divide);
  font-size: 14px;
  vertical-align: middle;
}
.svtbl__t .r {
  text-align: right;
}
.svtbl__t tbody tr:last-child td {
  border-bottom: 0;
}
.svtbl__t tbody tr:hover {
  background: var(--ds-tint);
}
.svtbl__main {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}
.svtbl__main--noimg {
  grid-template-columns: minmax(0, 1fr);
}
.svtbl__img {
  width: 72px;
  height: 48px;
  border: 2px solid var(--ds-ol);
  border-radius: 2px;
  object-fit: cover;
}
.svtbl__txt {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.svtbl__title {
  color: var(--ds-text);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  text-decoration: none;
}
.svtbl__title:hover {
  color: var(--ds-link);
}
.svtbl__title:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.svtbl__sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.svtbl__done {
  color: var(--ds-ok);
  font-size: 12px;
  font-weight: 700;
}
.svtbl__kind {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-link);
  font: 500 10.5px/1.2 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
}
.svtbl__who {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.svtbl__muted {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
}
.svtbl__close {
  font: 400 12px var(--ds-num);
}
</style>
