import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Cible de recherche « en page » (ex. la grande recherche du hero de l'accueil).
 *
 * Quand une page en enregistre une, le raccourci `/` et le bouton de recherche
 * du header y envoient le focus au lieu d'ouvrir la modale globale ; et le
 * bouton du header ne s'affiche qu'une fois cette recherche sortie de l'écran.
 * État module (client) : une seule cible à la fois, jamais sérialisé en SSR.
 */
type SearchTarget = {
  focus: () => void
}

const target = ref<SearchTarget | null>(null)
const targetVisible = ref(false)

export function useSearchTarget() {
  return {
    /** une page a enregistré sa propre recherche */
    target,
    /** la recherche en page est actuellement visible à l'écran */
    targetVisible,
    focusTarget(): boolean {
      if (!target.value) return false
      target.value.focus()
      return true
    },
  }
}

/** À appeler depuis le composant qui porte la recherche en page. */
export function useRegisterSearchTarget(el: Ref<Element | null | undefined>, focus: () => void) {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    target.value = { focus }
    targetVisible.value = true
    if (el.value && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver((entries) => {
        targetVisible.value = entries.some((e) => e.isIntersecting)
      })
      observer.observe(el.value)
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    target.value = null
    targetVisible.value = false
  })
}
