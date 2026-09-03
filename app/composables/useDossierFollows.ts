import { computed } from 'vue'
import { useStorage } from '@vueuse/core'

/**
 * Suivi de dossiers côté navigateur (localStorage). Il n'existe pas encore de
 * persistance serveur pour « suivre un dossier » : on mémorise localement les
 * slugs suivis pour garder l'UI des maquettes cohérente entre visites.
 */
export function useDossierFollows() {
  const followed = useStorage<string[]>('statsio:dossier-follows', [])

  function isFollowing(slug: string) {
    return followed.value.includes(slug)
  }

  function toggle(slug: string) {
    followed.value = isFollowing(slug)
      ? followed.value.filter((s) => s !== slug)
      : [...followed.value, slug]
  }

  const count = computed(() => followed.value.length)

  return { followed, isFollowing, toggle, count }
}
