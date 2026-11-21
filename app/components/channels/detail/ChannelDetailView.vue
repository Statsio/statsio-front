<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useChannelProfile } from '@/composables/useChannelProfile'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { publicChannelListPath, publicChannelPath } from '@/lib/content-display'
import { breadcrumbNode, channelNode } from '@/lib/structured-data'
import { activityDaysFromDates, matchesChannelQuery, paceFromRecentCount } from '@/lib/channel-detail'
import type { CatalogItem, CatalogSort } from '@/types/catalog'
import type { DsGlyphKind } from '@/lib/ds/types'
import ChannelHeroV2 from './ChannelHeroV2.vue'
import ChannelTabNav from './ChannelTabNav.vue'
import ChannelContentTab from './ChannelContentTab.vue'
import ChannelOverview from './ChannelOverview.vue'
import ChannelAboutTab from './ChannelAboutTab.vue'
import ChannelSimilarSlider from './ChannelSimilarSlider.vue'
import ChannelCatalogTile from './ChannelCatalogTile.vue'

const {
  channel,
  loading,
  isFollowing,
  isOwner,
  isVerified,
  toggleFollow,
  tabs,
  activeTab,
  categoryLabels,
  createdAtLabel,
  articles,
  statsData,
  surveys,
  counts,
  contentLoading,
  sortArticles,
  sortStatsData,
  sortSurveys,
  toggleItemFavorite,
  isFavorited,
  ready,
} = useChannelProfile()
await ready

const basePath = useContentBasePath()
const requestUrl = useRequestURL()
const listPath = computed(() => publicChannelListPath(basePath.value))
const canonicalPath = computed(() =>
  channel.value ? publicChannelPath(channel.value.handle) : undefined,
)
const channelUrl = computed(() =>
  canonicalPath.value ? `${requestUrl.origin}${canonicalPath.value}` : requestUrl.origin,
)

usePageSeo({
  title: computed(() => channel.value?.name),
  description: computed(() => channel.value?.description),
  image: computed(() => channel.value?.logoUrl ?? undefined),
  type: 'profile',
  canonical: canonicalPath,
  jsonLd: computed(() => {
    const c = channel.value
    if (!c || !canonicalPath.value) return []
    return [
      breadcrumbNode(
        [
          { name: 'Accueil', path: '/' },
          { name: 'Chaînes', path: '/chaines' },
          { name: c.name, path: canonicalPath.value },
        ],
        requestUrl.origin,
      ),
      channelNode(
        {
          url: channelUrl.value,
          name: c.name,
          description: c.description || c.longDescription || undefined,
          image: c.logoUrl ?? c.bannerUrl ?? undefined,
          handle: c.handle,
          dateCreated: c.createdAt,
          subscriberCount: c.subscriptions ?? c.followers,
        },
        requestUrl.origin,
      ),
    ]
  }),
})

const dates = computed(() =>
  [...articles.value, ...statsData.value, ...surveys.value].map(
    (item) => item.updated_at ?? item.created_at,
  ),
)
const activityDays = computed(() => activityDaysFromDates(dates.value))
const pace = computed(() => paceFromRecentCount(activityDays.value.length))
const lastPublishedAt = computed(() => {
  const stamps = dates.value
    .map((iso) => (iso ? new Date(iso).getTime() : Number.NaN))
    .filter((n) => !Number.isNaN(n))
  if (!stamps.length) return null
  return new Date(Math.max(...stamps)).toISOString()
})
const surveyResponses = computed(() =>
  surveys.value.reduce((sum, item) => sum + (item.responses_count ?? 0), 0),
)

const navTabs = computed(() =>
  tabs.map((tab) => {
    const extra: { count?: number; glyph?: DsGlyphKind } = {}
    if (tab.key === 'statsdata') {
      extra.count = counts.value.statsdata
      extra.glyph = 'statsdata'
    } else if (tab.key === 'articles') {
      extra.count = counts.value.articles
      extra.glyph = 'article'
    } else if (tab.key === 'sondages') {
      extra.count = counts.value.surveys
      extra.glyph = 'sondage'
    }
    return { ...tab, ...extra }
  }),
)

const articleQuery = ref('')
const statsQuery = ref('')
const surveyQuery = ref('')

function filtered(items: CatalogItem[], query: string) {
  return items.filter((item) => matchesChannelQuery(item, query))
}
const shownArticles = computed(() => filtered(articles.value, articleQuery.value))
const shownStats = computed(() => filtered(statsData.value, statsQuery.value))
const shownSurveys = computed(() => filtered(surveys.value, surveyQuery.value))

