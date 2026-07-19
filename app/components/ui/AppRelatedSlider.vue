<script setup lang="ts">
import { ref } from 'vue'

export interface RelatedSliderItem {
  key: string | number
  to: string
  title: string
  subtitle?: string
  meta?: string
  emoji?: string
}

defineProps<{
  title: string
  items: RelatedSliderItem[]
  emptyText?: string
  loading?: boolean
}>()

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
      <p class="text-sm font-bold text-slate-900">{{ title }}</p>
      <div v-if="items.length > 2" class="flex shrink-0 gap-1.5">
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

    <p v-if="loading" class="text-[13.5px] text-slate-400">Chargement…</p>
    <p v-else-if="items.length === 0" class="text-[13.5px] text-slate-400">{{ emptyText ?? 'Rien à afficher pour le moment.' }}</p>
    <div v-else ref="trackRef" class="related-slider-track flex gap-3.5 overflow-x-auto pb-1">
      <NuxtLink
        v-for="item in items"
        :key="item.key"
        :to="item.to"
        class="related-slider-item group flex w-[190px] shrink-0 flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30"
      >
        <span v-if="item.emoji" class="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-sm">
          {{ item.emoji }}
        </span>
        <span class="truncate text-[13.5px] font-bold text-slate-900 group-hover:text-[var(--color-primary)]">{{ item.title }}</span>
        <span v-if="item.subtitle" class="truncate text-[11.5px] text-slate-400">{{ item.subtitle }}</span>
        <span v-if="item.meta" class="mono mt-auto w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600">
          {{ item.meta }}
        </span>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.related-slider-track {
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.related-slider-track::-webkit-scrollbar {
  display: none;
}
.related-slider-item {
  scroll-snap-align: start;
}
</style>
