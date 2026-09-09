import { computed } from 'vue'
import { EMPTY_PLATFORM_STATS, fetchPlatformStats } from '@/api/platform-stats'

/**
 * Chiffres publics de la plateforme (nombre de StatsData, datasets, chaînes…),
 * affichés sur les pages vitrine et les écrans d'authentification. Un seul appel
 * partagé entre toutes les pages via la clé `useAsyncData`.
 */
export function usePlatformStats() {
  const { data, pending, error, refresh } = useAsyncData('platform-stats', fetchPlatformStats, {
    default: () => EMPTY_PLATFORM_STATS,
  })

  const stats = computed(() => data.value ?? EMPTY_PLATFORM_STATS)
  const ready = computed(() => !pending.value && !error.value && stats.value.publishedTotal > 0)

  return { stats, ready, pending, error, refresh }
}
