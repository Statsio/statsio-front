<script setup lang="ts">
import { computed } from 'vue'
import { useChannelProfile } from '@/composables/useChannelProfile'
import { resolveChannelColors } from '@/lib/channel-brand'
import ChannelBanner from './ChannelBanner.vue'
import ChannelProfileHeader from './ChannelProfileHeader.vue'
import ChannelStatsStrip from './ChannelStatsStrip.vue'
import ChannelDetailTabs from './ChannelDetailTabs.vue'
import ChannelFeaturedTab from './ChannelFeaturedTab.vue'
import ChannelFeedList from './ChannelFeedList.vue'
import ChannelDatasetList from './ChannelDatasetList.vue'
import ChannelPollsTab from './ChannelPollsTab.vue'
import ChannelAboutTab from './ChannelAboutTab.vue'

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
</script>

<template>
  <main class="pb-24">
    <div v-if="loading" class="flex items-center justify-center py-32">
      <p class="text-[#18181f]/50">Chargement de la chaîne...</p>
    </div>

    <template v-else-if="channel">
      <section class="pt-0">
        <div class="container">
          <ChannelBanner
            :banner-url="channel.bannerUrl"
            :color-primary="brandColors.primary"
            :color-secondary="brandColors.secondary"
          />

          <ChannelProfileHeader
            :channel="channel"
            :is-owner="isOwner"
            :is-following="isFollowing"
            :brand-color="brandColors.primary"
            :brand-color-secondary="brandColors.secondary"
            @toggle-follow="toggleFollow"
          />

          <ChannelStatsStrip :channel="channel" :articles-count="articles.length" :stats-data-count="statsData.length" />

          <ChannelDetailTabs v-model="activeTab" :tabs="tabs" :accent-color="brandColors.primary" />

          <ChannelFeaturedTab
            v-if="activeTab === 'featured'"
            :featured="featured"
            :enriched-survey="featuredEnrichedSurvey"
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
        </div>
      </section>
    </template>
  </main>
</template>
