import { computed, ref } from 'vue'
import { fetchSubscriptions } from '@/api/statsio-account'
import { toggleChannelSubscription } from '@/api/channels'
import { resolveChannelColors } from '@/lib/channel-brand'
import { getNameInitials } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import type { AccountSubscription } from '@/types/account'

interface DisplaySubscription {
  id: number
  name: string
  handle: string | null
  description: string | null
  logoUrl: string | null
  initials: string
  color: string
  subscriberCount: number
  following: boolean
  pending: boolean
}

export function useAccountSubscriptions() {
  const auth = useAuthStore()
  const raw = ref<AccountSubscription[]>([])
  const following = ref<Record<number, boolean>>({})
  const pending = ref<Record<number, boolean>>({})
  const loading = ref(true)
  const error = ref<string | null>(null)

  const items = computed<DisplaySubscription[]>(() =>
    raw.value.map((s) => {
      const colors = resolveChannelColors(String(s.id), s.custom_color_primary, s.custom_color_secondary)
      return {
        id: s.id,
        name: s.name ?? 'Chaîne',
        handle: s.handle,
        description: s.description,
        logoUrl: s.logo_url,
        initials: getNameInitials(s.name ?? 'Chaîne'),
        color: colors.primary,
        subscriberCount: s.subscriber_count,
        following: following.value[s.id] ?? true,
        pending: pending.value[s.id] ?? false,
      }
    }),
  )
  const isEmpty = computed(() => !loading.value && raw.value.length === 0)

  async function load() {
    loading.value = true
    error.value = null
    try {
      raw.value = await fetchSubscriptions()
      following.value = Object.fromEntries(raw.value.map((s) => [s.id, true]))
    } catch {
      error.value = 'Impossible de charger vos abonnements.'
    } finally {
      loading.value = false
    }
  }

  async function toggle(id: number) {
    pending.value[id] = true
    const wasFollowing = following.value[id] ?? true
    try {
      const res = await toggleChannelSubscription(id)
      following.value[id] = res.isFollowing
      if (auth.user?.counts) {
        auth.user.counts.subscriptions = Math.max(0, auth.user.counts.subscriptions + (res.isFollowing ? 1 : -1))
      }
    } catch {
      following.value[id] = wasFollowing
      error.value = "L'opération a échoué."
    } finally {
      pending.value[id] = false
    }
  }

  return { items, loading, error, isEmpty, load, toggle }
}
