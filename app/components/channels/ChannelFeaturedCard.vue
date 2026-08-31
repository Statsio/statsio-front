<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelCatalogFeatured } from '@/types/channel-catalog'
import { formatCompactNumber } from '@/lib/format'
import { formatRelativePublished } from '@/lib/catalog-format'
import {
  CHANNEL_PACE_STYLE,
  channelPostIcon,
  channelPostKindLabel,
} from '@/lib/channel-catalog-display'

const props = defineProps<{
  item: ChannelCatalogFeatured
  following: boolean
}>()

const emit = defineEmits<{ follow: [] }>()

const to = computed(() => `/channels/${encodeURIComponent(props.item.handle)}`)
const paceStyle = computed(() => CHANNEL_PACE_STYLE[props.item.pace])

const stats = computed(() =>
  props.item.stats.map((s) => ({ label: s.label, value: formatCompactNumber(s.value) })),
)

const posts = computed(() =>
  props.item.posts.map((p) => ({
    icon: channelPostIcon(p.type),
    title: p.title,
    meta: `${channelPostKindLabel(p.type)} · ${formatRelativePublished(p.updated_at)}`,
  })),
)
</script>

<template>
  <div
    class="mb-[22px] grid items-center gap-[34px] rounded-[22px] px-8 py-[30px] text-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
    style="background: linear-gradient(135deg, #18181f, #2c2440)"
  >
    <div class="min-w-0">
      <div class="mb-[18px] flex items-center gap-2.5">
        <span
          class="rounded-[5px] bg-[#c4b5fd] px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.1em] text-slate-950"
        >
          CHAÎNE DU MOIS
        </span>
        <span class="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#6ee7b7]">
          <span class="h-1.5 w-1.5 rounded-full" :style="{ background: paceStyle.dot }" />
          {{ paceStyle.label }}
        </span>
      </div>

      <div class="flex items-center gap-4">
        <span
          class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#8b5cf6,#3b82f6)] text-[19px] font-extrabold text-white"
        >
          <img v-if="item.logo_url" :src="item.logo_url" :alt="item.name" class="h-full w-full object-cover" />
          <span v-else>{{ item.initials }}</span>
        </span>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-[25px] font-extrabold tracking-[-0.02em]">{{ item.name }}</span>
            <span v-if="item.verified" class="text-[13px] text-[#93c5fd]">✔</span>
          </div>
          <div class="mt-1 font-mono text-[11px] text-white/60">{{ item.handle }}</div>
        </div>
      </div>

      <p v-if="item.description" class="mt-4 max-w-[50ch] text-[14.5px] leading-[1.6] text-white/70">
        {{ item.description }}
      </p>

      <div class="mt-[22px] flex flex-wrap gap-[26px]">
        <div v-for="stat in stats" :key="stat.label">
          <div class="text-[9px] font-extrabold uppercase tracking-[0.08em] text-white/50">{{ stat.label }}</div>
          <div class="mt-[5px] font-mono text-[15px] font-semibold">{{ stat.value }}</div>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          class="rounded-full border-[1.5px] px-6 py-3 text-[13px] font-extrabold tracking-[0.03em] transition"
          :class="
            following
              ? 'border-[#c4b5fd] bg-[rgba(196,181,253,0.22)] text-[#e9defd]'
              : 'border-white bg-white text-slate-950 hover:bg-white/90'
          "
          :aria-pressed="following"
          @click="emit('follow')"
        >
          {{ following ? 'ABONNÉ ✔' : 'S’ABONNER' }}
        </button>
        <NuxtLink
          :to="to"
          class="rounded-full border-[1.5px] border-white/20 px-5 py-3 text-[13px] font-bold text-white transition hover:border-white/40"
        >
          Voir la chaîne
        </NuxtLink>
      </div>
    </div>

    <div class="min-w-0 rounded-[16px] border border-white/[0.14] bg-white/[0.06] p-5">
      <div class="mb-3.5 text-[10px] font-extrabold uppercase tracking-[0.09em] text-white/55">Dernières parutions</div>
      <div class="flex flex-col gap-[11px]">
        <NuxtLink
          v-for="(post, i) in posts"
          :key="i"
          :to="to"
          class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-white transition hover:bg-white/10"
        >
          <span
            class="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-white/10 text-[12px]"
          >
            {{ post.icon }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-bold">{{ post.title }}</span>
            <span class="mt-0.5 block font-mono text-[10px] text-white/55">{{ post.meta }}</span>
          </span>
        </NuxtLink>
        <p v-if="!posts.length" class="font-mono text-[11px] text-white/45">Pas encore de parution publiée.</p>
      </div>
    </div>
  </div>
</template>
