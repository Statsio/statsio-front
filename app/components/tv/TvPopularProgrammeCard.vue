<script setup lang="ts">
import { CATEGORY_COLOR_CLASS, CATEGORY_COLOR_FALLBACK } from '@/lib/tv-category-colors'
import type { PopularProgramme } from '@/api/tv-channel'

defineProps<{
  programme: PopularProgramme
}>()
</script>

<template>
  <RouterLink
    :to="`/tvstats/emission/${programme.broadcastId}`"
    class="block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-sm"
  >
    <div class="relative h-[100px] bg-slate-100">
      <img
        v-if="programme.imageUrl"
        :src="programme.imageUrl"
        :alt="programme.title"
        class="h-full w-full object-cover"
        @error="($event.target as HTMLImageElement).style.display='none'"
      />
      <span
        class="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 font-mono text-[10.5px] font-bold text-tvstats-primary"
      >
        {{ programme.score.toLocaleString('fr-FR') }}
      </span>
    </div>
    <div class="p-4">
      <span
        v-if="programme.category"
        class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
        :class="CATEGORY_COLOR_CLASS[programme.categoryColor ?? ''] ?? CATEGORY_COLOR_FALLBACK"
      >
        {{ programme.category }}
      </span>
      <p class="mt-2 text-[14.5px] font-bold leading-tight text-slate-900">{{ programme.title }}</p>
      <div v-if="programme.rating != null" class="mt-2 flex gap-0.5">
        <span
          v-for="i in 5"
          :key="i"
          class="text-xs"
          :class="i <= Math.round(programme.rating) ? 'text-tvstats-primary' : 'text-slate-200'"
        >★</span>
      </div>
    </div>
  </RouterLink>
</template>
