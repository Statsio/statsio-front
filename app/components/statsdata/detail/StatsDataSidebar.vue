<script setup lang="ts">
import StatsDataPublisherCard from './StatsDataPublisherCard.vue'
import StatsDataSourceCard from './StatsDataSourceCard.vue'
import StatsDataLinkCard from './StatsDataLinkCard.vue'

defineProps<{
  authorName?: string
  createdAt?: string
  updatedAt?: string
  isFollowing: boolean
  canEdit?: boolean
  profileEditPath?: string
  datasets: { id: string; name: string; row_count?: number }[]
  slug?: string
}>()

defineEmits<{ 'toggle-follow': [] }>()
</script>

<template>
  <aside class="flex flex-col gap-4">
    <StatsDataPublisherCard
      :author-name="authorName"
      :created-at="createdAt"
      :updated-at="updatedAt"
      :is-following="isFollowing"
      :can-edit="canEdit"
      :profile-edit-path="profileEditPath"
      @toggle-follow="$emit('toggle-follow')"
    />
    <StatsDataSourceCard :datasets="datasets" />
    <StatsDataLinkCard v-if="slug" :slug="slug" />
  </aside>
</template>
