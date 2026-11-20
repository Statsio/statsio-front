import { shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { fetchStatsDataCardPreview } from '@/api/studio'
import { isUsablePreview } from '@/lib/statsdata-listing'
import type { CardPreview } from '@/types/catalog'

/**
 * Cache mémoire des aperçus par slug, partagé par toutes les cartes et lignes du
 * listing : une seule requête par StatsData, même si la grille et la liste
 * l'affichent tour à tour. Les échecs ne sont pas mis en cache (nouvel essai
 * au prochain survol).
 */
const cache = new Map<string, Promise<CardPreview | null>>()

function fetchOnce(slug: string): Promise<CardPreview | null> {
  let pending = cache.get(slug)
  if (!pending) {
    pending = fetchStatsDataCardPreview(slug)
      .then((data) => (isUsablePreview(data) ? data : null))
      .catch(() => {
        cache.delete(slug)
        return null
      })
    cache.set(slug, pending)
  }
  return pending
}

/**
 * Aperçu graphique réel d'un StatsData (premier bloc graphique, ou celui choisi
 * par le créateur), chargé à la demande via `load()` — au survol d'une carte, à
 * l'entrée dans l'écran d'une ligne. `status` : `idle` → `loading` → `ready` | `empty`.
 */
export function useStatsDataPreview(slug: MaybeRefOrGetter<string>) {
  const preview = shallowRef<CardPreview | null>(null)
  const status = shallowRef<'idle' | 'loading' | 'ready' | 'empty'>('idle')

  async function load() {
    if (status.value !== 'idle') return
    status.value = 'loading'
    const requested = toValue(slug)
    const data = await fetchOnce(requested)
    if (requested !== toValue(slug)) return
    preview.value = data
    status.value = data ? 'ready' : 'empty'
  }

  watch(
    () => toValue(slug),
    () => {
      preview.value = null
      status.value = 'idle'
    },
  )

  return { preview, status, load }
}

/** Tests uniquement : vide le cache partagé. */
export function clearStatsDataPreviewCache() {
  cache.clear()
}
