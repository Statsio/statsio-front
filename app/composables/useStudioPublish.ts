import { computed, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { publishStudioContent } from '@/api/studio'

/**
 * Orchestration du bouton « Publier » du Studio :
 *  - force un enregistrement du brouillon (l'instantané doit être à jour) ;
 *  - ouvre `StudioPublishModal` — choix profil/chaîne à la 1re publication,
 *    simple confirmation « Publier la version N » ensuite ;
 *  - appelle l'API et met à jour `studio.content`.
 */
export function useStudioPublish(saveNow: () => Promise<void> | void) {
  const studio = useStudioStore()

  const isOpen = ref(false)
  const isPublishing = ref(false)

  const alreadyPublishedOnce = computed(() => !!studio.content?.first_published_at)
  /** 'author' = 1re publication (choix du profil), 'confirm' = re-publication. */
  const mode = computed<'author' | 'confirm'>(() => (alreadyPublishedOnce.value ? 'confirm' : 'author'))
  const nextVersion = computed(() => (studio.content?.published_version ?? 0) + 1)

  async function open() {
    if (!studio.content?.id || studio.content.id === 'demo') return
    try {
      await saveNow()
    } catch {
      /* l'écran d'erreur du guard prend le relais si la sauvegarde échoue vraiment */
    }
    isOpen.value = true
  }

  function close() {
    if (isPublishing.value) return
    isOpen.value = false
  }

  async function confirm(opts: { publishedAs?: 'user' | 'channel'; channelId?: number | null } = {}) {
    const id = studio.content?.id
    if (!id || id === 'demo') return
    isPublishing.value = true
    try {
      const updated = await publishStudioContent(id, opts)
      if (studio.content) {
        studio.content.status = 'published'
        studio.content.published_version = updated.published_version ?? nextVersion.value
        studio.content.first_published_at = updated.first_published_at ?? new Date().toISOString()
        studio.content.published_as = updated.published_as ?? studio.content.published_as
        studio.content.channel_id = updated.channel_id ?? studio.content.channel_id
      }
      isOpen.value = false
    } finally {
      isPublishing.value = false
    }
  }

  return { isOpen, isPublishing, mode, nextVersion, open, close, confirm }
}
