<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelCatalogItem } from '@/types/channel-catalog'
import { formatCompactNumber, getNameInitials } from '@/lib/format'
import { channelBannerStyle, resolveChannelColors } from '@/lib/channel-brand'
import { CHANNEL_KIND_STYLE, CHANNEL_PACE_STYLE } from '@/lib/channel-catalog-display'

const props = defineProps<{
  item: ChannelCatalogItem
  following: boolean
  followers: number
}>()

const emit = defineEmits<{
  follow: []
  'select-tag': [string]
}>()

const to = computed(() => `/channels/${encodeURIComponent(props.item.handle)}`)

const colors = computed(() =>
  resolveChannelColors(
    String(props.item.id),
    props.item.custom_color_primary,
    props.item.custom_color_secondary,
  ),
)
const bannerStyle = computed(() => channelBannerStyle(colors.value.primary, colors.value.secondary))
const kindStyle = computed(() => CHANNEL_KIND_STYLE[props.item.kind])
const paceStyle = computed(() => CHANNEL_PACE_STYLE[props.item.pace])
const initials = computed(() => getNameInitials(props.item.name))

const stats = computed(() => [
  { label: 'Abonnés', value: formatCompactNumber(props.followers), align: 'text-left' },
  { label: 'Publications', value: formatCompactNumber(props.item.publications_count), align: 'text-center' },
  { label: 'Statsdata', value: formatCompactNumber(props.item.statsdata_count), align: 'text-right' },
])
</script>

<template>
  <article
    class="flex flex-col overflow-hidden rounded-[18px] border-[1.5px] border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:-translate-y-0.5 hover:border-[#c4b5fd]"
  >
    <div class="h-28 overflow-hidden">
      <img
        v-if="item.banner_url"
        :src="item.banner_url"
        :alt="`Bannière ${item.name}`"
        class="h-full w-full object-cover"
      />
      <div v-else class="h-full w-full" :style="bannerStyle" />
    </div>

    <div class="flex flex-1 flex-col px-5 pb-5">
      <div class="-mt-[26px] flex items-end justify-between gap-3">
        <span
          class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border-[3px] border-white bg-white text-base font-extrabold text-slate-900"
          :class="item.kind === 'independant' ? 'rounded-full' : 'rounded-[15px]'"
        >
          <img v-if="item.logo_url" :src="item.logo_url" :alt="item.name" class="h-full w-full object-cover" />
          <span v-else>{{ initials }}</span>
        </span>
        <button
          type="button"
          class="mb-2 shrink-0 whitespace-nowrap rounded-full border-[1.5px] px-[17px] py-[9px] text-xs font-extrabold tracking-[0.03em] transition"
          :class="
            following
              ? 'border-[#c4b5fd] bg-[#f2ecfd] text-primary'
              : 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800'
          "
          :aria-pressed="following"
          @click="emit('follow')"
        >
          {{ following ? 'ABONNÉ ✔' : 'S’ABONNER' }}
        </button>
      </div>

      <div class="mt-3 flex items-center gap-1.5">
        <NuxtLink
          :to="to"
          class="truncate text-[16.5px] font-extrabold tracking-[-0.015em] text-slate-950 hover:text-primary"
        >
          {{ item.name }}
        </NuxtLink>
        <span v-if="item.verified" class="shrink-0 text-[11px] text-accent" title="Chaîne vérifiée">✔</span>
      </div>

      <div class="mt-1.5 flex items-center gap-2">
        <span class="font-mono text-[10.5px] text-slate-500">{{ item.handle }}</span>
        <span
          class="rounded-[5px] px-[7px] py-[3px] font-mono text-[9.5px] font-semibold tracking-[0.07em]"
          :style="{ color: kindStyle.fg, background: kindStyle.bg }"
        >
          {{ kindStyle.label }}
        </span>
      </div>

      <p class="mt-2.5 line-clamp-2 min-h-[40px] text-[13px] leading-[1.55] text-slate-500 text-pretty">
        {{ item.description }}
      </p>

      <div class="my-3.5 flex items-center gap-2.5 rounded-xl bg-[#faf9fd] px-3.5 py-3">
        <div v-for="stat in stats" :key="stat.label" class="min-w-0 flex-1" :class="stat.align">
          <div class="text-[8.5px] font-extrabold uppercase tracking-[0.07em] text-slate-400">{{ stat.label }}</div>
          <div class="mt-0.5 font-mono text-[14px] font-semibold text-slate-950">{{ stat.value }}</div>
        </div>
      </div>

      <div v-if="item.tags.length" class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in item.tags"
          :key="tag"
          type="button"
          class="rounded-md bg-[#f4f3f8] px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-[#f2ecfd] hover:text-primary"
          @click="emit('select-tag', tag)"
        >
          #{{ tag }}
        </button>
      </div>

      <div class="flex-1" />
      <div class="mt-[15px] flex items-center gap-2.5 border-t border-slate-200/80 pt-[13px]">
        <span
          class="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.06em]"
          :style="{ color: paceStyle.fg }"
        >
          <span class="h-1.5 w-1.5 shrink-0 rounded-full" :style="{ background: paceStyle.dot }" />
          {{ paceStyle.label }}
        </span>
        <NuxtLink
          :to="to"
          class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-slate-200 text-[13px] text-slate-500 transition hover:border-primary hover:text-primary"
          aria-label="Ouvrir la chaîne"
        >
          →
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
