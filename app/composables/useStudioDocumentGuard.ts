import { watch } from 'vue'
import { useStudioStore } from '@/stores/studio'

/**
 * Sort du Studio dès que le document n'existe plus / n'est plus accessible :
 * - à l'ouverture, si `fetchStatsDataDocument` a échoué (appeler `fail()` dans le catch) ;
 * - en cours d'édition, si l'autosave prend un 404/403 (via `studio.saveErrorStatus`).
 * Bascule sur l'écran d'erreur Nuxt plutôt que de laisser un Studio fantôme.
 */
export function useStudioDocumentGuard() {
  const studio = useStudioStore()

  function fail(status: number) {
    showError(
      createError({
        statusCode: status === 403 ? 403 : status === 404 ? 404 : 500,
        statusMessage:
          status === 404
            ? "Ce StatsData n'existe plus ou a été supprimé."
            : status === 403
              ? "Vous n'avez pas accès à ce StatsData."
              : 'Impossible de charger ce StatsData.',
        fatal: true,
      }),
    )
  }

  watch(
    () => studio.saveErrorStatus,
    (status) => {
      if (status === 404 || status === 403) fail(status)
    },
  )

  return { fail }
}
