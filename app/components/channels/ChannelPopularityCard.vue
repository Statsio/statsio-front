<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppAvatar from '@/components/ui/AppAvatar.vue'
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
    <AppAvatar :src="channel.profile.logo_url ?? undefined" :initials="initials" :alt="channel.profile.name" size="md" />
    <div class="min-w-0">
      <p class="truncate text-sm font-bold text-slate-900">{{ channel.profile.name }}</p>
      <p class="text-xs text-slate-500">{{ formatCompactNumber(channel.profile.subscriber_count) }} abonnés</p>
    </div>
  </RouterLink>
</template>
