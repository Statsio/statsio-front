<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { categoryBadgeClass, BROADCAST_TYPE_LABELS } from '@/lib/tv-category-colors'
import type { TvProgramme } from '@/types/tv-schedule'

const props = defineProps<{
  programme: TvProgramme
  slotLabel: string
  highlightSlot?: boolean
}>()

const router = useRouter()

const categoryLabel = computed(() => props.programme.genres[0] ?? props.programme.type)
const mention = computed(() => (props.programme.mention ? BROADCAST_TYPE_LABELS[props.programme.mention] : null))

const scoreLabel = computed(() => {
  const score = props.programme.score
  if (!score) return null
  return score.type === 'viewers'
    ? `${score.value.toLocaleString('fr-FR')} vus`
    : `${score.value.toLocaleString('fr-FR')} intéressés`
})

function goToDetail() {
  if (props.programme.broadcastId != null) {
    router.push(`/tvstats/emission/${props.programme.broadcastId}`)
  }
}
</script>

<template>
  <div
    class="flex flex-1 min-w-0 gap-3.5 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition"
    :class="programme.broadcastId != null ? 'cursor-pointer hover:bg-slate-100' : ''"
    @click="goToDetail"
  >
    <!-- Thumbnail placeholder -->
    <div class="relative h-[66px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-slate-200/70">
      <span class="absolute inset-0 flex items-center justify-center px-1 text-center font-mono text-[8px] font-bold uppercase text-slate-400">
        Image programme
      </span>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <div class="flex flex-wrap items-center gap-1.5">
        <span
          class="text-[9.5px] font-bold uppercase tracking-wide"
          :class="highlightSlot ? 'text-red-600' : 'text-slate-400'"
        >
          {{ slotLabel }}
        </span>
        <span class="font-mono text-[11px] text-slate-400">{{ programme.startTime }}–{{ programme.endTime }}</span>
      </div>

      <p class="truncate text-sm font-bold text-slate-900">{{ programme.title }}</p>

      <div class="flex flex-wrap items-center gap-1.5">
        <span v-if="categoryLabel" class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="categoryBadgeClass(categoryLabel)">
          {{ categoryLabel }}
        </span>
        <span v-if="mention" class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="mention.class">
          {{ mention.label }}
        </span>
      </div>

      <div class="mt-0.5 flex items-center justify-between gap-2">
        <div v-if="programme.rating != null" class="flex gap-0.5">
          <span
            v-for="i in 5"
            :key="i"
            class="text-xs"
            :class="i <= Math.round(programme.rating) ? 'text-tvstats-primary' : 'text-slate-200'"
          >★</span>
        </div>
        <div v-if="scoreLabel" class="ml-auto flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-tvstats-primary" />
          <span class="font-mono text-[11px] font-bold text-tvstats-primary">{{ scoreLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
