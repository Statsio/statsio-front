import { onMounted, reactive, ref, watch, type Ref } from 'vue'
import {
  getChannelFeaturedContent,
  updateChannelFeaturedContent,
  type FeaturedContent,
} from '@/api/channels'
import { getHttpErrorStatus } from '@/lib/http-errors'

export type FeaturedSlotKey = 'article' | 'statsdata' | 'survey'

const SLOT_FIELD: Record<FeaturedSlotKey, 'featured_article_id' | 'featured_statsdata_id' | 'featured_survey_id'> = {
  article: 'featured_article_id',
  statsdata: 'featured_statsdata_id',
  survey: 'featured_survey_id',
}

/**
 * Contenu mis en avant d'une chaîne, côté dashboard propriétaire — get + set par slot
 * (article/statsdata/survey). L'API renvoie 403 si l'utilisateur connecté n'est pas
 * owner/admin de la chaîne ; ce n'est jamais vérifié côté client (pas de gate de rôle
 * ailleurs dans ce dashboard non plus), l'erreur est simplement affichée si la sauvegarde échoue.
 */
export function useChannelFeaturedContent(channelId: Ref<number>) {
  const featured = ref<FeaturedContent | null>(null)
  const loading = ref(true)
  const saving = reactive<Record<FeaturedSlotKey, boolean>>({ article: false, statsdata: false, survey: false })
  const error = ref('')

  async function load() {
    if (!channelId.value) return
    loading.value = true
    try {
      featured.value = await getChannelFeaturedContent(channelId.value)
    } finally {
      loading.value = false
    }
  }

  onMounted(load)
  watch(channelId, load)

  async function setSlot(slot: FeaturedSlotKey, contentId: number | null) {
    saving[slot] = true
    error.value = ''
    try {
      featured.value = await updateChannelFeaturedContent(channelId.value, { [SLOT_FIELD[slot]]: contentId })
    } catch (e) {
      error.value =
        getHttpErrorStatus(e, 500) === 403
          ? 'Seuls les propriétaires et administrateurs peuvent modifier la mise en avant.'
          : "Impossible d'enregistrer cette sélection."
    } finally {
      saving[slot] = false
    }
  }

  return { featured, loading, saving, error, setSlot, reload: load }
}