const heroEl = ref<HTMLElement | null>(null)
const heroGone = ref(false)
let observer: IntersectionObserver | undefined
onMounted(() => {
  const el = heroEl.value
  if (!el || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(([entry]) => {
    heroGone.value = entry ? !entry.isIntersecting : false
  })
  observer.observe(el)
})
onUnmounted(() => observer?.disconnect())

function onSort(target: 'articles' | 'statsdata' | 'surveys', value: CatalogSort) {
  if (target === 'articles') sortArticles.value = value
  else if (target === 'statsdata') sortStatsData.value = value
  else sortSurveys.value = value
}
</script>

<template>
  <div v-if="loading" class="ds-scope chpage">
    <p class="chpage__loading">Chargement de la chaîne…</p>
  </div>

  <div v-else-if="channel" class="ds-scope chpage">
    <div ref="heroEl">
      <ChannelHeroV2
        :channel="channel"
        :is-owner="isOwner"
        :is-following="isFollowing"
        :is-verified="isVerified"
        :category-labels="categoryLabels"
        :articles-count="counts.articles"
        :stats-data-count="counts.statsdata"
        :surveys-count="counts.surveys"
        :survey-responses="surveyResponses"
        :activity-days="activityDays"
        :pace="pace"
        :last-published-at="lastPublishedAt"
        :list-path="listPath"
        :created-at-label="createdAtLabel"
        @toggle-follow="toggleFollow"
      />
    </div>

    <ChannelTabNav
      v-model="activeTab"
      :tabs="navTabs"
      :channel="channel"
      :show-mini="heroGone"
      :is-owner="isOwner"
      :is-following="isFollowing"
      @toggle-follow="toggleFollow"
    />

    <div class="ds-max chpage__body">
      <ChannelOverview
        v-if="activeTab === 'featured'"
        :channel-name="channel.name"
        :description="channel.longDescription || channel.description"
        :articles="articles"
        :stats-data="statsData"
        :surveys="surveys"
        :loading="contentLoading"
        :is-favorited="isFavorited"
        @favorite="toggleItemFavorite"
        @view-tab="activeTab = $event"
      />

      <ChannelContentTab
        v-else-if="activeTab === 'statsdata'"
        :sort="sortStatsData"
        :query="statsQuery"
        :loading="contentLoading"
        :shown="shownStats.length"
        :total="counts.statsdata"
        :unit="{ one: 'StatsData', many: 'StatsData' }"
        empty-title="Aucune StatsData publiée pour le moment."
        @update:sort="onSort('statsdata', $event)"
        @update:query="statsQuery = $event"
      >
        <ChannelCatalogTile
          v-for="item in shownStats"
          :key="item.id"
          :item="item"
          type="statsdata"
          :favorited="isFavorited(item)"
          :query="statsQuery"
          @favorite="toggleItemFavorite(item)"
        />
      </ChannelContentTab>

      <ChannelContentTab
        v-else-if="activeTab === 'articles'"
        :sort="sortArticles"
        :query="articleQuery"
        :loading="contentLoading"
        :shown="shownArticles.length"
        :total="counts.articles"
        :unit="{ one: 'article', many: 'articles' }"
        empty-title="Aucun article publié pour le moment."
        @update:sort="onSort('articles', $event)"
        @update:query="articleQuery = $event"
      >
        <ChannelCatalogTile
          v-for="item in shownArticles"
          :key="item.id"
          :item="item"
          type="article"
          :favorited="isFavorited(item)"
          :query="articleQuery"
          @favorite="toggleItemFavorite(item)"
        />
      </ChannelContentTab>

      <ChannelContentTab
        v-else-if="activeTab === 'sondages'"
        :sort="sortSurveys"
        :query="surveyQuery"
        :loading="contentLoading"
        :shown="shownSurveys.length"
        :total="counts.surveys"
        :unit="{ one: 'sondage', many: 'sondages' }"
        empty-title="Aucun sondage publié pour le moment."
        @update:sort="onSort('surveys', $event)"
        @update:query="surveyQuery = $event"
      >
        <ChannelCatalogTile
          v-for="item in shownSurveys"
          :key="item.id"
          :item="item"
          type="survey"
          :favorited="isFavorited(item)"
          :query="surveyQuery"
          @favorite="toggleItemFavorite(item)"
        />
      </ChannelContentTab>

      <ChannelAboutTab
        v-else-if="activeTab === 'apropos'"
        :channel="channel"
        :category-labels="categoryLabels"
        :created-at-label="createdAtLabel"
        :articles-count="counts.articles"
        :stats-data-count="counts.statsdata"
        :surveys-count="counts.surveys"
        :survey-responses="surveyResponses"
      />

      <ChannelSimilarSlider :channel="channel" />
    </div>
  </div>
</template>

<style scoped>
.chpage {
  background: var(--ds-bg);
  padding-bottom: 72px;
}
.chpage__loading {
  padding: 80px 16px;
  color: var(--ds-muted);
  text-align: center;
}
.chpage__body {
  padding-bottom: 24px;
}
</style>
