import { computed } from 'vue'
import {
  fetchStatsDataDocument,
  saveStatsDataDocument,
  publishStudioContent,
  unpublishStudioContent,
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
  const publishModalOpen = useState('content-dashboard:publish-open', () => false)

  const notifications = useAppNotifications()

  const contentType = computed<ContentType>(() => content.value?.type ?? 'statsdata')
  const typeLabel = computed(() => CONTENT_TYPE_META[contentType.value].label)
  const statusMeta = computed(() => getStatusMeta(content.value?.status))
  const publishMode = computed<'author' | 'confirm'>(() =>
    content.value?.first_published_at ? 'confirm' : 'author',
  )
  const publishNextVersion = computed(() => (content.value?.published_version ?? 0) + 1)

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

  /**
   * Ouvre le flux de publication : re-publication directe si l'auteur est déjà
   * verrouillé, sinon la modal de choix profil / chaîne.
   */
  function startPublish() {
    const doc = content.value
    if (!doc) return
    if (doc.status !== 'published' && doc.first_published_at) {
      void confirmPublish({})
      return
    }
    publishModalOpen.value = true
  }

  async function confirmPublish(opts: { publishedAs?: 'user' | 'channel'; channelId?: number | null } = {}) {
    const id = content.value?.slug || content.value?.id
    if (!id) return
    isPublishing.value = true
    try {
      content.value = await publishStudioContent(id, opts)
      publishModalOpen.value = false
      notifications.success('Contenu publié.')
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      notifications.error(status === 403 ? 'Vous ne gérez pas cette chaîne.' : "Le contenu n'a pas pu être publié.")
    } finally {
      isPublishing.value = false
    }
  }

  async function unpublish() {
    const id = content.value?.slug || content.value?.id
    if (!id) return
    isPublishing.value = true
    try {
      content.value = await unpublishStudioContent(id)
      notifications.success('Contenu dépublié.')
    } catch {
      notifications.error("Le contenu n'a pas pu être dépublié.")
    } finally {
      isPublishing.value = false
    }
  }

  return {
    content,
    isLoading,
    loadError,
    isPublishing,
    publishModalOpen,
    publishMode,
    publishNextVersion,
    contentType,
    typeLabel,
    statusMeta,
    studioPath,
    publicPath,
    propertiesBase,
    ensureLoaded,
    reload,
    patch,
    startPublish,
    confirmPublish,
    unpublish,
  }
}
