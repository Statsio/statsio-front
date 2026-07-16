<script setup lang="ts">
import type { TntChannel } from '@/data/tnt-channels'

defineProps<{
  channel: TntChannel | null
  channelId: string
  channelLogoUrl: string | null
  formattedDate: string
  startTime: string
  endTime: string
  durationLabel: string
}>()
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Diffusion</h2>
    <component
      :is="channel ? 'RouterLink' : 'div'"
      :to="channel ? `/tvstats/chaine/${channel.id}` : undefined"
      class="flex items-center gap-3"
    >
      <div v-if="channel" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1.5">
        <img :src="channelLogoUrl ?? undefined" :alt="channel.displayName" class="h-full w-full object-contain" @error="($event.target as HTMLImageElement).style.display='none'" />
      </div>
      <div>
        <p class="text-sm font-semibold text-slate-800">{{ channel?.displayName ?? channelId }}</p>
        <p class="text-xs text-slate-500">{{ formattedDate }}</p>
        <p class="text-xs text-slate-500">{{ startTime }} – {{ endTime }} · {{ durationLabel }}</p>
      </div>
    </component>
  </div>
</template>
