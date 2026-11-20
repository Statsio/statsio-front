<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import DsChip from '@/components/ds/DsChip.vue'
import DsKindTag from '@/components/ds/DsKindTag.vue'
import DsRichTitle from '@/components/ds/DsRichTitle.vue'
import DsSectionHead from '@/components/ds/DsSectionHead.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import { formatRelativePublished } from '@/lib/catalog-format'
import { filterFeed, type HomeFeedEntry, type HomeFeedFilter } from '@/lib/home-tranches'
import type { DsGlyphKind } from '@/lib/ds/types'
import type { HomeTranchesContent } from '@/data/brands/statsio/home-tranches'

/**
 * Fil « En direct » : publications récentes et synchronisations de sources, sur
 * une frise verticale. Filtrable (Tout / Données / Publications / Sondages).
 * Le slot `aside` reçoit la question du jour (colonne de droite en desktop).
 */
const props = defineProps<{ content: HomeTranchesContent['live']; entries: HomeFeedEntry[] }>()

const FILTERS: { value: HomeFeedFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'data', label: 'Données mises à jour' },
  { value: 'pub', label: 'Publications' },
  { value: 'sondage', label: 'Sondages' },
]
const filter = ref<HomeFeedFilter>('all')
const rows = computed(() => filterFeed(props.entries, filter.value))

const GLYPH: Record<HomeFeedEntry['kind'], DsGlyphKind> = {
  data: 'data',
  article: 'article',
  statsdata: 'statsdata',
  sondage: 'sondage',
}
</script>

<template>
  <section id="direct" class="lf" aria-labelledby="lf-title">
    <div class="ds-max lf__grid">
      <div>
        <DsSectionHead :label="content.label" heading-id="lf-title">
          <template #title><DsRichTitle :parts="content.title" /></template>
          {{ content.description }}
        </DsSectionHead>

        <div class="lf__filters" role="group" aria-label="Filtrer le fil">
          <DsChip v-for="f in FILTERS" :key="f.value" :pressed="filter === f.value" @click="filter = f.value">
            {{ f.label }}
          </DsChip>
        </div>

        <p v-if="!rows.length" class="lf__empty">Rien de neuf dans cette catégorie pour l'instant.</p>
        <TransitionGroup v-else tag="ol" name="lf" class="lf__feed">
          <li v-for="entry in rows" :key="entry.key" class="lf__row">
            <span class="lf__mark" aria-hidden="true"><DsTypeGlyph :kind="GLYPH[entry.kind]" :size="18" /></span>
            <div class="min-w-0">
              <div class="lf__when">
                <time :datetime="entry.at">{{ formatRelativePublished(entry.at) }}</time>
                <DsKindTag :kind="entry.kind === 'data' ? 'data' : 'publication'">{{ entry.label }}</DsKindTag>
              </div>
              <RouterLink :to="entry.href" class="lf__what">{{ entry.title }}</RouterLink>
              <div class="lf__who">{{ entry.who }}</div>
            </div>
          </li>
        </TransitionGroup>
      </div>

      <slot name="aside" />
    </div>
  </section>
</template>

<style scoped>
.lf__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 44px;
  align-items: start;
  padding-block: 80px;
}
@media (min-width: 980px) {
  .lf__grid {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  }
}
.lf__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 22px;
}
.lf__empty {
  margin: 0;
  color: var(--ds-muted);
}
.lf__feed {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
}
.lf__feed::before {
  content: '';
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 19px;
  width: 2px;
  background: var(--ds-divide);
}
.lf__row {
  position: relative;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 16px;
  padding-bottom: 22px;
}
.lf__mark {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--ds-ol);
  border-radius: 50%;
  background: var(--ds-surface);
  color: var(--ds-link);
}
.lf__when {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--ds-muted);
  font: 500 11.5px var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.lf__what {
  display: block;
  margin-top: 4px;
  color: var(--ds-text);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
}
.lf__what:hover {
  color: var(--ds-link);
}
.lf__what:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.lf__who {
  margin-top: 2px;
  color: var(--ds-muted);
  font-size: 14px;
}
.lf-enter-active {
  transition:
    opacity 0.3s var(--ds-e-glisse),
    transform 0.3s var(--ds-e-glisse);
}
.lf-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
