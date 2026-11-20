import { onMounted, type Ref } from 'vue'
import { getStoredToken } from '@/lib/auth-storage'

/** Champs d'un contenu qui dépendent du visiteur (absents d'un rendu SSR anonyme). */
export interface ViewerDocFields {
  can_edit?: boolean
  is_favorited?: boolean
}

/**
 * Les pages détail sont rendues côté serveur sans session (le jeton vit dans le
 * navigateur) : `can_edit` / `is_favorited` y sont donc toujours faux. Une fois
 * monté, un visiteur connecté recharge le contenu et ne recopie que ces champs.
 */
export function useViewerDocRefresh<T extends ViewerDocFields>(
  doc: Ref<T | null | undefined>,
  refetch: () => Promise<T>,
  onRefreshed?: (fresh: T) => void,
) {
  onMounted(async () => {
    if (!doc.value || !getStoredToken()) return
    try {
      const fresh = await refetch()
      if (!doc.value) return
      if (fresh.can_edit !== doc.value.can_edit || fresh.is_favorited !== doc.value.is_favorited) {
        doc.value = { ...doc.value, can_edit: fresh.can_edit, is_favorited: fresh.is_favorited }
      }
      onRefreshed?.(fresh)
    } catch { /* best effort */ }
  })
}
