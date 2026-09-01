<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getPublicChannels, type Channel } from '@/api/channels'
import { formatCompactNumber } from '@/lib/format'
import { channelBannerStyle, resolveChannelColors } from '@/lib/channel-brand'

const channels = ref<Channel[]>([])

onMounted(async () => {
  try {
    const result = await getPublicChannels({ sort: 'popular', perPage: 8 })
    channels.value = result.channels
  } catch {
    channels.value = []
  }
})

const chips = computed(() =>
  channels.value.map((c) => {
    const name = c.profile.name ?? ''
    const colors = resolveChannelColors(
      String(c.id),
      c.profile.custom_color_primary,
      c.profile.custom_color_secondary,
    )
    return {
      id: c.id,
      handle: c.profile.handle,
      name,
      initials: name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      verified: (c.badges ?? []).length > 0,
      followers: formatCompactNumber(c.profile.subscriber_count ?? 0),
      logoUrl: c.profile.logo_url,
      avatarStyle: channelBannerStyle(colors.primary, colors.secondary),
    }
  }),
)
</script>

<template>
  <section v-if="chips.length" class="mb-[70px]">
    <div class="mb-5 flex flex-wrap items-baseline justify-between gap-4">
      <div>
        <span class="font-mono text-[10px] font-semibold tracking-[0.09em] text-emerald-600">CHAÎNES</span>
        <h2 class="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-slate-950">
          Rédactions, institutions et analystes à suivre
        </h2>
      </div>
      <RouterLink to="/chaines" class="text-[13.5px] font-bold text-primary transition hover:opacity-70">
        Découvrir les chaînes →
      </RouterLink>
    </div>

    <div class="flex flex-wrap gap-3">
      <RouterLink
        v-for="chip in chips"
        :key="chip.id"
        :to="`/channels/${encodeURIComponent(chip.handle)}`"
        class="flex items-center gap-3 rounded-[14px] border-[1.5px] border-slate-200/70 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:border-[#c4b5fd]"
      >
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[11px] text-xs font-extrabold text-white"
          :style="chip.logoUrl ? undefined : chip.avatarStyle"
        >
          <img v-if="chip.logoUrl" :src="chip.logoUrl" :alt="chip.name" class="h-full w-full object-cover" />
          <span v-else>{{ chip.initials }}</span>
        </span>
        <span class="min-w-0">
          <span class="flex items-center gap-1.5">
            <span class="whitespace-nowrap text-[13px] font-extrabold text-slate-950">{{ chip.name }}</span>
            <span v-if="chip.verified" class="text-[10px] text-accent">✔</span>
          </span>
          <span class="mt-0.5 block font-mono text-[10px] text-slate-400">{{ chip.followers }} abonnés</span>
        </span>
      </RouterLink>
    </div>
  </section>
</template>
