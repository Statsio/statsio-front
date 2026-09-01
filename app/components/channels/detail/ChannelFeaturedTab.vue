<script setup lang="ts">
import ArticleTeaserCard from '@/components/articles/ArticleTeaserCard.vue'
import type { StatsDataDocument } from '@/api/studio'

defineProps<{
  recentArticles: StatsDataDocument[]
}>()

const emit = defineEmits<{ 'view-all-articles': [] }>()
</script>

<template>
  <div class="py-8">
    <template v-if="recentArticles.length">
      <div class="mb-4 flex items-baseline justify-between">
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
    <p v-else class="text-sm text-[#18181f]/50">Cette chaîne n'a encore rien publié.</p>
  </div>
</template>
