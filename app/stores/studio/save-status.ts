import { ref } from 'vue'
import type { SaveStatus } from '@/types/studio'

export function useStudioSaveStatus() {
  const saveStatus = ref<SaveStatus>('idle')
  /** Statut HTTP de la dernière sauvegarde en échec définitif (404 supprimé, 403 accès révoqué) ; null sinon. */
  const saveErrorStatus = ref<number | null>(null)
  const isDirty = ref(false)
  const dirtyVersion = ref(0)

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
  }

  /** Réinitialise le statut de sauvegarde — appelé par `initPage` au chargement d'un document. */
  function resetSaveStatus() {
    saveStatus.value = 'idle'
    saveErrorStatus.value = null
    isDirty.value = false
    dirtyVersion.value = 0
  }

  return { saveStatus, saveErrorStatus, isDirty, dirtyVersion, setSaveStatus, setSaveError, markDirty, resetSaveStatus }
}
