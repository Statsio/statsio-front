<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toggleChannelSubscription, type Channel } from '@/api/channels'
import { formatCompactNumber } from '@/lib/format'
import { channelBannerStyle, resolveChannelColors } from '@/lib/channel-brand'
import { useAuthStore } from '@/stores/auth'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'

const props = defineProps<{
  channel: Channel
}>()

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

const colors = computed(() =>
  resolveChannelColors(
    String(props.channel.id),
    profile.value?.custom_color_primary,
    profile.value?.custom_color_secondary,
  ),
)
const bannerStyle = computed(() => channelBannerStyle(colors.value.primary, colors.value.secondary))

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
    class="group overflow-hidden rounded-2xl border border-[#18181f]/[0.08] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-26px_rgba(15,23,42,0.4)]"
  >
    <RouterLink :to="detailPath" class="block">
      <div class="h-16 w-full">
        <img
          v-if="profile?.banner_url"
          :src="profile.banner_url"
          :alt="`Bannière ${profile.name}`"
          class="h-full w-full object-cover"
        />
        <div v-else class="h-full w-full" :style="bannerStyle" />
      </div>

      <div class="-mt-7 px-5">
        <div
          class="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[14px] border-[3px] border-white text-lg font-bold text-white"
          :style="{ background: colors.primary }"
        >
          <img
            v-if="profile?.logo_url"
            :src="profile.logo_url"
            :alt="`Logo ${profile?.name ?? ''}`"
            class="h-full w-full object-cover"
          />
          <span v-else>{{ initials }}</span>
        </div>

        <p class="mb-1 truncate text-base font-bold text-[#18181f]">{{ profile?.name }}</p>
        <p class="mb-3 min-h-9 line-clamp-2 text-[13px] leading-[1.4] text-[#18181f]/55">
          {{ profile?.description }}
        </p>
      </div>
    </RouterLink>

    <div class="flex items-center justify-between gap-3 px-5 pb-5">
      <span class="text-xs text-[#18181f]/50"> {{ formatCompactNumber(followersCount) }} abonnés </span>
      <button
        type="button"
        :disabled="isToggling"
        class="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-60"
        :style="{
          background: isFollowing ? 'rgba(20,20,30,0.08)' : colors.primary,
          color: isFollowing ? '#18181f' : '#fff',
        }"
        @click="onToggleFollow"
      >
        {{ isFollowing ? '✓ Suivi' : 'Suivre' }}
      </button>
    </div>
  </div>
</template>
