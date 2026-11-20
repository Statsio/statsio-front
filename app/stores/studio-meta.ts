import { defineStore } from 'pinia'
import { ref } from 'vue'
import { saveStatsDataDocument, type SaveStatsDataDocumentPayload, type StatsDataDocument } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'

/**
 * Métadonnées du document ouvert dans le Studio (chapô, couverture, domaine,
 * dossiers, auteur, réglages du sondage…) — tout ce que le store `studio` ne porte
 * pas parce que l'autosave ne l'envoie pas. Alimente le hero éditable du canevas,
 * l'inspecteur « Propriétés » et l'onglet « Réglages » du sondage.
 *
 * Chaque modification part en PATCH (débouncé pour les champs texte) sur le même
 * endpoint que la page Propriétés (`saveStatsDataDocument`).
 */
export const useStudioMetaStore = defineStore('studio-meta', () => {
  const doc = ref<StatsDataDocument | null>(null)
  const saving = ref(false)
  const error = ref<string | null>(null)

  let pending: SaveStatsDataDocumentPayload = {}
  let timer: ReturnType<typeof setTimeout> | null = null

  function init(value: StatsDataDocument | null) {
    doc.value = value
    pending = {}
    error.value = null
  }

  async function flush(): Promise<boolean> {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    const id = doc.value?.slug || doc.value?.id
    const payload = pending
    pending = {}
    if (!id || !Object.keys(payload).length) return true
    saving.value = true
    error.value = null
    try {
      const updated = await saveStatsDataDocument(id, payload)
      // On garde la structure (pages/sections/blocs) gérée par le store `studio`.
      doc.value = { ...doc.value!, ...updated, pages: undefined, sections: undefined, blocks: undefined }
      const studio = useStudioStore()
      if (studio.content && updated.slug) studio.content.slug = updated.slug
      return true
    } catch {
      error.value = "Les réglages n'ont pas pu être enregistrés."
      return false
    } finally {
      saving.value = false
    }
  }

  /** Met à jour localement puis enregistre (immédiatement, ou après `delay` ms). */
  function patch(payload: SaveStatsDataDocumentPayload, delay = 0): Promise<boolean> | void {
    if (!doc.value) return
    doc.value = { ...doc.value, ...(payload as Partial<StatsDataDocument>) }
    pending = { ...pending, ...payload }
    if (timer) clearTimeout(timer)
    if (delay > 0) {
      timer = setTimeout(() => void flush(), delay)
      return
    }
    return flush()
  }

  /** Couverture choisie dans la bibliothèque de médias (ou retirée). */
  async function setThumbnail(mediaId: number | null): Promise<boolean> {
    const id = doc.value?.slug || doc.value?.id
    if (!id) return false
    saving.value = true
    try {
      const updated = await saveStatsDataDocument(id, {}, mediaId ?? undefined, mediaId === null)
      doc.value = { ...doc.value!, thumbnail_url: updated.thumbnail_url ?? null }
      return true
    } catch {
      error.value = "La couverture n'a pas pu être enregistrée."
      return false
    } finally {
      saving.value = false
    }
  }

  return { doc, saving, error, init, patch, flush, setThumbnail }
})
