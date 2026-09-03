import { reactive } from 'vue'
import type { MediaItem } from '@/api/media'

export type MediaLibraryMode = 'pick' | 'browse'

interface MediaLibraryState {
  open: boolean
  mode: MediaLibraryMode
  /** Répertoire de destination des uploads faits depuis la modale. */
  directory: string
}

interface OpenOpts {
  /** `pick` (défaut) : on peut sélectionner une image ; `browse` : simple gestion. */
  mode?: MediaLibraryMode
  directory?: string
  /** Appelé quand l'utilisateur choisit une image (mode `pick`). */
  onSelect?: (media: MediaItem) => void
}

const state = reactive<MediaLibraryState>({
  open: false,
  mode: 'pick',
  directory: 'studio/images',
})

let onSelect: ((media: MediaItem) => void) | null = null

/**
 * Bibliothèque de médias — modale partagée (Studio, dashboard contenu, …).
 * Singleton : une seule `<MediaLibraryModal>` montée pour toute l'app (voir `app.vue`).
 */
export function useMediaLibrary() {
  function open(opts: OpenOpts = {}) {
    onSelect = opts.onSelect ?? null
    state.mode = opts.mode ?? (opts.onSelect ? 'pick' : 'browse')
    state.directory = opts.directory ?? 'studio/images'
    state.open = true
  }

  function select(media: MediaItem) {
    onSelect?.(media)
    close()
  }

  function close() {
    state.open = false
    onSelect = null
  }

  return { state, open, select, close }
}
