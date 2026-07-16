import { ref, computed, onMounted } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { fetchBlockResponse, submitBlockResponse, type BlockResponseAggregate, type FormAnswerValue } from '@/api/studio-responses'
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

  const slug = computed(() => studio.content?.slug ?? '')

  async function load() {
    if (!slug.value) { loading.value = false; return }
    loading.value = true
    try {
      const state = await fetchBlockResponse(slug.value, blockId(), token.value)
      answered.value = state.answered
      myAnswer.value = state.myAnswer
      aggregate.value = state.aggregate
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
    try {
      const state = await submitBlockResponse(slug.value, blockId(), { value, respondent_token: token.value })
      answered.value = true
      editing.value = false
      myAnswer.value = state.myAnswer
      aggregate.value = state.aggregate
    } finally {
      submitting.value = false
    }
  }

  function startEditing() {
    editing.value = true
  }

  onMounted(load)

  return { loading, submitting, answered, editing, myAnswer, aggregate, submit, startEditing }
}
