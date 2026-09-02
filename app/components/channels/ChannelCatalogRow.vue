<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelCatalogItem } from '@/types/channel-catalog'
import { formatCompactNumber, getNameInitials } from '@/lib/format'
import { CHANNEL_KIND_STYLE, CHANNEL_PACE_STYLE } from '@/lib/channel-catalog-display'

const props = defineProps<{
  item: ChannelCatalogItem
  following: boolean
  followers: number
}>()

const emit = defineEmits<{ follow: [] }>()

const to = computed(() => `/channels/${encodeURIComponent(props.item.handle)}`)
const kindStyle = computed(() => CHANNEL_KIND_STYLE[props.item.kind])
const paceStyle = computed(() => CHANNEL_PACE_STYLE[props.item.pace])
const initials = computed(() => getNameInitials(props.item.name))
</script>

<template>
  <div
    class="grid grid-cols-[minmax(0,2.4fr)_1fr_0.8fr_0.8fr_0.9fr_108px] items-center gap-3.5 border-b border-slate-200/60 px-5 py-3.5 transition hover:bg-[#faf8ff]"
  >
    <div class="flex min-w-0 items-center gap-3">
      <span
        class="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white text-[11.5px] font-extrabold text-slate-900"
        :class="item.kind === 'independant' ? 'rounded-full' : 'rounded-[10px]'"
      >
        <img v-if="item.logo_url" :src="item.logo_url" :alt="item.name" class="h-full w-full object-cover" />
        <span v-else>{{ initials }}</span>
      </span>
      <span class="min-w-0">
        <span class="flex items-center gap-1.5">
          <NuxtLink :to="to" class="truncate text-[14px] font-bold text-slate-950 hover:text-primary">
            {{ item.name }}
          </NuxtLink>
          <span v-if="item.verified" class="shrink-0 text-[10px] text-accent" title="Chaîne vérifiée">✔</span>
        </span>
        <span class="mt-0.5 block truncate font-mono text-[10px] text-slate-500">{{ item.handle }}</span>
      </span>
    </div>

    <div class="font-mono text-[10px] font-semibold tracking-[0.06em]" :style="{ color: kindStyle.fg }">
      {{ kindStyle.label }}
    </div>
    <div class="text-right font-mono text-[12.5px] font-semibold text-slate-950">{{ formatCompactNumber(followers) }}</div>
    <div class="text-right font-mono text-[12.5px] font-semibold text-slate-950">
      {{ formatCompactNumber(item.publications_count) }}
    </div>
    <div class="text-right font-mono text-[11px]" :style="{ color: paceStyle.fg }">{{ paceStyle.short }}</div>
    <div class="flex justify-end">
      <button
        type="button"
        class="rounded-full border-[1.5px] px-3.5 py-[7px] text-[11.5px] font-extrabold transition"
        :class="
          following
            ? 'border-[#c4b5fd] bg-[#f2ecfd] text-primary'
            : 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800'
        "
        :aria-pressed="following"
        @click="emit('follow')"
      >
        {{ following ? 'Abonné' : 'Suivre' }}
      </button>
    </div>
  </div>
</template>
