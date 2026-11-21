<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DsBox from '@/components/ds/DsBox.vue'
import ChannelAvatar from '@/components/channels/listing/ChannelAvatar.vue'
import ChannelBanner from '@/components/channels/listing/ChannelBanner.vue'
import ChannelFollowButton from '@/components/channels/listing/ChannelFollowButton.vue'
import ChannelKindBadge from '@/components/channels/listing/ChannelKindBadge.vue'
import ChannelVerifiedMark from '@/components/channels/listing/ChannelVerifiedMark.vue'
import { toggleChannelSubscription, type Channel } from '@/api/channels'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { publicChannelPath } from '@/lib/content-display'
import { formatCompactNumber } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { AUTH_REDIRECT_KEY } from '@/lib/auth-storage'

const props = defineProps<{ channel: Channel }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const basePath = useContentBasePath()

const profile = computed(() => props.channel.profile)
const to = computed(() => publicChannelPath(profile.value?.handle ?? '', basePath.value))
const visual = computed(() => ({
  id: props.channel.id,
  name: profile.value?.name ?? 'Chaîne',
  kind: profile.value?.kind ?? 'independant',
  logo_url: profile.value?.logo_url ?? null,
  banner_url: profile.value?.banner_url ?? null,
  custom_color_primary: profile.value?.custom_color_primary ?? null,
  custom_color_secondary: profile.value?.custom_color_secondary ?? null,
}))
const verified = computed(() => props.channel.badges?.includes('verified') ?? false)
const handle = computed(() => {
  const raw = profile.value?.handle ?? ''
  return raw.startsWith('@') ? raw : `@${raw}`
})

const following = ref(profile.value?.is_following ?? false)
const followers = ref(profile.value?.subscriber_count ?? 0)
const busy = ref(false)
watch(profile, (next) => {
  following.value = next?.is_following ?? false
  followers.value = next?.subscriber_count ?? 0
})

async function toggle() {
  if (busy.value) return
  if (!auth.isAuthenticated) {
    try {
      sessionStorage.setItem(AUTH_REDIRECT_KEY, route.fullPath)
      localStorage.setItem(AUTH_REDIRECT_KEY, route.fullPath)
    } catch {
      /* stockage indisponible */
    }
    await router.push('/login')
    return
  }
  busy.value = true
  try {
    const result = await toggleChannelSubscription(props.channel.id)
    following.value = result.isFollowing
    followers.value = result.followersCount
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <DsBox v-if="profile" as="article" interactive class="sim">
    <ChannelBanner :item="visual" :to="to" />
    <div class="sim__bd">
      <div class="sim__head">
        <ChannelAvatar :item="visual" />
        <ChannelFollowButton :following="following" :name="profile.name" @toggle="toggle" />
      </div>
      <div class="sim__name">
        <NuxtLink :to="to"><h3>{{ profile.name }}</h3></NuxtLink>
        <ChannelVerifiedMark v-if="verified" />
      </div>
      <div class="sim__row">
        <ChannelKindBadge :kind="visual.kind" />
        <span class="sim__meta">{{ handle }} · {{ formatCompactNumber(followers) }} abonnés</span>
      </div>
      <p v-if="profile.description" class="sim__desc">{{ profile.description }}</p>
    </div>
  </DsBox>
</template>

<style scoped>
.sim {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sim__bd {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 0 18px 18px;
}
.sim__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: -34px;
}
.sim__name {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 10px;
}
.sim__name h3 {
  margin: 0;
  font: 800 22px/1.05 var(--ds-display);
  font-stretch: 95%;
  letter-spacing: -0.01em;
}
.sim__name a:hover h3 {
  color: var(--ds-link);
}
.sim__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.sim__meta,
.sim__desc {
  color: var(--ds-muted);
  font: 400 12px var(--ds-num);
}
.sim__desc {
  margin: 0;
  font: 400 14px/1.5 var(--ds-ui);
}
</style>
