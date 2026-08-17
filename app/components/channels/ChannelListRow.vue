<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toggleChannelSubscription, channelCategoryLabels, type Channel } from '@/api/channels'
import ChannelBadgeList from '@/components/channels/ChannelBadgeList.vue'
import { formatCompactNumber } from '@/lib/format'
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

const categoryLabel = computed(() => {
  const first = profile.value?.categories?.[0]
  return first ? channelCategoryLabels[first] : '—'
})

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
    class="grid grid-cols-[2.2fr_1fr_0.8fr_0.8fr_auto] items-center gap-4 border-t border-[#18181f]/[0.06] px-5 py-3.5 first:border-t-0 sm:px-6"
  >
    <RouterLink :to="detailPath" class="flex min-w-0 items-center gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[11px] text-sm font-extrabold text-white"
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
      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <p class="truncate text-[14.5px] font-bold text-[#18181f]">{{ profile?.name }}</p>
          <ChannelBadgeList :slugs="channel.badges" :organization="channel.organization" size="sm" />
        </div>
        <p class="truncate text-xs text-[#18181f]/50">{{ profile?.description }}</p>
      </div>
    </RouterLink>

    <span
      class="justify-self-start rounded-full px-2.5 py-1 text-xs font-semibold"
      :style="{ color: colors.primary, background: `color-mix(in srgb, ${colors.primary} 12%, white)` }"
    >
      {{ categoryLabel }}
    </span>

    <span class="font-mono text-[13px] font-semibold text-[#18181f]">{{ formatCompactNumber(followersCount) }}</span>
    <span class="font-mono text-[13px] text-[#18181f]/60">{{ formatCompactNumber(profile?.view_count ?? 0) }}</span>

    <RouterLink
      v-if="isOwner"
      :to="managePath"
      class="justify-self-end rounded-[9px] bg-[var(--color-primary)] px-3.5 py-2 text-xs font-bold text-white transition hover:brightness-110"
    >
      Gérer
    </RouterLink>
    <button
      v-else
      type="button"
      :disabled="isToggling"
      class="justify-self-end shrink-0 rounded-lg border-[1.5px] border-[var(--color-primary)]/30 px-3.5 py-1.5 text-xs font-bold text-[var(--color-primary)] transition disabled:opacity-60"
      :style="{ background: isFollowing ? '#f2ecfd' : '#fff' }"
      @click="onToggleFollow"
    >
      {{ isFollowing ? '✓ Suivi' : 'Suivre' }}
    </button>
  </div>
</template>
