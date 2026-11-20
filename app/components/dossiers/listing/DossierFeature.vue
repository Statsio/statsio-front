<script setup lang="ts">
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import DossierBinderTop from './DossierBinderTop.vue'
import DossierComposition from './DossierComposition.vue'
import DossierContentThumb from './DossierContentThumb.vue'
import DossierFlags from './DossierFlags.vue'
import DossierFollowButton from './DossierFollowButton.vue'
import DossierRecentList from './DossierRecentList.vue'
import { formatRelativePublished } from '@/lib/catalog-format'
import { dossierTypeMeta } from '@/lib/dossiers-listing'
import type { RubricBadge } from '@/lib/listing-rubrics'
import type { DossierCatalogItem } from '@/types/dossier'

/**
 * Dossier à la une : la pile des derniers contenus en éventail (s'écarte au
 * survol), puis thème, titre, description, composition en tranche, 5 derniers
 * ajouts et actions.
 */
defineProps<{
  item: DossierCatalogItem
  to: string
  rubric: RubricBadge | null
  following: boolean
  query?: string
}>()
const emit = defineEmits<{ follow: [] }>()

/** position de chaque carte de la pile : décalage x / y et rotation */
const FAN = [
  { x: '-34%', y: '6%', r: '-9deg' },
  { x: '-11%', y: '-4%', r: '-3deg' },
  { x: '12%', y: '3%', r: '4deg' },
  { x: '34%', y: '-6%', r: '10deg' },
]
const fanStyle = (i: number) => {
  const f = FAN[i]!
  return { '--x': f.x, '--y': f.y, '--r': f.r, zIndex: i + 1 }
}
const pileOf = (item: DossierCatalogItem) => (item.recent ?? []).slice(0, FAN.length)
</script>

<template>
  <article class="dos dfeat">
    <DossierBinderTop :item="item" lead="À la une" />
    <DsBox class="dfeat__box">
      <NuxtLink :to="to" class="dfeat__pile" tabindex="-1" aria-hidden="true">
        <figure v-for="(c, i) in pileOf(item)" :key="c.id" :style="fanStyle(i)">
          <span class="dfeat__thumb">
            <DossierContentThumb :type="c.type" :src="c.thumbnail_url" :seed="c.id" />
          </span>
          <figcaption>
            <span class="dfeat__gl" :style="{ color: dossierTypeMeta(c.type).color }">
              <DsTypeGlyph :kind="dossierTypeMeta(c.type).glyph" :size="12" />
            </span>
            <span>{{ c.title }}</span>
          </figcaption>
        </figure>
        <img
          v-if="!pileOf(item).length && item.image_url"
          :src="item.image_url"
          alt=""
          class="dfeat__cover"
        />
        <span class="dfeat__cnt">
          <b class="ds-tnum">{{ item.content_count }}</b><span>contenus rangés</span>
        </span>
      </NuxtLink>

      <div class="dfeat__tx">
        <DossierFlags :item="item" :rubric="rubric" />
        <NuxtLink :to="to" class="dfeat__t">
          <h2><DsHighlight :text="item.name" :query="query" /></h2>
        </NuxtLink>
        <p v-if="item.description" class="dfeat__ex">{{ item.description }}</p>
        <DossierComposition :counts="item.counts" legend />
        <DossierRecentList :items="item.recent ?? []" :query="query" class="dfeat__rec" />
        <div class="dfeat__ft">
          <span class="dfeat__meta">
            Dernier ajout <b>{{ formatRelativePublished(item.updated_at) }}</b>
          </span>
          <span class="dfeat__actions">
            <DsButton :to="to" size="sm">Ouvrir le dossier <span aria-hidden="true">→</span></DsButton>
            <DossierFollowButton :following="following" :name="item.name" @toggle="emit('follow')" />
          </span>
        </div>
      </div>
    </DsBox>
  </article>
</template>

<style scoped>
.dfeat {
  display: flex;
  flex-direction: column;
  margin-bottom: 40px;
  transition: transform 0.15s;
}
.dfeat:hover {
  transform: translate(-2px, -2px);
}
.dfeat__box {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  overflow: hidden;
  border-top-left-radius: 0;
  transition: box-shadow 0.15s;
}
.dfeat:hover .dfeat__box {
  box-shadow: 7px 7px 0 var(--ds-sh);
}
@media (min-width: 861px) {
  .dfeat__box {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.dfeat__pile {
  position: relative;
  min-height: 290px;
  overflow: hidden;
  border-bottom: 2px solid var(--ds-ol);
  background-color: var(--ds-tint);
  background-image: repeating-linear-gradient(
    -45deg,
    transparent 0 22px,
    color-mix(in srgb, var(--ds-violet-300) 22%, transparent) 22px 24px
  );
}
@media (min-width: 861px) {
  .dfeat__pile {
    min-height: 380px;
    border-right: 2px solid var(--ds-ol);
    border-bottom: 0;
  }
}
.dfeat__pile figure {
  --x: 0px;
  --y: 0px;
  --r: 0deg;
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  width: min(56%, 300px);
  margin: 0;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 5px;
  background: var(--ds-surface);
  box-shadow: 4px 4px 0 var(--ds-sh);
  transform: translate(-50%, -50%) translate(var(--x), var(--y)) rotate(var(--r));
  transition: transform 0.5s var(--ds-e-glisse);
}
.dfeat:hover .dfeat__pile figure {
  transform: translate(-50%, -50%) translate(calc(var(--x) * 1.45), calc(var(--y) * 1.3))
    rotate(calc(var(--r) * 1.5));
}
.dfeat__thumb {
  display: block;
  aspect-ratio: 16 / 10;
  border-bottom: 2px solid var(--ds-ol);
}
.dfeat__pile figcaption {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 7px 9px;
  color: var(--ds-text);
  font: 700 12px/1.2 var(--ds-ui);
}
.dfeat__pile figcaption > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dfeat__gl {
  display: flex;
}
.dfeat__cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dfeat__cnt {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 10px 12px;
  border: 2px solid var(--ds-ol);
  border-radius: 4px;
  background: var(--ds-surface);
  box-shadow: 3px 3px 0 var(--ds-sh2);
}
.dfeat__cnt b {
  color: var(--ds-accent);
  font: 800 34px/1 var(--ds-display);
  font-stretch: 110%;
}
.dfeat__cnt span {
  color: var(--ds-muted);
  font: 500 10px/1.2 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.dfeat__tx {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px 26px 26px;
}
.dfeat__t {
  color: var(--ds-text);
  text-decoration: none;
}
.dfeat__t h2 {
  margin: 0;
  font: 800 clamp(34px, 3.6vw, 52px) / 0.95 var(--ds-display);
  font-stretch: 90%;
  letter-spacing: -0.02em;
  text-wrap: balance;
}
.dfeat__t:hover h2 {
  color: var(--ds-link);
}
.dfeat__t:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.dfeat__ex {
  margin: 0;
  color: var(--ds-muted);
  font-size: 16px;
}
.dfeat__rec {
  --drec-pad: 8px;
  --drec-fs: 14.5px;
}
.dfeat__ft {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 2px solid var(--ds-divide);
}
.dfeat__meta {
  color: var(--ds-faint);
  font: 400 12px/1.35 var(--ds-num);
}
.dfeat__meta b {
  color: var(--ds-text);
  font-weight: 500;
}
.dfeat__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
@media (prefers-reduced-motion: reduce) {
  .dfeat,
  .dfeat__box,
  .dfeat__pile figure {
    transition: none;
  }
}
</style>
