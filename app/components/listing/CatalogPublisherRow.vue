<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogPublisher } from '@/types/catalog'
import { resolveChannelColors, channelBannerStyle } from '@/lib/channel-brand'

const props = defineProps<{
  publisher: CatalogPublisher
  meta: string
  to: string
}>()

const colors = computed(() =>
  resolveChannelColors(props.publisher.handle ?? props.publisher.name, null, null),
)
const avatarStyle = computed(() =>
  props.publisher.is_channel
    ? channelBannerStyle(colors.value.primary, colors.value.secondary)
    : { background: 'linear-gradient(135deg,#3b82f6,#059669)' },
)
</script>

<template>
  <div class="mt-4 flex items-center gap-2.5 border-t border-slate-200/80 pt-3.5">
    <span
      class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden text-[10.5px] font-extrabold text-white"
      :class="publisher.is_channel ? 'rounded-[9px]' : 'rounded-full'"
      :style="publisher.logo_url ? undefined : avatarStyle"
    >
      <img v-if="publisher.logo_url" :src="publisher.logo_url" :alt="publisher.name" class="h-full w-full object-cover" />
      <span v-else>{{ publisher.initials }}</span>
    </span>
    <span class="min-w-0 flex-1">
      <span class="flex items-center gap-1">
        <span class="truncate text-[12.5px] font-bold text-slate-950">{{ publisher.name }}</span>
        <span v-if="publisher.verified" class="shrink-0 text-[10px] text-accent" title="Chaîne">✔</span>
      </span>
      <span class="mt-0.5 block font-mono text-[10px] text-slate-400">{{ meta }}</span>
    </span>
    <NuxtLink
      :to="to"
      class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-slate-200 text-[13px] text-slate-500 transition hover:border-primary hover:text-primary"
      aria-label="Ouvrir"
    >
      →
    </NuxtLink>
  </div>
</template>
