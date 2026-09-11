<script setup lang="ts">
import { computed } from 'vue'
import { useChannelProfile } from '@/composables/useChannelProfile'
import { breadcrumbNode, channelNode } from '@/lib/structured-data'
import type { CatalogSort } from '@/types/catalog'
import ArticleCard from '@/components/content/ArticleCard.vue'
import StatsDataCard from '@/components/content/StatsDataCard.vue'
import SurveyCard from '@/components/content/SurveyCard.vue'
import ChannelHeroV2 from './ChannelHeroV2.vue'
import ChannelTabNav from './ChannelTabNav.vue'
import ChannelContentTab from './ChannelContentTab.vue'
import ChannelPreviewSection from './ChannelPreviewSection.vue'
import ChannelAboutTab from './ChannelAboutTab.vue'
import ChannelSimilarSlider from './ChannelSimilarSlider.vue'

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
} = useChannelProfile()

const requestUrl = useRequestURL()
const channelUrl = computed(() =>
  channel.value ? `${requestUrl.origin}/channels/${channel.value.handle}` : requestUrl.origin,
)

usePageSeo({
  title: computed(() => channel.value?.name),
  description: computed(() => channel.value?.description),
  image: computed(() => channel.value?.logoUrl ?? undefined),
  type: 'profile',
  canonical: computed(() => (channel.value ? `/channels/${channel.value.handle}` : undefined)),
  jsonLd: computed(() => {
    const c = channel.value
    if (!c) return []
    return [
      breadcrumbNode(
        [
          { name: 'Accueil', path: '/' },
          { name: 'Chaînes', path: '/chaines' },
          { name: c.name, path: `/channels/${c.handle}` },
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

const CONTENT_SORTS: { value: CatalogSort; label: string }[] = [
  { value: 'trend', label: 'Popularité' },
  { value: 'created', label: 'Date de création' },
  { value: 'recent', label: 'Date de modification' },
]
const articleSorts = CONTENT_SORTS
const statsDataSorts = CONTENT_SORTS
const surveySorts = CONTENT_SORTS

const articlesPreview = computed(() => articles.value.slice(0, 3))
const statsDataPreview = computed(() => statsData.value.slice(0, 3))
const surveysPreview = computed(() => surveys.value.slice(0, 2))
const hasAnyContent = computed(
  () => articles.value.length > 0 || statsData.value.length > 0 || surveys.value.length > 0,
)
</script>

<template>
  <div class="bg-[#f4f3f8] pb-24">
    <div v-if="loading" class="flex items-center justify-center py-32">
      <p class="text-slate-500">Chargement de la chaîne…</p>
    </div>

    <template v-else-if="channel">
      <ChannelHeroV2
        :channel="channel"
        :is-owner="isOwner"
        :is-following="isFollowing"
        :is-verified="isVerified"
        :category-labels="categoryLabels"
        :articles-count="counts.articles"
        :stats-data-count="counts.statsdata"
        :surveys-count="counts.surveys"
        @toggle-follow="toggleFollow"
      />

      <ChannelTabNav v-model="activeTab" :tabs="tabs" />

      <div class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <!-- APERÇU -->
        <div v-if="activeTab === 'featured'" class="flex flex-col gap-10 py-8">
          <p v-if="!contentLoading && !hasAnyContent" class="text-sm text-slate-500">
            Cette chaîne n’a encore rien publié.
          </p>

          <ChannelPreviewSection
            v-if="contentLoading || articlesPreview.length"
            title="Articles récents"
            link-label="Voir tous les articles"
            @view-all="activeTab = 'articles'"
          >
            <ArticleCard
              v-for="item in articlesPreview"
              :key="item.id"
              :item="item"
              format="card"
              :favorited="isFavorited(item)"
              @favorite="toggleItemFavorite(item)"
            />
          </ChannelPreviewSection>

          <ChannelPreviewSection
            v-if="contentLoading || statsDataPreview.length"
            title="StatsData publiés"
            link-label="Voir tous les StatsData"
            @view-all="activeTab = 'statsdata'"
          >
            <StatsDataCard
              v-for="item in statsDataPreview"
              :key="item.id"
              :item="item"
              format="card"
              :favorited="isFavorited(item)"
              @favorite="toggleItemFavorite(item)"
            />
          </ChannelPreviewSection>

          <ChannelPreviewSection
            v-if="contentLoading || surveysPreview.length"
            title="Sondages en cours"
            link-label="Voir tous les sondages"
            @view-all="activeTab = 'sondages'"
          >
            <SurveyCard
              v-for="item in surveysPreview"
              :key="item.id"
              :item="item"
              format="card"
              :favorited="isFavorited(item)"
              @favorite="toggleItemFavorite(item)"
            />
          </ChannelPreviewSection>
        </div>

        <!-- ARTICLES -->
        <ChannelContentTab
          v-else-if="activeTab === 'articles'"
          v-model:sort="sortArticles"
          :sort-options="articleSorts"
          :loading="contentLoading"
          :is-empty="!articles.length"
          empty-text="Aucun article publié pour le moment."
        >
          <ArticleCard
            v-for="item in articles"
            :key="item.id"
            :item="item"
            format="card"
            :favorited="isFavorited(item)"
            @favorite="toggleItemFavorite(item)"
          />
        </ChannelContentTab>

        <!-- STATSDATA -->
        <ChannelContentTab
          v-else-if="activeTab === 'statsdata'"
          v-model:sort="sortStatsData"
          :sort-options="statsDataSorts"
          :loading="contentLoading"
          :is-empty="!statsData.length"
          empty-text="Aucune StatsData publiée pour le moment."
        >
          <StatsDataCard
            v-for="item in statsData"
            :key="item.id"
            :item="item"
            format="card"
            :favorited="isFavorited(item)"
            @favorite="toggleItemFavorite(item)"
          />
        </ChannelContentTab>

        <!-- SONDAGES -->
        <ChannelContentTab
          v-else-if="activeTab === 'sondages'"
          v-model:sort="sortSurveys"
          :sort-options="surveySorts"
          :loading="contentLoading"
          :is-empty="!surveys.length"
          empty-text="Aucun sondage publié pour le moment."
        >
          <SurveyCard
            v-for="item in surveys"
            :key="item.id"
            :item="item"
            format="card"
            :favorited="isFavorited(item)"
            @favorite="toggleItemFavorite(item)"
          />
        </ChannelContentTab>

        <!-- À PROPOS -->
        <ChannelAboutTab
          v-else-if="activeTab === 'apropos'"
          :channel="channel"
          :category-labels="categoryLabels"
          :created-at-label="createdAtLabel"
          :articles-count="counts.articles"
          :stats-data-count="counts.statsdata"
          :surveys-count="counts.surveys"
        />

        <ChannelSimilarSlider :channel="channel" />
      </div>
    </template>
  </div>
</template>
