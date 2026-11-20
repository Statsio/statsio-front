<script setup lang="ts">
import { computed } from 'vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import DossierContentThumb from './DossierContentThumb.vue'
import { dossierTypeMeta } from '@/lib/dossiers-listing'
import type { DossierCatalogItem } from '@/types/dossier'

/**
 * Mosaïque des 3 derniers contenus rangés (le plus récent en grand), avec le reste
 * en « +N contenus » sur la dernière vignette. Sans contenu : l'image du dossier,
 * ou un fond hachuré. Lien décoratif (hors tabulation) : le titre est le vrai lien.
 */
const props = defineProps<{ item: DossierCatalogItem; to: string }>()

const tiles = computed(() => (props.item.recent ?? []).slice(0, 3))
const rest = computed(() => props.item.content_count - tiles.value.length)
</script>

<template>
  <NuxtLink :to="to" class="dmos" :class="`dmos--${tiles.length}`" tabindex="-1" aria-hidden="true">
    <figure v-for="(c, i) in tiles" :key="c.id">
      <DossierContentThumb :type="c.type" :src="c.thumbnail_url" :seed="c.id" />
      <span v-if="i === 2 && rest > 0" class="dmos__more">
        <b>+{{ rest }}</b><span>contenus</span>
      </span>
      <span v-else class="dmos__kind">
        <DsTypeGlyph :kind="dossierTypeMeta(c.type).glyph" :size="10" />{{ dossierTypeMeta(c.type).label }}
      </span>
    </figure>
    <figure v-if="!tiles.length" class="dmos__empty">
      <img v-if="item.image_url" :src="item.image_url" alt="" loading="lazy" />
    </figure>
  </NuxtLink>
</template>

<style scoped>
.dmos {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  aspect-ratio: 16 / 9;
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-ol);
}
.dmos--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.dmos--3 {
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
}
.dmos--3 figure:first-child {
  grid-row: 1 / 3;
}
.dmos figure {
  position: relative;
  min-width: 0;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  background: var(--ds-tint);
}
.dmos figure > :first-child {
  transition: transform 0.5s var(--ds-e-glisse);
}
:global(.dos:hover) .dmos figure > :first-child {
  transform: scale(1.04);
}
.dmos__empty {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent 0 22px,
    color-mix(in srgb, var(--ds-violet-300) 22%, transparent) 22px 24px
  );
}
.dmos__empty img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dmos__kind {
  position: absolute;
  bottom: 7px;
  left: 7px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px 3px 5px;
  border: 1.5px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-text);
  font: 500 9.5px/1 var(--ds-num);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.dmos__more {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: color-mix(in srgb, var(--ds-violet-700) 84%, transparent);
  color: #fff;
  text-align: center;
}
.dmos__more b {
  font: 800 30px/1 var(--ds-display);
  font-stretch: 110%;
}
.dmos__more span {
  font: 500 9.5px/1 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
