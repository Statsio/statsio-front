<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogPublisher } from '@/types/catalog'
import type { ContentCardTone } from '@/types/content-card'
import { resolveChannelColors, channelBannerStyle } from '@/lib/channel-brand'

const props = withDefaults(
  defineProps<{
    publisher: CatalogPublisher
    /** Ligne secondaire (vues · date, « Mis à jour … », etc.). Ignorée si le slot #meta est fourni. */
    meta?: string
    to: string
    tone?: ContentCardTone
  }>(),
  { meta: '', tone: 'light' },
)

const colors = computed(() =>
  resolveChannelColors(props.publisher.handle ?? props.publisher.name, null, null),
)
const avatarStyle = computed(() =>
  props.publisher.is_channel
    ? channelBannerStyle(colors.value.primary, colors.value.secondary)
    : { background: 'linear-gradient(135deg,#3b82f6,#059669)' },
)
const dark = computed(() => props.tone === 'dark')
</script>

<template>
  <div
    class="mt-4 flex items-center gap-2.5 border-t pt-3.5"
    :class="dark ? 'border-white/15' : 'border-slate-200/80'"
  >
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
        <span class="truncate text-[12.5px] font-bold" :class="dark ? 'text-white' : 'text-slate-950'">{{ publisher.name }}</span>
        <span v-if="publisher.verified" class="shrink-0 text-[10px] text-accent" title="Chaîne">✔</span>
      </span>
      <span class="mt-0.5 block font-mono text-[10px]" :class="dark ? 'text-white/55' : 'text-slate-400'">
        <slot name="meta">{{ meta }}</slot>
      </span>
    </span>
    <NuxtLink
      :to="to"
      class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-[13px] transition"
      :class="dark
        ? 'border-white/20 text-white/70 hover:border-white hover:text-white'
        : 'border-slate-200 text-slate-500 hover:border-primary hover:text-primary'"
      aria-label="Ouvrir"
    >
      →
    </NuxtLink>
  </div>
</template>
