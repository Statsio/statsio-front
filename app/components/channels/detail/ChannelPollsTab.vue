<script setup lang="ts">
import PollListRow from '@/components/polls/PollListRow.vue'
import type { EnrichedPoll } from '@/lib/poll-enrich'

defineProps<{
  items: EnrichedPoll[]
  emptyText: string
}>()
</script>

<template>
  <div v-if="items.length" class="flex flex-col py-8">
    <PollListRow
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
