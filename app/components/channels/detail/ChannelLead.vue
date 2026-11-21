<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import { formatCatalogViews, formatRelativePublished } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { glyphForContentType } from '@/lib/ds/types'
import { useContentBasePath } from '@/composables/useContentBasePath'
import type { CatalogItem } from '@/types/catalog'
import type { ContentType } from '@/types/content-creation'

const props = defineProps<{ item: CatalogItem; type: ContentType }>()

const basePath = useContentBasePath()
const to = computed(() => publicContentPath(props.type, props.item.slug, basePath.value))
const label = computed(() =>
  props.type === 'statsdata' ? 'StatsData' : props.type === 'survey' ? 'Sondage' : 'Article',
)
const cta = computed(() =>
  props.type === 'statsdata'
    ? 'Ouvrir le StatsData'
    : props.type === 'survey'
      ? 'Voir le sondage'
      : "Lire l'article",
)
const when = computed(() => formatRelativePublished(props.item.updated_at ?? props.item.created_at))
</script>

<template>
  <DsBox as="article" interactive class="lead" :class="{ 'lead--plain': !item.thumbnail_url }">
    <NuxtLink v-if="item.thumbnail_url" :to="to" class="lead__im" tabindex="-1" aria-hidden="true">
      <AppMediaImage :src="item.thumbnail_url" alt="" class="lead__img" />
      <span class="lead__une">{{ label }}<template v-if="item.is_featured"> · épinglé</template></span>
    </NuxtLink>
    <div class="lead__tx">
      <div class="lead__top">
        <span class="lead__kind">
          <DsTypeGlyph :kind="glyphForContentType(type)" :size="12" />{{ label }}
        </span>
        <span class="lead__meta">{{ when }}</span>
      </div>
      <NuxtLink :to="to" class="lead__t"><h2>{{ item.title }}</h2></NuxtLink>
      <p v-if="item.description" class="lead__ex">{{ item.description }}</p>
      <div class="lead__ft">
        <span class="lead__meta">{{ formatCatalogViews(item.views_count) }}</span>
        <DsButton size="sm" :to="to">{{ cta }} <span aria-hidden="true">→</span></DsButton>
      </div>
    </div>
  </DsBox>
</template>

<style scoped>
.lead {
  display: grid;
  overflow: hidden;
}
@media (min-width: 861px) {
  .lead:not(.lead--plain) {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  }
}
.lead__im {
  position: relative;
  display: block;
  min-height: 220px;
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-tint);
}
@media (min-width: 861px) {
  .lead:not(.lead--plain) .lead__im {
    min-height: 300px;
    border-right: 2px solid var(--ds-ol);
    border-bottom: 0;
  }
}
.lead__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.lead__une {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1;
  padding: 7px 9px;
  border: 2px solid #fff;
  border-radius: 2px;
  background: var(--ds-violet-700, #6d28d9);
  color: #fff;
  font: 500 11px/1 var(--ds-num);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.lead__tx {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 26px;
}
.lead__top {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}
.lead__kind {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-text);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.lead__meta {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
}
.lead__t {
  color: inherit;
  text-decoration: none;
}
.lead__t h2 {
  margin: 0;
  font: 800 clamp(28px, 3vw, 42px) / 1 var(--ds-display);
  font-stretch: 90%;
  letter-spacing: -0.015em;
}
.lead__t:hover h2 {
  color: var(--ds-link);
}
.lead__ex {
  margin: 0;
  color: var(--ds-muted);
  font-size: 16px;
}
.lead__ft {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 14px;
  border-top: 2px solid var(--ds-divide);
}
</style>
