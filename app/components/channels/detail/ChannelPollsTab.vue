<script setup lang="ts">
import ChannelPollGridCard from './ChannelPollGridCard.vue'
import type { EnrichedPoll } from '@/lib/poll-enrich'

defineProps<{
  items: EnrichedPoll[]
  emptyText: string
}>()
</script>

<template>
  <div v-if="items.length" class="grid gap-4 py-8 sm:grid-cols-2">
    <ChannelPollGridCard
      v-for="p in items"
      :key="p.poll.id"
      :to="p.to"
      :category="p.category"
      :question-type="p.questionType"
      :question="p.poll.title"
      :status="p.status"
      :options="p.options"
      :total-votes="p.totalVotes"
    />
  </div>
  <p v-else class="py-8 text-sm text-[#18181f]/50">{{ emptyText }}</p>
</template>
