<script setup lang="ts">
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import DsHighlight from '@/components/ds/DsHighlight.vue'
import DossierContentThumb from '@/components/dossiers/listing/DossierContentThumb.vue'
import ListingEmptyState from '@/components/listing/tranches/ListingEmptyState.vue'
import ListingEndLine from '@/components/listing/tranches/ListingEndLine.vue'
import ListingResultBar from '@/components/listing/tranches/ListingResultBar.vue'
import { formatCatalogCount, formatReadingTime } from '@/lib/catalog-format'
import { publicChannelPath, publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { dossierTypeMeta } from '@/lib/dossiers-listing'
import { dossierContentType, formatDossierDay, type DossierMonthGroup } from '@/lib/dossier-detail'
import { freshnessLabel } from '@/lib/statsdata-freshness'
import type { CatalogItem } from '@/types/catalog'
import type { ContentType } from '@/types/content-creation'
import type { DossierContentType } from '@/types/dossier'

defineProps<{
  items: CatalogItem[]
  groups: DossierMonthGroup[]
  overall: number | null
  unit: { one: string; many: string }
  context: string
  query: string
  filtered: boolean
  view: 'feed' | 'grid'
  entry: CatalogItem | null
}>()

const emit = defineEmits<{ reset: [] }>()

const basePath = useContentBasePath()
const BAR = ['var(--ds-violet-500)', 'var(--ds-blue-500)', 'var(--ds-violet-300)']

function href(item: CatalogItem) {
  return publicContentPath(dossierContentType(item) as ContentType, item.slug, basePath.value)
}
function channel(item: CatalogItem) {
  const handle = item.publisher?.handle
  return handle ? publicChannelPath(handle, basePath.value) : null
}
function glyph(type: DossierContentType) {
  return dossierTypeMeta(type).glyph
}
function typeLabel(type: DossierContentType) {
  return dossierTypeMeta(type).label
}
function fresh(item: CatalogItem) {
  return item.freshness ? freshnessLabel(item.freshness) : null
}
</script>

<template>
  <div>
    <ListingResultBar
      :total="items.length"
      :unit="unit"
            :overall="filtered ? overall : null"
      :filters="[]"
      :context="context"
    />

    <DsBox v-if="entry" class="dd-start">
      <NuxtLink class="dd-start__th" :to="href(entry)" tabindex="-1" aria-hidden="true">
        <DossierContentThumb :type="dossierContentType(entry)" :src="entry.thumbnail_url" :seed="entry.id" />
        <span class="dd-une">Pour commencer</span>
      </NuxtLink>
      <div class="dd-start__bd">
        <DsLabel>Point d'entrée · <b>choisi par la rédaction</b></DsLabel>
        <NuxtLink class="t" :to="href(entry)"><h3>{{ entry.title }}</h3></NuxtLink>
        <p v-if="entry.description" class="dd-why">{{ entry.description }}</p>
        <div class="dd-foot">
          <span class="dd-chn">
            <span class="dd-av" aria-hidden="true">{{ entry.publisher.initials }}</span>
            {{ entry.publisher.name }}
          </span>
          <DsButton :to="href(entry)" size="sm">
            {{ dossierContentType(entry) === 'article' ? "Lire l'article" : 'Ouvrir' }}
            <span aria-hidden="true">→</span>
          </DsButton>
        </div>
      </div>
    </DsBox>

    <ListingEmptyState
      v-if="!items.length"
      :query="query"
      :filtered="filtered"
      title="Rien de rangé ici"
      empty-title="Ce dossier est encore vide"
      hint="Essayez un autre intercalaire ou une autre recherche."
      @reset="emit('reset')"
    />

    <div v-else-if="view === 'feed'" class="dd-feed">
      <section v-for="group in groups" :key="group.key" :aria-label="group.label">
        <div class="dd-mon">
          <h3>{{ group.label }}</h3>
          <DsMeta>{{ group.summary }}</DsMeta>
          <span v-if="group.opened" class="dd-badge">Ouverture du dossier</span>
        </div>
        <div class="dd-line">
          <article v-for="item in group.items" :id="`dd-${item.id}`" :key="item.id" class="dd-ent">
            <span class="dd-ent__mk" aria-hidden="true">
              <DsTypeGlyph :kind="glyph(dossierContentType(item))" :size="15" :style="{ color: dossierTypeMeta(dossierContentType(item)).color }" mono />
            </span>
            <DsBox class="dd-card" interactive>
              <NuxtLink class="dd-card__th" :to="href(item)" tabindex="-1" aria-hidden="true">
                <DossierContentThumb :type="dossierContentType(item)" :src="item.thumbnail_url" :seed="item.id" />
              </NuxtLink>
              <div class="dd-card__bd">
                <div class="dd-card__top">
                  <span class="dd-kind">
                    <DsTypeGlyph :kind="glyph(dossierContentType(item))" :size="12" :style="{ color: dossierTypeMeta(dossierContentType(item)).color }" mono />
                    {{ typeLabel(dossierContentType(item)) }}
                  </span>
                  <DsMeta>Ajouté le {{ formatDossierDay(item.created_at || item.updated_at) }}</DsMeta>
                </div>
                <NuxtLink class="t" :to="href(item)">
                  <h4><DsHighlight :text="item.title" :query="query" /></h4>
                </NuxtLink>
                <p v-if="item.description" class="ex"><DsHighlight :text="item.description" :query="query" /></p>
                <span
                  v-if="item.type === 'survey' && item.primary_options?.length"
                  class="dd-vbar"
                  role="img"
                  :aria-label="item.primary_options.map((row) => `${row.label} ${row.pct} %`).join(', ')"
                >
                  <span
                    v-for="(row, index) in item.primary_options.slice(0, 3)"
                    :key="row.label"
                    :style="{ flex: `${row.pct} 1 0`, background: BAR[index] }"
                  />
                </span>
                <div class="dd-foot">
                  <NuxtLink v-if="channel(item)" class="dd-chn" :to="channel(item)!">
                    <span class="dd-av" aria-hidden="true">
                      <img v-if="item.publisher.logo_url" :src="item.publisher.logo_url" alt="" />
                      <template v-else>{{ item.publisher.initials }}</template>
                    </span>
                    {{ item.publisher.name }}
                  </NuxtLink>
                  <span v-else class="dd-chn">
                    <span class="dd-av" aria-hidden="true">{{ item.publisher.initials }}</span>
                    {{ item.publisher.name }}
                  </span>
                  <span v-if="item.type === 'statsdata' && fresh(item)" class="dd-fresh">
                    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M2.5 8.5 6 12l7.5-8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
                    </svg>
                    {{ fresh(item)!.text }}<template v-if="fresh(item)!.detail"> · {{ fresh(item)!.detail }}</template>
                  </span>
                  <DsMeta v-else-if="item.type === 'article'">
                    {{ formatReadingTime(item.reading_minutes) }} · {{ formatCatalogCount(item.views_count) }} lectures
                  </DsMeta>
                  <DsButton v-else :to="href(item)" size="sm">Répondre <span aria-hidden="true">→</span></DsButton>
                </div>
              </div>
            </DsBox>
          </article>
        </div>
      </section>
    </div>

    <div v-else class="dd-grid">
      <DsBox v-for="item in items" :id="`dd-${item.id}`" :key="item.id" as="article" class="dd-gcard" interactive>
        <NuxtLink class="dd-gcard__im" :to="href(item)" tabindex="-1" aria-hidden="true">
          <DossierContentThumb :type="dossierContentType(item)" :src="item.thumbnail_url" :seed="item.id" />
          <span class="dd-kind dd-gcard__tk">
            <DsTypeGlyph :kind="glyph(dossierContentType(item))" :size="10" mono />
            {{ typeLabel(dossierContentType(item)) }}
          </span>
        </NuxtLink>
        <div class="dd-gcard__bd">
          <div class="dd-card__top">
            <DsMeta>{{ formatDossierDay(item.created_at || item.updated_at) }}</DsMeta>
            <DsMeta v-if="item.type === 'article'">{{ item.reading_minutes }} min</DsMeta>
          </div>
          <NuxtLink class="t" :to="href(item)">
            <h3><DsHighlight :text="item.title" :query="query" /></h3>
          </NuxtLink>
          <span class="dd-chn">
            <span class="dd-av" aria-hidden="true">{{ item.publisher.initials }}</span>
            {{ item.publisher.name }}
          </span>
        </div>
      </DsBox>
    </div>

    <ListingEndLine
      v-if="items.length"
      :total="items.length"
      :overall="filtered ? overall : null"
      :unit="unit"
    />
  </div>
</template>
