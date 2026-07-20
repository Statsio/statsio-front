<script setup lang="ts">
import { computed } from 'vue'
import ArticleTeaserCard from '@/components/articles/ArticleTeaserCard.vue'
import DatasetCard from '@/components/statsdata/DatasetCard.vue'
import PollFeatureCard from '@/components/polls/PollFeatureCard.vue'
import type { FeaturedContent } from '@/api/channels'
import type { EnrichedPoll } from '@/lib/poll-enrich'

const props = defineProps<{
  featured: FeaturedContent | null
  enrichedSurvey: EnrichedPoll | null
}>()

const hasAnyFeatured = computed(
  () => Boolean(props.featured?.article) || Boolean(props.featured?.statsdata) || Boolean(props.enrichedSurvey),
)
</script>

<template>
  <div v-if="hasAnyFeatured" class="grid gap-5 py-8 lg:grid-cols-[1.6fr_1fr]">
    <ArticleTeaserCard v-if="featured?.article" :article="featured.article" size="hero" />

    <div class="flex flex-col gap-5">
      <DatasetCard v-if="featured?.statsdata" :document="featured.statsdata" featured />

      <div v-if="enrichedSurvey" class="h-[220px]">
        <PollFeatureCard
          size="hero"
          :to="enrichedSurvey.to"
          :category="enrichedSurvey.category"
          :question-type="enrichedSurvey.questionType"
          :question="enrichedSurvey.poll.title"
          :status="enrichedSurvey.status"
          :options="enrichedSurvey.options"
          :total-votes="enrichedSurvey.totalVotes"
        />
      </div>
    </div>
  </div>
  <p v-else class="py-8 text-sm text-[#18181f]/50">Cette chaîne n'a pas encore mis de contenu en avant.</p>
</template>
