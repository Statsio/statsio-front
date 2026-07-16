<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed, onMounted } from 'vue'
import TvBroadcastHero from '@/components/tv/TvBroadcastHero.vue'
import TvBroadcastScores from '@/components/tv/TvBroadcastScores.vue'
import TvBroadcastDiffusions from '@/components/tv/TvBroadcastDiffusions.vue'
import TvBroadcastReviews from '@/components/tv/TvBroadcastReviews.vue'
import TvBroadcastActionCard from '@/components/tv/TvBroadcastActionCard.vue'
import TvBroadcastAudienceCard from '@/components/tv/TvBroadcastAudienceCard.vue'
import TvBroadcastInfoCard from '@/components/tv/TvBroadcastInfoCard.vue'
import TvReviewModal from '@/components/tv/TvReviewModal.vue'

const {
  auth,
  broadcast,
  schedule,
  reviewsData,
  isLoading,
  isToggling,
  dbLogoMap,
  showReviewModal,
  broadcastId,
  channel,
  channelLogoUrl,
  isPast,
  formattedDate,
  durationLabel,
  youtubeEmbedUrl,
  load,
  toggle,
  openReview,
  onReviewSubmitted,
} = useBroadcastDetail()

usePageSeo({
  title: computed(() => broadcast.value?.program?.title),
  description: computed(() => broadcast.value?.program?.description),
})

onMounted(() => load())
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-tvstats-primary border-t-transparent" />
    </div>

    <!-- Content -->
    <template v-else-if="broadcast">
      <div class="mx-auto max-w-6xl px-4 py-6 lg:py-8">

        <!-- Back -->
        <RouterLink
          to="/tvstats/programme-tv"
          class="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-tvstats-primary hover:text-tvstats-dark transition"
        >
          ← Retour au programme TV
        </RouterLink>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

          <!-- ══════════ LEFT / MAIN ══════════ -->
          <div class="min-w-0 space-y-5">
            <TvBroadcastHero
              :broadcast="broadcast"
              :channel="channel"
              :channel-logo-url="channelLogoUrl"
              :formatted-date="formattedDate"
              :duration-label="durationLabel"
              :youtube-embed-url="youtubeEmbedUrl"
            />

            <TvBroadcastScores v-if="broadcast.scores.length > 0" :scores="broadcast.scores" />

            <TvBroadcastDiffusions
              v-if="schedule && (schedule.past.length > 0 || schedule.upcoming.length > 0)"
              :schedule="schedule"
              :db-logo-map="dbLogoMap"
            />

            <TvBroadcastReviews :reviews-data="reviewsData" :is-past="isPast" />
          </div>

          <!-- ══════════ RIGHT SIDEBAR ══════════ -->
          <div class="space-y-4">
            <TvBroadcastActionCard
              :broadcast="broadcast"
              :is-past="isPast"
              :is-toggling="isToggling"
              :is-authenticated="auth.isAuthenticated"
              @toggle="toggle"
              @review="openReview"
            />

            <TvBroadcastAudienceCard :audience="broadcast.audience" :is-past="isPast" />

            <TvBroadcastInfoCard
              :channel="channel"
              :channel-id="broadcast.channelId"
              :channel-logo-url="channelLogoUrl"
              :formatted-date="formattedDate"
              :start-time="broadcast.startTime"
              :end-time="broadcast.endTime"
              :duration-label="durationLabel"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Review modal -->
    <TvReviewModal
      v-if="showReviewModal && broadcast"
      :broadcast-id="broadcastId"
      :program-title="broadcast.program.title"
      @close="showReviewModal = false"
      @submitted="onReviewSubmitted"
    />
  </div>
</template>
