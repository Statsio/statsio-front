<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChannelEntry } from '@/data/channels'
import { useSimilarChannels } from '@/composables/useSimilarChannels'
import ChannelCard from '@/components/channels/ChannelCard.vue'

const props = defineProps<{ channel: ChannelEntry }>()

const { channels, loading } = useSimilarChannels(computed(() => props.channel))

const trackRef = ref<HTMLElement | null>(null)

function scrollByAmount(direction: 1 | -1) {
  const el = trackRef.value
  if (!el) return
  el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
}
</script>

<template>
  <div class="mt-8">
    <div class="mb-3.5 flex items-center justify-between gap-3">
      <p class="text-sm font-bold text-slate-900">Chaînes similaires</p>
      <div v-if="channels.length > 1" class="flex shrink-0 gap-1.5">
        <button
          type="button"
          aria-label="Précédent"
          class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          @click="scrollByAmount(-1)"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Suivant"
          class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          @click="scrollByAmount(1)"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex gap-3.5 overflow-hidden pb-1">
      <div v-for="n in 3" :key="n" class="h-[15.5rem] w-[300px] shrink-0 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
    </div>
    <p v-else-if="channels.length === 0" class="text-[13.5px] text-slate-400">Aucune autre chaîne disponible pour le moment.</p>
    <div v-else ref="trackRef" class="similar-channels-track flex gap-3.5 overflow-x-auto pb-1">
      <div v-for="c in channels" :key="c.id" class="similar-channels-item w-[300px] shrink-0">
        <ChannelCard :channel="c" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.similar-channels-track {
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.similar-channels-track::-webkit-scrollbar {
  display: none;
}
.similar-channels-item {
  scroll-snap-align: start;
}
</style>
