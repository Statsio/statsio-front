<script setup lang="ts">
import { computed } from 'vue'
import { useChannelProfile } from '@/composables/useChannelProfile'
import { resolveChannelColors } from '@/lib/channel-brand'
import ChannelBreadcrumb from './ChannelBreadcrumb.vue'
import ChannelBanner from './ChannelBanner.vue'
import ChannelProfileHeader from './ChannelProfileHeader.vue'
import ChannelStatsStrip from './ChannelStatsStrip.vue'
import ChannelDetailTabs from './ChannelDetailTabs.vue'
import ChannelFeaturedTab from './ChannelFeaturedTab.vue'
import ChannelFeedList from './ChannelFeedList.vue'
import ChannelDatasetList from './ChannelDatasetList.vue'
import ChannelPollsTab from './ChannelPollsTab.vue'
import ChannelAboutTab from './ChannelAboutTab.vue'
import ChannelSimilarSlider from './ChannelSimilarSlider.vue'

const {
  channel,
  loading,
  isFollowing,
  isOwner,
  toggleFollow,
  tabs,
  activeTab,
  categoryLabels,
  createdAtLabel,
  articles,
  statsData,
  featured,
  enrichedPolls,
  featuredEnrichedSurvey,
} = useChannelProfile()

usePageSeo({
  title: computed(() => channel.value?.name),
  description: computed(() => channel.value?.description),
})

const brandColors = computed(() =>
  channel.value
    ? resolveChannelColors(channel.value.slug, channel.value.customColorPrimary, channel.value.customColorSecondary)
    : { primary: '#8b5cf6', secondary: '#3b82f6' },
)

const categoryLabel = computed(() => categoryLabels.value.join(' — '))
const recentArticles = computed(() => articles.value.slice(0, 3))
const bannerEditHref = computed(() =>
  isOwner.value && channel.value ? `/channels/${channel.value.slug}/dashboard/profil` : null,
)
</script>

<template>
  <main class="pb-24">
    <div v-if="loading" class="flex items-center justify-center py-32">
      <p class="text-[#18181f]/50">Chargement de la chaîne...</p>
    </div>

    <template v-else-if="channel">
      <!--
        -mt-40 lg:-mt-28 cancels the layout's <main class="pt-40 lg:pt-28"> (app/layouts/default.vue)
        so the lilac wash bleeds under the fixed header, matching the "Détail chaîne" mockup's flat
        #eeecf5 page background — same pattern as app/pages/chaines/index.vue.
      -->
      <section class="relative -mt-40 min-h-screen bg-[var(--color-auth-wash)] pt-40 lg:-mt-28 lg:pt-28">
        <div class="bg-white">
          <div class="container lg:px-16">
            <ChannelBreadcrumb :channel-name="channel.name" />

            <ChannelBanner
              :banner-url="channel.bannerUrl"
              :color-primary="brandColors.primary"
              :color-secondary="brandColors.secondary"
              :edit-href="bannerEditHref"
            />

            <ChannelProfileHeader
              :channel="channel"
              :is-owner="isOwner"
              :is-following="isFollowing"
              :category-label="categoryLabel"
              :brand-color="brandColors.primary"
              :brand-color-secondary="brandColors.secondary"
              @toggle-follow="toggleFollow"
            />

            <ChannelStatsStrip :channel="channel" :articles-count="articles.length" :stats-data-count="statsData.length" />

            <ChannelDetailTabs v-model="activeTab" :tabs="tabs" />
          </div>
        </div>

        <div class="container pb-16 lg:px-16">
          <ChannelFeaturedTab
            v-if="activeTab === 'featured'"
            :featured="featured"
            :enriched-survey="featuredEnrichedSurvey"
            :recent-articles="recentArticles"
            @view-all-articles="activeTab = 'articles'"
          />

          <ChannelFeedList
            v-else-if="activeTab === 'articles'"
            :items="articles"
            empty-text="Aucun article publié pour le moment."
          />

          <ChannelDatasetList
            v-else-if="activeTab === 'statsdata'"
            :items="statsData"
            empty-text="Aucune StatsData publiée pour le moment."
          />

          <ChannelPollsTab
            v-else-if="activeTab === 'sondages'"
            :items="enrichedPolls"
            empty-text="Aucun sondage publié pour le moment."
          />

          <ChannelAboutTab
            v-else-if="activeTab === 'apropos'"
            :channel="channel"
            :category-labels="categoryLabels"
            :created-at-label="createdAtLabel"
          />

          <ChannelSimilarSlider :channel="channel" />
        </div>
      </section>
    </template>
  </main>
</template>
