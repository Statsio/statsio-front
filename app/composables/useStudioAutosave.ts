import { watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { saveStatsDataDocument } from '@/api/studio'

const DEBOUNCE_MS = 1500

export function useStudioAutosave() {
  const studio = useStudioStore()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleAutosave() {
    const id = studio.content?.id
    // Never autosave the demo document — it has no backend record
    if (!id || id === 'demo') return
    if (!studio.isDirty) return

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => persist(), DEBOUNCE_MS)
  }

  async function persist() {
    const id = studio.content?.id
    if (!id || id === 'demo') return

    // Capture dirty version before the async save so we can detect
    // new changes that arrive while the request is in-flight.
    const versionAtSaveStart = studio.dirtyVersion

    studio.setSaveStatus('saving')
    try {
      await saveStatsDataDocument(id, studio.getPayload())

      if (studio.dirtyVersion === versionAtSaveStart) {
        // No new changes during the save → truly up to date
        studio.setSaveStatus('saved')
      } else {
        // New changes arrived while saving — stay dirty and reschedule
        studio.setSaveStatus('idle')
        scheduleAutosave()
      }
    } catch {
      studio.setSaveStatus('error')
      // Retry after a longer delay on failure
      debounceTimer = setTimeout(() => persist(), 5000)
    }
  }

  // Watch the dirty version counter (increments on every markDirty call).
  // This fires whenever isDirty is set, even if it was already true — solving
  // both the "change during save" and "error then new change" bugs.
  watch(() => studio.dirtyVersion, () => scheduleAutosave())

  function saveNow() {
    if (debounceTimer) clearTimeout(debounceTimer)
    return persist()
  }

  return { saveNow }
}
