<script setup lang="ts">
import { fmtRelative } from '@/composables/useBroadcastDetail'
import type { ReviewsResponse } from '@/api/tv-broadcast'

defineProps<{
  reviewsData: ReviewsResponse | null
  isPast: boolean
}>()
</script>

<template>
  <div class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
    <div class="mb-4 flex items-center gap-3">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-tvstats-primary">Avis téléspectateurs</h2>
      <div v-if="reviewsData?.avgRating" class="flex items-center gap-1">
        <svg class="h-4 w-4 fill-tvstats-primary" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span class="font-mono text-sm font-bold text-slate-800">{{ reviewsData.avgRating }}</span>
        <span class="text-xs text-slate-400">({{ reviewsData.totalCount }})</span>
      </div>
    </div>

    <!-- Reviews list -->
    <div v-if="!reviewsData || reviewsData.reviews.length === 0" class="py-6 text-center text-sm text-slate-400">
      <p>Aucun avis pour le moment.</p>
      <p v-if="isPast" class="mt-1 text-xs">Soyez le premier à donner votre avis !</p>
    </div>
    <div v-else class="space-y-4">
      <div v-for="review in reviewsData.reviews" :key="review.id" class="flex gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
          {{ review.initials }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <div v-if="review.rating" class="flex items-center gap-0.5">
              <svg v-for="s in 5" :key="s" class="h-3.5 w-3.5" :class="s <= review.rating ? 'fill-tvstats-primary' : 'fill-slate-200'" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <span class="text-xs text-slate-400">{{ fmtRelative(review.createdAt) }}</span>
          </div>
          <p v-if="review.comment" class="text-sm text-slate-700 leading-relaxed">{{ review.comment }}</p>
          <p v-else class="text-xs italic text-slate-400">Avis sans commentaire.</p>
        </div>
      </div>
    </div>
  </div>
</template>
