<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { StatsDataDocument } from '@/api/studio'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import StatsDataByline from '@/components/statsdata/detail/StatsDataByline.vue'
import { publicDossierPath } from '@/lib/content-display'
import { resolveArticleFormat } from '@/lib/articleFormat'
import { useContentBasePath } from '@/composables/useContentBasePath'

/**
 * Hero d'article — charte « Tranches » (maquette Incendies) :
 * dossier, rubrique, dates, titre display, chapô, signature, bandeau de faits,
 * actions et couverture.
 */
const props = defineProps<{
  doc: StatsDataDocument
  readingMinutes: number
  linkedCount: number
  isFollowing: boolean
  canFollow: boolean
  readHref?: string
  statsHref?: string | null
}>()

defineEmits<{ 'toggle-follow': [] }>()

const basePath = useContentBasePath()
const format = computed(() => resolveArticleFormat(props.doc.categories))

const dossiers = computed(() =>
  (props.doc.dossiers ?? [])
    .filter((d) => Boolean(d?.slug && d?.name))
    .map((d) => ({ ...d, to: publicDossierPath(d.slug, basePath.value) })),
)

function formatDate(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const publishedOn = computed(
  () => formatDate(props.doc.first_published_at) ?? formatDate(props.doc.created_at),
)
const updatedOn = computed(() => {
  const updated = formatDate(props.doc.last_published_at ?? props.doc.updated_at)
  if (!updated || updated === publishedOn.value) return null
  return updated
})

const viewsLabel = computed(() =>
  props.doc.views_count
    ? new Intl.NumberFormat('fr-FR').format(props.doc.views_count)
    : null,
)

const facts = computed(() => {
  const items: { label: string; value: string; meta?: string }[] = [
    { label: 'Lecture', value: `${props.readingMinutes} min` },
  ]
  if (props.linkedCount > 0) {
    items.push({
      label: 'Graphiques',
      value: String(props.linkedCount),
      meta: 'liés au StatsData',
    })
  }
  if (viewsLabel.value) items.push({ label: 'Lectures', value: viewsLabel.value })
  return items
})

const hasCover = computed(() => Boolean(props.doc.thumbnail_url?.trim()))
</script>

<template>
  <section class="arthero ds-max">
    <div class="arthero__grid" :class="{ 'has-cover': hasCover }">
      <div class="min-w-0">
        <div class="arthero__crumbs">
          <RouterLink
            v-for="d in dossiers"
            :key="d.slug"
            :to="d.to"
            class="arthero__dossier"
          >
            <span class="arthero__wedge" aria-hidden="true" />
            <span class="min-w-0 truncate">{{ d.name }}</span>
          </RouterLink>
          <span v-if="format.formatLabel" class="arthero__format">{{ format.formatLabel }}</span>
          <DsLabel v-if="format.theme">{{ format.theme }}</DsLabel>
          <DsMeta v-if="publishedOn">
            Publié le {{ publishedOn }}<template v-if="updatedOn"> · mis à jour le {{ updatedOn }}</template>
          </DsMeta>
        </div>

        <h1 class="arthero__title">{{ doc.title }}</h1>
        <p v-if="doc.description" class="arthero__lede">{{ doc.description }}</p>

        <div class="arthero__by">
          <StatsDataByline
            :doc="doc"
            :is-following="isFollowing"
            :can-follow="canFollow"
            @toggle-follow="$emit('toggle-follow')"
          />
          <span aria-hidden="true">·</span>
          <span>{{ readingMinutes }} min de lecture</span>
        </div>

        <dl v-if="facts.length" class="arthero__facts" :style="{ '--n': facts.length }">
          <div v-for="f in facts" :key="f.label">
            <dt><DsLabel>{{ f.label }}</DsLabel></dt>
            <dd>
              <b class="ds-tnum">{{ f.value }}</b>
              <DsMeta v-if="f.meta">{{ f.meta }}</DsMeta>
            </dd>
          </div>
        </dl>

        <div class="arthero__cta">
          <DsButton :href="readHref || '#article'">
            Lire l'article <span aria-hidden="true">↓</span>
          </DsButton>
          <DsButton v-if="statsHref" variant="secondary" :href="statsHref">
            Ouvrir le StatsData
          </DsButton>
        </div>
      </div>

      <figure v-if="hasCover" class="arthero__fig">
        <div class="arthero__cover">
          <AppMediaImage :src="doc.thumbnail_url!" :alt="doc.title" class="h-full w-full" mark-class="max-w-[96px]" />
        </div>
        <figcaption><DsMeta>Image de couverture de l'article</DsMeta></figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.arthero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  padding-block: 28px 40px;
}
@media (min-width: 900px) {
  .arthero__grid {
    gap: 48px;
    padding-block: 48px 56px;
  }
  .arthero__grid.has-cover {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}
.arthero__crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.arthero__dossier,
.arthero__format {
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
}
.arthero__format {
  border-radius: 3px;
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.08em;
}
.arthero__wedge {
  display: inline-block;
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 100% 0 0 0;
  background: var(--ds-violet-500);
}
.arthero__title {
  margin: 18px 0 20px;
  color: var(--ds-text);
  font: 800 clamp(38px, 5.4vw, 76px) / 0.95 var(--ds-display);
  font-stretch: 90%;
  letter-spacing: -0.025em;
  text-wrap: balance;
}
.arthero__lede {
  max-width: 58ch;
  color: var(--ds-muted);
  font-size: 19px;
  line-height: 1.55;
  text-wrap: pretty;
}
.arthero__by {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  color: var(--ds-muted);
  font-size: 14px;
}
.arthero__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 28px;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-surface);
  box-shadow: 5px 5px 0 var(--ds-sh);
}
.arthero__facts > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-right: 2px solid var(--ds-divide);
  border-bottom: 2px solid var(--ds-divide);
}
.arthero__facts > div:nth-child(2n) {
  border-right: 0;
}
.arthero__facts > div:nth-last-child(-n + 2) {
  border-bottom: 0;
}
.arthero__facts dd {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}
.arthero__facts b {
  color: var(--ds-ol);
  font: 800 24px/1 var(--ds-display);
  font-stretch: 108%;
}
@media (min-width: 620px) {
  .arthero__facts {
    grid-template-columns: repeat(var(--n, 3), minmax(0, 1fr));
  }
  .arthero__facts > div,
  .arthero__facts > div:nth-child(2n) {
    border-right: 2px solid var(--ds-divide);
    border-bottom: 0;
  }
  .arthero__facts > div:last-child {
    border-right: 0;
  }
}
.arthero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}
.arthero__fig {
  margin: 0;
}
.arthero__cover {
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-tint);
  box-shadow: 6px 6px 0 var(--ds-sh);
  aspect-ratio: 16 / 9;
}
@media (min-width: 900px) {
  .arthero__cover {
    aspect-ratio: 294 / 458;
  }
}
.arthero__cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.arthero__fig figcaption {
  margin-top: 10px;
}
</style>
