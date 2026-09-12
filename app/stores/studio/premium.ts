import { ref, type Ref } from 'vue'
import type { BlockType, StudioBlock, StudioContent } from '@/types/studio'
import { FORM_BLOCK_TYPES } from '@/types/studio'
import { fetchBlockGates, type RequiredOffer } from '@/api/studio-block-gates'
import { useAuthStore } from '@/stores/auth'

export function useStudioPremium(deps: {
  content: Ref<StudioContent | null>
  blocks: Ref<StudioBlock[]>
}) {
  const { content, blocks } = deps
  const authStore = useAuthStore()

  /** Types de blocs réservés à une offre payante (classification back-office) — voir /offres. */
  const premiumBlockTypes = ref<BlockType[]>([])
  /** Offre réelle (CRUD Offres) qui débloque chaque bloc premium — pour l'affichage, pas de libellé codé en dur. */
  const premiumBlockOffers = ref<Partial<Record<BlockType, RequiredOffer>>>({})
  const premiumGatesLoaded = ref(false)
  /** Type de bloc dont l'ajout vient d'être bloqué → pilote la modale d'upsell. */
  const premiumUpsellBlockType = ref<BlockType | null>(null)

  function isBlockPremium(type: BlockType): boolean {
    return premiumBlockTypes.value.includes(type)
  }

  /** Nom de l'offre réelle qui débloque ce bloc — undefined tant que non chargé/configuré. */
  function requiredOfferForBlock(type: BlockType): RequiredOffer | undefined {
    return premiumBlockOffers.value[type]
  }

  /** L'utilisateur peut-il utiliser ce type de bloc ? Le back reste la source de vérité. */
  function canUseBlock(type: BlockType): boolean {
    return !isBlockPremium(type) || authStore.isPremium
  }

  function requestPremiumUpsell(type: BlockType) {
    premiumUpsellBlockType.value = type
  }

  /**
   * Un sondage « question unique » (`survey_kind === 'single_question'`) ne peut
   * contenir qu'un seul bloc de formulaire — vrai dès qu'un bloc formulaire existe
   * déjà et que `type` en est un lui aussi.
   */
  function isFormBlockLimitReached(type: BlockType): boolean {
    if (!FORM_BLOCK_TYPES.includes(type)) return false
    if (content.value?.type !== 'survey' || content.value?.survey_kind !== 'single_question') return false
    return blocks.value.some((b) => FORM_BLOCK_TYPES.includes(b.type))
  }

  function dismissPremiumUpsell() {
    premiumUpsellBlockType.value = null
  }

  /** Chargé une seule fois par session d'édition (données globales, pas par document). */
  async function loadPremiumBlockGates() {
    if (premiumGatesLoaded.value) return
    premiumGatesLoaded.value = true
    try {
      const gates = await fetchBlockGates()
      premiumBlockTypes.value = gates.types
      premiumBlockOffers.value = gates.offerByType
    } catch {
      // Best-effort : sans cette liste, aucune pastille n'est affichée mais le
      // back refuse toujours l'enregistrement d'un bloc premium (source de vérité).
    }
  }

  return {
    premiumBlockTypes,
    premiumBlockOffers,
    premiumUpsellBlockType,
    isBlockPremium,
    requiredOfferForBlock,
    canUseBlock,
    isFormBlockLimitReached,
    requestPremiumUpsell,
    dismissPremiumUpsell,
    loadPremiumBlockGates,
  }
}
