<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { formatRowCount } from '@/utils/statsDataFormat'
import { primaryFreshness } from '@/lib/statsdata-freshness'
import { publicDossierPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import type { ContentDataset, StatsDataDocument } from '@/api/studio'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import StatsDataByline from './StatsDataByline.vue'

interface HeroAction {
  id: string
  label: string
  otherPage: boolean
  path: string
}

/**
 * Hero d'une page StatsData — charte « Tranches » (Bold Outline) :
 * fil (dossier · rubrique · fraîcheur), titre display, chapô, signature,
 * bandeau de métriques encadré, actions des blocs recherche / paramètre, couverture.
 */
const props = defineProps<{
  doc: StatsDataDocument
  title: string
  isFavorite: boolean
  isFollowing: boolean
  canFollow: boolean
  /** Boutons dérivés des blocs recherche / paramètre de toutes les pages du document. */
  actions?: HeroAction[]
}>()

defineEmits<{ 'toggle-favorite': []; 'toggle-follow': []; activate: [action: HeroAction] }>()

const basePath = useContentBasePath()
const category = computed(() => props.doc.categories?.[0] ?? null)

const dossiers = computed(() =>
  (props.doc.dossiers ?? [])
    .filter((d) => Boolean(d?.slug && d?.name))
    .map((d) => ({ ...d, to: publicDossierPath(d.slug, basePath.value) })),
)

const datasets = computed<ContentDataset[]>(() => props.doc.datasets ?? [])
const freshness = computed(() => primaryFreshness(datasets.value))

const COVERAGE_LABEL: Record<string, string> = {
  mondiale: 'Mondiale',
  continentale: 'Continentale',
  nationale: 'Nationale',
  regionale: 'Régionale',
  locale: 'Locale',
}

const metrics = computed(() => {
  const items: { label: string; value: string; unit?: string }[] = []
  if (props.doc.coverage) items.push({ label: 'Couverture', value: COVERAGE_LABEL[props.doc.coverage] ?? props.doc.coverage })
  const rows = datasets.value.reduce((sum, d) => sum + (d.row_count ?? 0), 0)
  if (rows) {
    // « 28 k lignes » → valeur + unité séparées comme la maquette.
    const txt = formatRowCount(rows) ?? '—'
    const m = txt.match(/^(.*?)\s*(lignes?)$/i)
    items.push(m ? { label: 'Volume', value: m[1]!, unit: m[2] } : { label: 'Volume', value: txt })
  }
  if (datasets.value.length) items.push({ label: 'Sources', value: String(datasets.value.length) })
  if (props.doc.views_count) items.push({ label: 'Consultations', value: new Intl.NumberFormat('fr-FR').format(props.doc.views_count) })
  return items
})

const hasCover = computed(() => Boolean(props.doc.thumbnail_url?.trim()))
</script>

<template>
  <section class="sdhero ds-max">
    <div class="sdhero__grid" :class="{ 'has-cover': hasCover }">
      <div class="min-w-0">
        <div class="sdhero__crumbs">
          <RouterLink
            v-for="d in dossiers"
            :key="d.slug"
            :to="d.to"
            class="sdhero__dossier"
            :title="`Dossier : ${d.name}`"
          >
            <span class="sdhero__wedge" aria-hidden="true" />
            <span class="min-w-0 truncate">{{ d.name }}</span>
          </RouterLink>
          <DsLabel v-if="category">{{ category }}</DsLabel>
          <span v-if="freshness" class="sdhero__fresh" :class="{ 'is-live': freshness.tone === 'live' || freshness.tone === 'fresh' }">
            {{ freshness.tone === 'live' ? 'Données en direct' : freshness.text }}
          </span>
        </div>

        <h1 class="sdhero__title">{{ title }}</h1>
        <p v-if="doc.description" class="sdhero__lede">{{ doc.description }}</p>

        <StatsDataByline
          class="mt-[18px]"
          :doc="doc"
          :is-following="isFollowing"
          :can-follow="canFollow"
          @toggle-follow="$emit('toggle-follow')"
        />

        <dl v-if="metrics.length" class="sdhero__metrics" :style="{ '--n': metrics.length }">
          <div v-for="m in metrics" :key="m.label">
            <dt><DsLabel>{{ m.label }}</DsLabel></dt>
            <dd>
              <b class="ds-tnum">{{ m.value }}</b>
              <DsMeta v-if="m.unit">{{ m.unit }}</DsMeta>
            </dd>
          </div>
        </dl>

        <div v-if="actions?.length || !doc.can_edit" class="sdhero__cta">
          <DsButton
            v-for="(action, i) in actions"
            :key="action.id"
            :variant="i === 0 ? 'primary' : 'secondary'"
            @click="$emit('activate', action)"
          >
            {{ action.label }}<span v-if="i === 0" aria-hidden="true">→</span>
          </DsButton>
          <DsButton
            v-if="!doc.can_edit && !actions?.length"
            variant="secondary"
            :aria-pressed="isFavorite"
            @click="$emit('toggle-favorite')"
          >
            {{ isFavorite ? '★ En favori' : '☆ Ajouter aux favoris' }}
          </DsButton>
        </div>
      </div>

      <figure v-if="hasCover" class="sdhero__fig">
        <div class="sdhero__cover">
          <AppMediaImage :src="doc.thumbnail_url!" :alt="doc.title" class="h-full w-full" mark-class="max-w-[96px]" />
        </div>
        <figcaption><DsMeta>Image de couverture du StatsData</DsMeta></figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.sdhero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  padding-block: 28px 40px;
  align-items: start;
}
@media (min-width: 900px) {
  .sdhero__grid {
    gap: 48px;
    padding-block: 48px 56px;
  }
  .sdhero__grid.has-cover {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}

.sdhero__crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.sdhero__dossier {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 2px solid var(--ds-ol);
  border-radius: 999px;
  background: var(--ds-tint);
  color: var(--ds-ol);
  font: 700 13px/1 var(--ds-ui);
  text-decoration: none;
  transition: background 0.15s;
}
.sdhero__dossier:hover {
  background: var(--ds-surface);
}
.sdhero__wedge {
  display: inline-block;
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 100% 0 0 0;
  background: var(--ds-violet-500);
}
.sdhero__fresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-faint);
  font: 500 11px/1 var(--ds-num);
}
.sdhero__fresh::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 100% 0 0 0;
  background: currentColor;
}
.sdhero__fresh.is-live {
  color: var(--ds-ok);
}

