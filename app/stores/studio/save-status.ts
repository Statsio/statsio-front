import { ref, type Ref } from 'vue'
import type { SaveStatus, StudioContent } from '@/types/studio'

function draftAheadOfPublish(doc: StudioContent | null | undefined): boolean {
  if (!doc || doc.status !== 'published') return false
  const updated = doc.updated_at
  const published = doc.last_published_at
  if (!updated || !published) return false
  return new Date(updated).getTime() > new Date(published).getTime()
}

export function useStudioSaveStatus(opts?: { content: Ref<StudioContent | null> }) {
  const saveStatus = ref<SaveStatus>('idle')
  /** Statut HTTP de la dernière sauvegarde en échec définitif (404 supprimé, 403 accès révoqué) ; null sinon. */
  const saveErrorStatus = ref<number | null>(null)
  const isDirty = ref(false)
  const dirtyVersion = ref(0)
  /**
   * Brouillon enregistré (ou en cours d'édition) en avance sur la version publique.
   * Distinct de `isDirty` : l'autosave efface `isDirty` sans republier.
   */
  const hasUnpublishedChanges = ref(false)

  function setSaveStatus(status: SaveStatus) {
    saveStatus.value = status
    if (status === 'saved') isDirty.value = false
    if (status === 'saved' || status === 'saving') saveErrorStatus.value = null
  }

  /** L'autosave a échoué définitivement (document supprimé / accès révoqué) — plus de retry. */
  function setSaveError(status: number) {
    saveStatus.value = 'error'
    saveErrorStatus.value = status
  }

  function markDirty() {
    isDirty.value = true
    saveStatus.value = 'idle'
    dirtyVersion.value++
    if (opts?.content.value?.status === 'published') hasUnpublishedChanges.value = true
  }

  /** Réinitialise le statut de sauvegarde — appelé par `initPage` au chargement d'un document. */
  function resetSaveStatus(pageContent?: StudioContent | null) {
    saveStatus.value = 'idle'
    saveErrorStatus.value = null
    isDirty.value = false
    dirtyVersion.value = 0
    hasUnpublishedChanges.value = draftAheadOfPublish(pageContent)
  }

  /** Après une publication réussie : le brouillon et le public sont alignés. */
  function markPublished(meta: {
    published_version?: number | null
    first_published_at?: string | null
    last_published_at?: string | null
    published_as?: 'user' | 'channel' | null
    channel_id?: number | null
    scheduled_publish_at?: string | null
    status?: StudioContent['status']
  } = {}) {
    const doc = opts?.content.value
    if (!doc) return
    const now = new Date().toISOString()
    doc.status = meta.status ?? 'published'
    if (meta.published_version !== undefined) doc.published_version = meta.published_version
    if (meta.first_published_at !== undefined) doc.first_published_at = meta.first_published_at
    doc.last_published_at = meta.last_published_at ?? now
    doc.updated_at = doc.last_published_at
    if (meta.published_as !== undefined) doc.published_as = meta.published_as
    if (meta.channel_id !== undefined) doc.channel_id = meta.channel_id
    if (meta.scheduled_publish_at !== undefined) doc.scheduled_publish_at = meta.scheduled_publish_at
    hasUnpublishedChanges.value = false
  }

  return {
    saveStatus,
    saveErrorStatus,
    isDirty,
    dirtyVersion,
    hasUnpublishedChanges,
    setSaveStatus,
    setSaveError,
    markDirty,
    resetSaveStatus,
    markPublished,
  }
}
