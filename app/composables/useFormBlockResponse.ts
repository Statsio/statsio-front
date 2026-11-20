import { ref, computed, onMounted } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { fetchBlockResponse, submitBlockResponse, type BlockResponseAggregate, type BlockResponseState, type FormAnswerValue, type ResultsHiddenReason } from '@/api/studio-responses'
import { useRespondentToken } from '@/composables/useRespondentToken'

/**
 * État partagé par tous les blocs de formulaire (choice/checkboxes/dropdown/scale/rating)
 * en mode public : charge la réponse existante du visiteur au montage, gère la
 * soumission (upsert) et expose l'agrégat pour l'affichage des résultats.
 */
export function useFormBlockResponse(blockId: () => string) {
  const studio = useStudioStore()
  const token = useRespondentToken()

  const loading = ref(true)
  const submitting = ref(false)
  const answered = ref(false)
  const editing = ref(false)
  const myAnswer = ref<FormAnswerValue | null>(null)
  const aggregate = ref<BlockResponseAggregate>({ totalResponses: 0 })
  /** Faux : réponse définitive (sondage « une réponse par compte »). */
  const canChange = ref(true)
  /** Non nul : le serveur masque les résultats (voir `resultsHiddenText`). */
  const resultsHiddenReason = ref<ResultsHiddenReason | null>(null)
  /** Erreur d'envoi lisible (sondage fermé, pas encore ouvert, déjà répondu…). */
  const submitError = ref<string | null>(null)

  function apply(state: BlockResponseState) {
    answered.value = state.answered
    myAnswer.value = state.myAnswer
    aggregate.value = state.aggregate
    canChange.value = state.canChange
    resultsHiddenReason.value = state.resultsHiddenReason
  }

  const resultsHiddenText = computed(() => {
    switch (resultsHiddenReason.value) {
      case 'after_submit': return 'Les résultats s’affichent après votre réponse.'
      case 'at_close': return 'Les résultats seront publiés à la clôture du sondage.'
      case 'never': return 'Les résultats de ce sondage ne sont pas publiés.'
      default: return null
    }
  })

  const slug = computed(() => studio.content?.slug ?? '')

  async function load() {
    if (!slug.value) { loading.value = false; return }
    loading.value = true
    try {
      apply(await fetchBlockResponse(slug.value, blockId(), token.value))
    } catch {
      // Pas de réponse existante ou endpoint indisponible : on reste en mode saisie.
      answered.value = false
    } finally {
      loading.value = false
    }
  }

  async function submit(value: FormAnswerValue) {
    if (!slug.value || submitting.value) return
    submitting.value = true
    submitError.value = null
    try {
      apply(await submitBlockResponse(slug.value, blockId(), { value, respondent_token: token.value }))
      answered.value = true
      editing.value = false
    } catch (e) {
      const errors = (e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data
      submitError.value = errors?.errors?.block_id?.[0] ?? errors?.message ?? 'Votre réponse n’a pas pu être envoyée.'

    } finally {
      submitting.value = false
    }
  }

  function startEditing() {
    if (canChange.value) editing.value = true
  }

  onMounted(load)

  return {
    loading, submitting, answered, editing, myAnswer, aggregate, submit, startEditing,
    canChange, resultsHiddenReason, resultsHiddenText, submitError,
  }
}
