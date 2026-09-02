<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ChannelBadgeList from '@/components/channels/ChannelBadgeList.vue'
import type { Channel } from '@/api/channels'
import { formatCompactNumber } from '@/lib/format'

const props = defineProps<{
  channel: Channel
}>()

const initials = computed(() =>
  (props.channel.profile.name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)
</script>

<template>
  <RouterLink
    :to="`/channels/${encodeURIComponent(channel.profile.handle)}`"
    class="flex flex-1 items-center gap-3 rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"
  >
    <span
      class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-base font-extrabold text-slate-900"
    >
      <img
        v-if="channel.profile.logo_url"
        :src="channel.profile.logo_url"
        :alt="channel.profile.name"
        class="h-full w-full object-cover"
      />
      <span v-else>{{ initials }}</span>
    </span>
    <div class="min-w-0">
      <div class="flex items-center gap-1.5">
        <p class="truncate text-sm font-bold text-slate-900">{{ channel.profile.name }}</p>
        <ChannelBadgeList :slugs="channel.badges" :organization="channel.organization" size="sm" />
      </div>
      <p class="text-xs text-slate-500">{{ formatCompactNumber(channel.profile.subscriber_count) }} abonnés</p>
    </div>
  </RouterLink>
</template>
