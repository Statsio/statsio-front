<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import StatsDataPreviewChart from './StatsDataPreviewChart.vue'
import { useInViewOnce } from '@/composables/useInViewOnce'
import { useStatsDataPreview } from '@/composables/useStatsDataPreview'
import type { CatalogItem } from '@/types/catalog'

/**
 * Visuel d'une carte StatsData.
 * - Avec miniature : la miniature, et le graphique lié en surimpression quand la
 *   carte est survolée ou focalisée (`active`) ; l'aperçu n'est chargé qu'au
 *   premier survol.
 * - Sans miniature : le graphique lié directement, chargé à l'entrée dans l'écran.
 * Le parent ne rend ce composant que si `hasStatsDataVisual(item)` ; sans miniature,
 * il disparaît si le graphique s'avère inexploitable.
 * Duplique le lien du titre pour la souris (hors tabulation, masqué aux lecteurs
 * d'écran) ; les pastilles posées sur le visuel passent par le slot.
 */
const props = withDefaults(
  defineProps<{ item: CatalogItem; to: string; active?: boolean; size?: 'md' | 'lg' }>(),
  {
    active: false,
    size: 'md',
  },
)

const link = ref<{ $el: Element } | null>(null)
const root = computed(() => link.value?.$el ?? null)
const hasThumb = computed(() => Boolean(props.item.thumbnail_url))
const hasChart = computed(() => props.item.charts_count > 0)
const { preview, status, load } = useStatsDataPreview(() => props.item.slug)

useInViewOnce(
  root,
  () => {
    if (!hasThumb.value && hasChart.value) void load()
  },
  0,
)
watch(
  () => props.active,
  (active) => {
    if (active && hasThumb.value && hasChart.value) void load()
  },
)

const chartShown = computed(() => status.value === 'ready' && (!hasThumb.value || props.active))
</script>

<template>
  <NuxtLink
    v-if="hasThumb || status !== 'empty'"
    ref="link"
    :to="to"
    class="sdviz"
    :class="[`sdviz--${size}`, hasThumb ? 'sdviz--thumb' : 'sdviz--chart', { 'is-on': chartShown }]"
    tabindex="-1"
    aria-hidden="true"
  >
    <AppMediaImage
      v-if="hasThumb"
      :src="item.thumbnail_url"
      alt=""
      class="sdviz__img"
      loading="lazy"
    />

    <div v-if="preview" class="sdviz__chart">
      <StatsDataPreviewChart :preview="preview" :size="size" />
    </div>
    <span v-else-if="!hasThumb && status !== 'empty'" class="sdviz__ghost" />

    <span
      v-if="hasThumb && hasChart && status !== 'empty'"
      class="sdviz__hint"
      :class="{ 'is-loading': status === 'loading' && active }"
    >
      <DsTypeGlyph kind="statsdata" :size="12" />{{ item.charts_count }}
    </span>
    <slot />
  </NuxtLink>
</template>

<style scoped>
.sdviz {
  position: relative;
  display: block;
  overflow: hidden;
  background: var(--ds-tint);
  color: inherit;
  text-decoration: none;
}
.sdviz--thumb {
  aspect-ratio: 16 / 9;
}
.sdviz--chart {
  min-height: 150px;
  padding: 12px 12px 6px;
}
.sdviz--lg.sdviz--chart {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 22px 22px 12px;
}
.sdviz__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s var(--ds-e-glisse);
}
.sdviz--thumb.is-on .sdviz__img {
  transform: scale(1.04);
}

/* surimpression du graphique sur la miniature */
.sdviz--thumb .sdviz__chart {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12px 12px 6px;
  background: color-mix(in srgb, var(--ds-tint) 94%, transparent);
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 0.25s,
    transform 0.3s var(--ds-e-glisse);
  pointer-events: none;
}
.sdviz--lg.sdviz--thumb .sdviz__chart {
  padding: 22px 22px 12px;
}
.sdviz--thumb.is-on .sdviz__chart {
  opacity: 1;
  transform: none;
}
.sdviz__ghost {
  display: block;
  height: 132px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--ds-violet-200) 45%, transparent);
  animation: sdviz-pulse 1.4s ease-in-out infinite alternate;
}
@keyframes sdviz-pulse {
  to {
    opacity: 0.5;
  }
}

/* rappel « ce StatsData a un graphique » sur la miniature */
.sdviz__hint {
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
  font: 500 11px/1 var(--ds-num);
  transition: opacity 0.2s;
}
.sdviz.is-on .sdviz__hint {
  opacity: 0;
}
.sdviz__hint.is-loading :deep(svg) {
  animation: sdviz-spin 0.9s linear infinite;
}
@keyframes sdviz-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
