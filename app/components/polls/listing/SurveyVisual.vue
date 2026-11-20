<script setup lang="ts">
import { computed } from 'vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import SurveyDial from './SurveyDial.vue'
import SurveyKindGlyph from './SurveyKindGlyph.vue'
import { surveyKindOf } from '@/lib/surveys-listing'
import type { CatalogItem } from '@/types/catalog'

/**
 * Visuel d'une carte de consultation.
 * - Avec miniature : la miniature, et l'état de la consultation (cadran + lecture)
 *   en surimpression quand la carte est survolée ou focalisée (`active`).
 * - Sans miniature : le cadran directement.
 * Les données viennent du catalogue (aucune requête). Duplique le lien du titre
 * pour la souris (hors tabulation, masqué aux lecteurs d'écran).
 */
const props = withDefaults(
  defineProps<{ item: CatalogItem; to: string; active?: boolean; size?: 'md' | 'lg' }>(),
  {
    active: false,
    size: 'md',
  },
)

const hasThumb = computed(() => Boolean(props.item.thumbnail_url))
const kind = computed(() => surveyKindOf(props.item))
</script>

<template>
  <NuxtLink
    :to="to"
    class="svviz"
    :class="[
      `svviz--${size}`,
      hasThumb ? 'svviz--thumb' : 'svviz--dial',
      { 'is-on': hasThumb && active },
    ]"
    tabindex="-1"
    aria-hidden="true"
  >
    <template v-if="hasThumb">
      <AppMediaImage :src="item.thumbnail_url" alt="" class="svviz__img" loading="lazy" />
      <span class="svviz__hint"
        ><SurveyKindGlyph :kind="item.survey_kind" :size="12" />{{ kind.label }}</span
      >
    </template>
    <div class="svviz__dial">
      <SurveyDial :item="item" :size="size" />
    </div>
    <slot />
  </NuxtLink>
</template>

<style scoped>
.svviz {
  position: relative;
  display: block;
  overflow: hidden;
  background: var(--ds-tint);
  color: inherit;
  text-decoration: none;
}
.svviz--thumb {
  aspect-ratio: 16 / 9;
}
.svviz--dial {
  padding: 14px;
}
.svviz--lg.svviz--dial {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 26px;
}
.svviz__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s var(--ds-e-glisse);
}
.svviz.is-on .svviz__img {
  transform: scale(1.04);
}

/* surimpression du cadran sur la miniature */
.svviz--thumb .svviz__dial {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: color-mix(in srgb, var(--ds-tint) 94%, transparent);
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 0.25s,
    transform 0.3s var(--ds-e-glisse);
  pointer-events: none;
}
.svviz--thumb .svviz__dial > * {
  width: 100%;
}
.svviz--lg.svviz--thumb .svviz__dial {
  padding: 26px;
}
.svviz.is-on .svviz__dial {
  opacity: 1;
  transform: none;
}

.svviz__hint {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border: 2px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-surface);
  color: var(--ds-link);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: opacity 0.2s;
}
.svviz.is-on .svviz__hint {
  opacity: 0;
}
</style>
