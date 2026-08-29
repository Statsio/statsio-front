import { computed } from 'vue'
import {
  fetchStatsDataDocument,
  saveStatsDataDocument,
  setStatsDataDocumentStatus,
  type SaveStatsDataDocumentPayload,
  type StatsDataDocument,
} from '@/api/studio'
import { CONTENT_TYPE_META, getStatusMeta, publicContentPath } from '@/lib/content-display'
import type { ContentType } from '@/types/content-creation'

/**
 * État partagé du dashboard « Propriétés » d'un contenu : le contenu courant est
 * chargé une seule fois (par le layout) puis partagé entre la sidebar, la topbar
 * et les pages d'onglet.
 */
export function useContentDashboard() {
  const content = useState<StatsDataDocument | null>('content-dashboard:content', () => null)
  const isLoading = useState('content-dashboard:loading', () => false)
  const loadError = useState('content-dashboard:error', () => '')
  const loadedSlug = useState<string | null>('content-dashboard:slug', () => null)
  const isPublishing = useState('content-dashboard:publishing', () => false)

  const notifications = useAppNotifications()

  const contentType = computed<ContentType>(() => content.value?.type ?? 'statsdata')
  const typeLabel = computed(() => CONTENT_TYPE_META[contentType.value].label)
  const statusMeta = computed(() => getStatusMeta(content.value?.status, content.value?.visibility))

  const slugOrId = computed(
    () => content.value?.slug || content.value?.id || loadedSlug.value || '',
  )
  const studioPath = computed(() => `/studio/${contentType.value}/${slugOrId.value}`)
  const publicPath = computed(() => {
    const slug = content.value?.slug
    return statusMeta.value.live && slug ? publicContentPath(contentType.value, slug) : null
  })
  const propertiesBase = computed(() => `/contenu/${slugOrId.value}/proprietes`)

  async function ensureLoaded(slug: string) {
    if (loadedSlug.value === slug && content.value) return
    isLoading.value = true
    loadError.value = ''
    content.value = null
    loadedSlug.value = slug
    try {
      content.value = await fetchStatsDataDocument(slug)
    } catch {
      loadError.value = 'Contenu introuvable.'
    } finally {
      isLoading.value = false
    }
  }

  async function reload() {
    if (!loadedSlug.value) return
    content.value = await fetchStatsDataDocument(loadedSlug.value)
  }

  /**
   * Persiste un sous-ensemble de champs et met à jour le contenu partagé.
   * Renvoie `true` en cas de succès.
   */
  async function patch(
    payload: SaveStatsDataDocumentPayload,
    thumbnail?: File | null,
    removeThumbnail?: boolean,
  ): Promise<boolean> {
    const id = content.value?.slug || content.value?.id
    if (!id) return false
    try {
      const updated = await saveStatsDataDocument(id, payload, thumbnail, removeThumbnail)
      content.value = updated
      if (updated.slug && updated.slug !== loadedSlug.value) loadedSlug.value = updated.slug
      notifications.success('Modifications enregistrées.')
      return true
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      notifications.error(
        status === 422
          ? "Certaines valeurs sont invalides (l'adresse est peut-être déjà prise)."
          : "Les modifications n'ont pas pu être enregistrées.",
      )
      return false
    }
  }

  async function togglePublish() {
    const id = content.value?.slug || content.value?.id
    if (!id || !content.value) return
    const next = content.value.status === 'published' ? 'draft' : 'published'
    isPublishing.value = true
    try {
      content.value = await setStatsDataDocumentStatus(id, next)
      notifications.success(next === 'published' ? 'Contenu publié.' : 'Contenu dépublié.')
    } catch {
      notifications.error("Le statut n'a pas pu être modifié.")
    } finally {
      isPublishing.value = false
    }
  }

  return {
    content,
    isLoading,
    loadError,
    isPublishing,
    contentType,
    typeLabel,
    statusMeta,
    studioPath,
    publicPath,
    propertiesBase,
    ensureLoaded,
    reload,
    patch,
    togglePublish,
  }
}
