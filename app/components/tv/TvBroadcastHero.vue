<script setup lang="ts">
import type { BroadcastDetail } from '@/api/tv-broadcast'
import type { TntChannel } from '@/data/tnt-channels'
import { CATEGORY_COLOR_CLASS, CATEGORY_COLOR_FALLBACK, BROADCAST_TYPE_LABELS } from '@/lib/tv-category-colors'

defineProps<{
  broadcast: BroadcastDetail
  channel: TntChannel | null
  channelLogoUrl: string | null
  formattedDate: string
  durationLabel: string
  youtubeEmbedUrl: string | null
}>()
</script>

<template>
  <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <!-- Programme image -->
    <div v-if="broadcast.program.imageUrl" class="relative h-48 sm:h-64 bg-slate-100 overflow-hidden">
      <img
        :src="broadcast.program.imageUrl"
        :alt="broadcast.program.title"
        class="h-full w-full object-cover"
        @error="($event.target as HTMLImageElement).parentElement!.style.display='none'"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div v-if="broadcast.program.isTvstatsPick" class="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-lg">
        <svg class="h-4 w-4 text-tvstats-primary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span class="text-[11px] font-bold text-tvstats-primary tracking-wide">Coup de cœur</span>
      </div>
    </div>

    <div class="p-5 sm:p-6">
      <!-- Channel + date row -->
      <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-3">
        <RouterLink v-if="channel" :to="`/tvstats/chaine/${channel.id}`" class="flex items-center gap-1.5 hover:text-slate-600">
          <div class="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <img :src="channelLogoUrl ?? undefined" :alt="channel.displayName" class="h-full w-full object-contain" @error="($event.target as HTMLImageElement).style.display='none'" />
          </div>
          <span class="font-medium text-slate-600">{{ channel.displayName }}</span>
        </RouterLink>
        <span class="text-slate-300">·</span>
        <span>{{ formattedDate }}</span>
        <span class="text-slate-300">·</span>
        <span class="font-mono">{{ broadcast.startTime }}–{{ broadcast.endTime }}</span>
        <span class="text-slate-300">·</span>
        <span>{{ durationLabel }}</span>
      </div>

      <!-- Badges row (categories, mention, type, coup de cœur) -->
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <span
          v-for="cat in broadcast.program.categories"
          :key="cat.id"
          class="rounded-full px-3 py-1 text-[10.5px] font-bold"
          :class="CATEGORY_COLOR_CLASS[cat.color ?? ''] ?? CATEGORY_COLOR_FALLBACK"
        >
          {{ cat.name }}
        </span>
        <span
          v-if="broadcast.broadcastType"
          class="rounded-full border px-3 py-1 text-[10.5px] font-bold"
          :class="BROADCAST_TYPE_LABELS[broadcast.broadcastType]?.class ?? 'bg-slate-100 text-slate-600 border-slate-200'"
        >
          {{ BROADCAST_TYPE_LABELS[broadcast.broadcastType]?.label ?? broadcast.broadcastType }}
        </span>
        <span v-if="broadcast.program.type" class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {{ broadcast.program.type }}
        </span>
        <div
          v-if="broadcast.program.isTvstatsPick && !broadcast.program.imageUrl"
          class="flex items-center gap-1.5 rounded-full bg-tvstats-soft/40 border border-tvstats-primary/20 px-2.5 py-1"
        >
          <svg class="h-3.5 w-3.5 text-tvstats-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span class="text-[11px] font-bold text-tvstats-primary">Coup de cœur TvStats</span>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
        {{ broadcast.program.title }}
      </h1>

      <!-- Description -->
      <p v-if="broadcast.program.description" class="mt-4 text-sm leading-relaxed text-slate-600">
        {{ broadcast.program.description }}
      </p>
    </div>
  </div>

  <!-- YouTube video -->
  <div v-if="youtubeEmbedUrl" class="overflow-hidden rounded-3xl border border-slate-200 bg-black shadow-sm">
    <div class="relative pt-[56.25%]">
      <iframe
        :src="youtubeEmbedUrl"
        class="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        title="Bande-annonce"
      />
    </div>
  </div>
</template>
