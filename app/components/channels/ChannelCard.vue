<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { channelCategoryLabels, toggleChannelSubscription, type Channel } from '@/api/channels'
import ChannelBadgeList from '@/components/channels/ChannelBadgeList.vue'
import { formatCompactNumber, formatShortDate } from '@/lib/format'
import { channelBannerStyle, resolveChannelColors } from '@/lib/channel-brand'
import { useAuthStore } from '@/stores/auth'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'

const props = withDefaults(
  defineProps<{
    channel: Channel
    isOwner?: boolean
  }>(),
  { isOwner: false },
)

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const profile = computed(() => props.channel.profile)

const DEFAULT_STATUS = { label: 'Anonymisée', bg: 'rgba(24,24,31,0.08)', color: 'rgba(24,24,31,0.55)' }
const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: 'rgba(16,185,129,0.14)', color: '#10b981' },
  suspended: { label: 'Suspendue', bg: 'rgba(245,158,11,0.16)', color: '#b45309' },
  banned: { label: 'Bannie', bg: 'rgba(225,29,72,0.14)', color: '#e11d48' },
  anonymized: DEFAULT_STATUS,
}
const status = computed(() => STATUS_META[props.channel.status] ?? DEFAULT_STATUS)
const showStatus = computed(() => props.isOwner && props.channel.status !== 'active')

const initials = computed(() =>
  (profile.value?.name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const handle = computed(() => profile.value?.handle ?? '')
const detailPath = computed(() => `/channels/${encodeURIComponent(handle.value)}`)
const managePath = computed(() => `/channels/${props.channel.id}/dashboard`)

const colors = computed(() =>
  resolveChannelColors(
    String(props.channel.id),
    profile.value?.custom_color_primary,
    profile.value?.custom_color_secondary,
  ),
)
const bannerStyle = computed(() => channelBannerStyle(colors.value.primary, colors.value.secondary))
const categoryTint = computed(() => ({
  color: colors.value.primary,
  background: `color-mix(in srgb, ${colors.value.primary} 12%, white)`,
}))

const categoryLabel = computed(() => {
  const first = profile.value?.categories?.[0]
  return first ? channelCategoryLabels[first] : null
})

const createdLabel = computed(() => formatShortDate(props.channel.created_at))

const isFollowing = ref(profile.value?.is_following ?? false)
const followersCount = ref(profile.value?.subscriber_count ?? 0)
const isToggling = ref(false)

watch(profile, (next) => {
  isFollowing.value = next?.is_following ?? false
  followersCount.value = next?.subscriber_count ?? 0
})

async function onToggleFollow() {
  if (isToggling.value) return

  if (!auth.isAuthenticated) {
    try {
      sessionStorage.setItem(AUTH_REDIRECT_KEY, route.fullPath)
      localStorage.setItem(AUTH_REDIRECT_KEY, route.fullPath)
    } catch {
      /* stockage indisponible */
    }
    router.push('/login')
    return
  }

  isToggling.value = true
  try {
    const result = await toggleChannelSubscription(props.channel.id)
    isFollowing.value = result.isFollowing
    followersCount.value = result.followersCount
  } finally {
    isToggling.value = false
  }
}
</script>

<template>
  <div
    class="group flex flex-col overflow-hidden rounded-2xl border border-[#18181f]/[0.08] bg-white shadow-[0_1px_3px_rgba(20,20,30,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-26px_rgba(15,23,42,0.4)]"
  >
    <RouterLink :to="detailPath" class="block">
      <div class="relative aspect-[992/230] w-full">
        <img
          v-if="profile?.banner_url"
          :src="profile.banner_url"
          :alt="`Bannière ${profile.name}`"
          class="h-full w-full object-cover"
        />
        <div v-else class="h-full w-full" :style="bannerStyle" />

        <span
          v-if="showStatus"
          class="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
          :style="{ background: status.bg, color: status.color }"
        >
          {{ status.label }}
        </span>
      </div>

      <div class="-mt-[26px] px-5">
        <div
          class="relative z-10 mb-3 flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[14px] border-[3px] border-white bg-white text-base font-extrabold text-white"
          :style="profile?.logo_url ? undefined : bannerStyle"
        >
          <img
            v-if="profile?.logo_url"
            :src="profile.logo_url"
            :alt="`Logo ${profile?.name ?? ''}`"
            class="h-full w-full object-cover"
          />
          <span v-else>{{ initials }}</span>
        </div>

        <div class="mb-1.5 flex flex-wrap items-center gap-1.5">
          <p class="text-base font-bold text-[#18181f]">{{ profile?.name }}</p>
          <ChannelBadgeList :slugs="channel.badges" :organization="channel.organization" size="sm" />
          <span
            v-if="categoryLabel"
            class="rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
            :style="categoryTint"
          >
            {{ categoryLabel }}
          </span>
        </div>
        <p class="mb-3.5 min-h-[39px] line-clamp-2 text-[13px] leading-[1.5] text-[#18181f]/55">
          {{ profile?.description }}
        </p>
      </div>
    </RouterLink>

    <div class="grid grid-cols-2 gap-1.5 px-5 pb-3.5">
      <div class="rounded-[9px] bg-[#f7f6fb] px-2.5 py-2.5">
        <div class="font-mono text-[13px] font-semibold text-[#18181f]">{{ formatCompactNumber(followersCount) }}</div>
        <div class="mt-0.5 text-[10.5px] font-semibold text-[#18181f]/45">Abonnés</div>
      </div>
      <div class="rounded-[9px] bg-[#f7f6fb] px-2.5 py-2.5">
        <div class="font-mono text-[13px] font-semibold text-[#18181f]">
          {{ formatCompactNumber(profile?.view_count ?? 0) }}
        </div>
        <div class="mt-0.5 text-[10.5px] font-semibold text-[#18181f]/45">Vues</div>
      </div>
    </div>

    <div class="mt-auto flex items-center justify-between gap-2.5 px-5 pb-[18px]">
      <span class="text-[11.5px] text-[#18181f]/45">Depuis {{ createdLabel }}</span>

      <RouterLink
        v-if="isOwner"
        :to="managePath"
        class="shrink-0 rounded-[9px] bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
      >
        Gérer →
      </RouterLink>
      <button
        v-else
        type="button"
        :disabled="isToggling"
        class="shrink-0 rounded-lg border-[1.5px] border-[var(--color-primary)]/30 px-3.5 py-1.5 text-xs font-bold text-[var(--color-primary)] transition disabled:opacity-60"
        :style="{ background: isFollowing ? '#f2ecfd' : '#fff' }"
        @click="onToggleFollow"
      >
        {{ isFollowing ? '✓ Suivi' : 'Suivre' }}
      </button>
    </div>
  </div>
</template>