.sdhero__title {
  margin: 18px 0;
  max-width: 18ch;
  color: var(--ds-text);
  font: 800 clamp(42px, 6.2vw, 88px) / 0.92 var(--ds-display);
  font-stretch: 92%;
  letter-spacing: -0.025em;
  text-wrap: balance;
}
.sdhero__lede {
  max-width: 60ch;
  color: var(--ds-muted);
  font: 400 18px/1.6 var(--ds-ui);
  text-wrap: pretty;
}

.sdhero__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 28px 0 0;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-surface);
  box-shadow: 5px 5px 0 var(--ds-sh);
}
.sdhero__metrics > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-right: 2px solid var(--ds-divide);
  border-bottom: 2px solid var(--ds-divide);
}
.sdhero__metrics > div:nth-child(2n) {
  border-right: 0;
}
.sdhero__metrics > div:nth-last-child(-n + 2):nth-child(odd),
.sdhero__metrics > div:last-child {
  border-bottom: 0;
}
.sdhero__metrics dd {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}
.sdhero__metrics b {
  overflow: hidden;
  color: var(--ds-ol);
  font: 800 21px/1 var(--ds-display);
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (min-width: 620px) {
  .sdhero__metrics {
    grid-template-columns: repeat(var(--n, 4), minmax(0, 1fr));
  }
  .sdhero__metrics > div,
  .sdhero__metrics > div:nth-child(2n) {
    border-right: 2px solid var(--ds-divide);
    border-bottom: 0;
  }
  .sdhero__metrics > div:last-child {
    border-right: 0;
  }
  .sdhero__metrics b {
    font-size: 26px;
    font-stretch: 110%;
  }
}

.sdhero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.sdhero__fig {
  margin: 0;
}
.sdhero__cover {
  display: flex;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-tint);
  box-shadow: 6px 6px 0 var(--ds-sh);
}
@media (min-width: 900px) {
  .sdhero__cover {
    aspect-ratio: 294 / 458;
  }
}
.sdhero__cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sdhero__fig figcaption {
  margin-top: 10px;
}
</style>
