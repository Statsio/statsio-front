<script setup lang="ts">
import { computed } from 'vue'
import ArticleTeaserCard from '@/components/articles/ArticleTeaserCard.vue'
import DatasetCard from '@/components/statsdata/DatasetCard.vue'
import ChannelFeaturedPollCard from './ChannelFeaturedPollCard.vue'
import type { FeaturedContent } from '@/api/channels'
import type { EnrichedPoll } from '@/lib/poll-enrich'
import type { StatsDataDocument } from '@/api/studio'

const props = defineProps<{
  featured: FeaturedContent | null
  enrichedSurvey: EnrichedPoll | null
  recentArticles: StatsDataDocument[]
}>()

const emit = defineEmits<{ 'view-all-articles': [] }>()

const hasAnyFeatured = computed(
  () => Boolean(props.featured?.article) || Boolean(props.featured?.statsdata) || Boolean(props.enrichedSurvey),
)
</script>

<template>
  <div class="py-8">
    <div v-if="hasAnyFeatured" class="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <ArticleTeaserCard v-if="featured?.article" :article="featured.article" size="hero" />

      <div class="flex flex-col gap-5">
        <DatasetCard v-if="featured?.statsdata" :document="featured.statsdata" featured />

        <div v-if="enrichedSurvey" class="min-h-[220px] flex-1">
          <ChannelFeaturedPollCard
            :to="enrichedSurvey.to"
            :question="enrichedSurvey.poll.title"
            :options="enrichedSurvey.options"
            :status="enrichedSurvey.status"
            :total-votes="enrichedSurvey.totalVotes"
          />
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-[#18181f]/50">Cette chaîne n'a pas encore mis de contenu en avant.</p>

    <template v-if="recentArticles.length">
      <div class="mb-4 mt-11 flex items-baseline justify-between">
        <h3 class="text-[15px] font-extrabold tracking-[0.01em] text-[#18181f]">Dernières publications</h3>
        <button
          type="button"
          class="text-[13px] font-bold text-[var(--color-primary)]"
          @click="emit('view-all-articles')"
        >
          Tout voir →
        </button>
      </div>
      <div class="grid gap-[22px] sm:grid-cols-2 xl:grid-cols-3">
        <ArticleTeaserCard v-for="a in recentArticles" :key="a.id" :article="a" />
      </div>
    </template>
  </div>
</template>
