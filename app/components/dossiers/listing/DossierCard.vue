<script setup lang="ts">
import DsBox from '@/components/ds/DsBox.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import DossierBinderTop from './DossierBinderTop.vue'
import DossierFlags from './DossierFlags.vue'
import DossierFollowButton from './DossierFollowButton.vue'
import DossierMosaic from './DossierMosaic.vue'
import DossierRecentList from './DossierRecentList.vue'
import { formatRelativePublished } from '@/lib/catalog-format'
import type { RubricBadge } from '@/lib/listing-rubrics'
import type { DossierCatalogItem } from '@/types/dossier'

/**
 * Carte « classeur » de la grille : onglet + intercalaires par type, mosaïque des
 * derniers contenus, thème / épinglé / sous-marque, titre (lien principal),
 * description, 3 derniers ajouts, date du dernier ajout et bouton « Suivre ».
 */
defineProps<{
  item: DossierCatalogItem
  to: string
  rubric: RubricBadge | null
  following: boolean
  query?: string
}>()
const emit = defineEmits<{ follow: [] }>()
</script>

<template>
  <article class="dos">
    <DossierBinderTop :item="item" />
    <DsBox class="dos__box">
      <DossierMosaic :item="item" :to="to" />
      <div class="dos__bd">
        <DossierFlags :item="item" :rubric="rubric" />
        <NuxtLink :to="to" class="dos__t">
          <h3><DsHighlight :text="item.name" :query="query" /></h3>
        </NuxtLink>
        <p v-if="item.description" class="dos__dsc">{{ item.description }}</p>
        <DossierRecentList :items="(item.recent ?? []).slice(0, 3)" :query="query" />
        <div class="dos__ft">
          <span class="dos__meta">
            Dernier ajout <b>{{ formatRelativePublished(item.updated_at) }}</b>
          </span>
          <DossierFollowButton :following="following" :name="item.name" @toggle="emit('follow')" />
        </div>
      </div>
    </DsBox>
  </article>
</template>

<style scoped>
.dos {
  position: relative;
  display: flex;
  flex-direction: column;
  transition: transform 0.15s;
}
.dos:hover {
  transform: translate(-2px, -2px);
}
.dos__box {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border-top-left-radius: 0;
  transition: box-shadow 0.15s;
}
.dos:hover .dos__box {
  box-shadow: 7px 7px 0 var(--ds-sh);
}
.dos__bd {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 11px;
  padding: 16px 18px 18px;
}
.dos__t {
  color: var(--ds-text);
  text-decoration: none;
}
.dos__t h3 {
  margin: 0;
  font: 800 28px/0.98 var(--ds-display);
  font-stretch: 90%;
  letter-spacing: -0.015em;
  text-wrap: balance;
}
.dos__t:hover h3 {
  color: var(--ds-link);
}
.dos__t:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}
.dos__dsc {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--ds-muted);
  font-size: 14.5px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.dos__ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 2px solid var(--ds-divide);
}
.dos__meta {
  color: var(--ds-faint);
  font: 400 12px/1.35 var(--ds-num);
}
.dos__meta b {
  color: var(--ds-text);
  font-weight: 500;
}
@media (prefers-reduced-motion: reduce) {
  .dos,
  .dos__box {
    transition: none;
  }
}
</style>
