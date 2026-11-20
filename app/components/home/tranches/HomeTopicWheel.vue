<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import DsBox from '@/components/ds/DsBox.vue'
import DsChip from '@/components/ds/DsChip.vue'
import DsHeading from '@/components/ds/DsHeading.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import DsPie from '@/components/ds/DsPie.vue'
import DsRichTitle from '@/components/ds/DsRichTitle.vue'
import DsSectionHead from '@/components/ds/DsSectionHead.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'
import { publicContentListPath, publicContentPath, CONTENT_TYPE_META } from '@/lib/content-display'
import { formatCatalogViews, formatRelativePublished } from '@/lib/catalog-format'
import { glyphForContentType } from '@/lib/ds/types'
import { percentOf } from '@/lib/ds/pie'
import type { HomeTheme } from '@/lib/home-tranches'
import type { CatalogItem } from '@/types/catalog'
import type { HomeTranchesContent } from '@/data/brands/statsio/home-tranches'

/**
 * « Camembert des sujets » : une part par thème (5 max, les autres cités à part).
 * Choisir une part (clic, clavier ou pastille) la détache et affiche ses contenus,
 * chargés à la demande par le parent (`load`) puis mis en cache.
 */
const props = defineProps<{
  content: HomeTranchesContent['explore']
  themes: HomeTheme[]
  others: HomeTheme[]
  items: Record<string, CatalogItem[]>
  loading: string | null
  basePath: string
}>()
const emit = defineEmits<{ load: [value: string] }>()

const COLORS = ['var(--ds-t1)', 'var(--ds-t2)', 'var(--ds-t3)', 'var(--ds-t4)', 'var(--ds-t5)']
const selected = ref(0)

const total = computed(() => props.themes.reduce((a, t) => a + t.count, 0))
const segments = computed(() =>
  props.themes.map((t, i) => ({ value: t.count, color: COLORS[i % COLORS.length]!, label: t.label })),
)
const current = computed(() => props.themes[selected.value] ?? null)
const currentItems = computed(() => (current.value ? (props.items[current.value.value] ?? []) : []))

function choose(i: number) {
  selected.value = i
  const t = props.themes[i]
  if (t) emit('load', t.value)
}

watch(
  () => props.themes.map((t) => t.value).join('|'),
  () => {
    selected.value = 0
    // Chargement à la demande côté client uniquement (rien à attendre en SSR).
    if (import.meta.client && props.themes[0]) emit('load', props.themes[0].value)
  },
  { immediate: true },
)

const itemType = (item: CatalogItem) => (item.type ?? 'article') as 'article' | 'statsdata' | 'survey'
const listHref = (type: 'article' | 'statsdata' | 'survey', cat: string) =>
  `${publicContentListPath(type, props.basePath)}?cat=${encodeURIComponent(cat)}`
</script>

<template>
  <section id="explorer" class="ds-band tw" aria-labelledby="tw-title">
    <div class="ds-max tw__inner">
      <DsSectionHead :label="content.label" heading-id="tw-title">
        <template #title><DsRichTitle :parts="content.title" /></template>
        {{ content.description }}
      </DsSectionHead>

      <div class="tw__grid">
        <div class="tw__wheel">
          <DsPie
            :segments="segments"
            :size="440"
            animate="view"
            :duration="1100"
            interactive
            :selected="selected"
            :detach="9"
            :track="false"
            :ring="false"
            separator="outline"
            label="Sujets"
            class="tw__pie"
            @select="choose"
          />
          <div class="tw__chips">
            <DsChip v-for="(t, i) in themes" :key="t.value" :pressed="selected === i" @click="choose(i)">
              <template #swatch><DsSwatch :color="COLORS[i % COLORS.length]!" /></template>
              {{ t.label }}
              <template #count>{{ t.count }}</template>
            </DsChip>
          </div>
          <p v-if="others.length" class="tw__others">Aussi : {{ others.map((o) => o.label).join(' · ') }}</p>
        </div>

        <DsBox class="tw__panel" aria-live="polite">
          <template v-if="current">
            <div class="tw__ph">
              <DsHeading :level="3" size="lg">{{ current.label }}</DsHeading>
              <DsMeta>{{ current.count }} contenus · {{ percentOf(current.count, total) }} % des sujets</DsMeta>
            </div>
            <p v-if="loading === current.value && !currentItems.length" class="tw__empty">Chargement…</p>
            <p v-else-if="!currentItems.length" class="tw__empty">Aucun contenu publié sur ce sujet pour l'instant.</p>
            <ul v-else class="tw__list">
              <li v-for="item in currentItems" :key="item.id">
                <RouterLink :to="publicContentPath(itemType(item), item.slug, basePath)" class="tw__item">
                  <span class="tw__thumb">
                    <AppMediaImage v-if="item.thumbnail_url" :src="item.thumbnail_url" alt="" class="h-full w-full object-cover" />
                    <DsTypeGlyph v-else :kind="glyphForContentType(itemType(item))" :size="30" />
                  </span>
                  <span class="min-w-0">
                    <span class="tw__badge">
                      <DsTypeGlyph :kind="glyphForContentType(itemType(item))" :size="12" />
                      {{ CONTENT_TYPE_META[itemType(item)].label }}
                    </span>
                    <b class="tw__title">{{ item.title }}</b>
                    <DsMeta>
                      {{ [item.publisher?.name, item.views_count ? formatCatalogViews(item.views_count) : formatRelativePublished(item.updated_at)].filter(Boolean).join(' · ') }}
                    </DsMeta>
                  </span>
                </RouterLink>
              </li>
            </ul>
            <div class="tw__more">
              <RouterLink :to="listHref('statsdata', current.value)">Tous les StatsData « {{ current.label }} » →</RouterLink>
              <RouterLink :to="listHref('article', current.value)">Tous les articles →</RouterLink>
            </div>
          </template>
        </DsBox>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tw__inner {
  padding-block: 80px;
}
.tw__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 44px;
  align-items: start;
}
@media (min-width: 980px) {
  .tw__grid {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  }
}
.tw__wheel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.tw__pie {
  width: 100%;
  max-width: 440px;
}
.tw__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
.tw__others {
  margin: 0;
  color: var(--ds-muted);
  font-size: 13.5px;
  text-align: center;
}
.tw__panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 420px;
  padding: 24px;
}
.tw__ph {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--ds-divide);
}
.tw__empty {
  margin: 0;
  color: var(--ds-muted);
}
.tw__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tw__item {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 8px;
  border: 2px solid var(--ds-divide);
  border-radius: 4px;
  background: var(--ds-surface);
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
}
.tw__item:hover {
  border-color: var(--ds-ol);
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--ds-sh);
}
.tw__item:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.tw__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 62px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--ds-tint);
  color: var(--ds-link);
}
.tw__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
  color: var(--ds-link);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.tw__title {
  display: block;
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.3;
}
.tw__more {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: auto;
}
.tw__more a {
  color: var(--ds-link);
  font-size: 14px;
  font-weight: 700;
}
.tw__more a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
