<script setup lang="ts">
import { computed } from 'vue'
import ChannelFeedCard from './ChannelFeedCard.vue'
import { formatCompactNumber } from '@/lib/format'
import type { SondageSort } from '@/composables/useChannelProfile'

const props = defineProps<{
  items: { title: string; participants: number; rating: number }[]
  sort: SondageSort
  sortOptions: { key: SondageSort; label: string }[]
  colorPrimary: string
}>()

const emit = defineEmits<{ 'update:sort': [SondageSort] }>()

const cards = computed(() =>
  props.items.map((item) => ({
    title: item.title,
    meta: `${formatCompactNumber(item.participants)} participations · ${item.rating.toFixed(1)}/5`,
  })),
)
</script>

<template>
  <div class="py-8">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in sortOptions"
        :key="option.key"
        type="button"
        class="rounded-full border px-4 py-[9px] text-[13px] font-semibold transition"
        :class="
          sort === option.key
            ? 'border-[#18181f] bg-[#18181f] text-white'
            : 'border-[#18181f]/10 bg-[#f7f6fb] text-[#333] hover:border-[#18181f]/20'
        "
        @click="emit('update:sort', option.key)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="cards.length" class="mt-6 grid gap-[22px] sm:grid-cols-2 xl:grid-cols-3">
      <ChannelFeedCard
        v-for="card in cards"
        :key="card.title"
        :title="card.title"
        :meta="card.meta"
        :color-primary="colorPrimary"
      />
    </div>
    <p v-else class="mt-6 text-sm text-[#18181f]/50">Aucun sondage publié pour le moment.</p>
  </div>
</template>
