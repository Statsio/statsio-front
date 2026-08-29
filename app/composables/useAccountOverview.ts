import { computed, ref } from 'vue'
import { fetchInProgress, fetchSubscriptions } from '@/api/statsio-account'
import { toDisplayAccountContent } from '@/lib/account-content'
import { resolveChannelColors } from '@/lib/channel-brand'
import { getNameInitials } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import type { AccountInProgressItem, AccountSubscription } from '@/types/account'

export function useAccountOverview() {
  const auth = useAuthStore()
  const inProgressRaw = ref<AccountInProgressItem[]>([])
  const subscriptionsRaw = ref<AccountSubscription[]>([])
  const loading = ref(true)

  const inProgress = computed(() =>
    inProgressRaw.value.map((it) => ({
      ...toDisplayAccountContent(it),
      progress: it.progress ?? 0,
    })),
  )

  const activeChannels = computed(() =>
    subscriptionsRaw.value.slice(0, 5).map((s) => {
      const colors = resolveChannelColors(String(s.id), s.custom_color_primary, s.custom_color_secondary)
      return {
        id: s.id,
        name: s.name ?? 'Chaîne',
        handle: s.handle,
        initials: getNameInitials(s.name ?? 'Chaîne'),
        color: colors.primary,
        logoUrl: s.logo_url,
        subscriberCount: s.subscriber_count,
      }
    }),
  )

  const kpis = computed(() => {
    const counts = auth.user?.counts
    return [
      { label: 'Contenus publiés', value: String(counts?.contents ?? 0), note: 'en votre nom ou via une chaîne' },
      { label: 'Chaînes suivies', value: String(counts?.subscriptions ?? 0), note: 'publications reçues' },
      { label: 'Favoris', value: String(counts?.favorites ?? 0), note: 'enregistrés pour plus tard' },
    ]
  })

  async function load() {
    loading.value = true
    try {
      const [ip, subs] = await Promise.all([
        fetchInProgress().catch(() => []),
        fetchSubscriptions().catch(() => []),
      ])
      inProgressRaw.value = ip
      subscriptionsRaw.value = subs
    } finally {
      loading.value = false
    }
  }

  return { kpis, inProgress, activeChannels, loading, load }
}
