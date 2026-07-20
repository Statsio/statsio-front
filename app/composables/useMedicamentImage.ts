import { readonly, ref, watch, type Ref } from 'vue'
import { fetchMedicamentImage } from '@/api/medicaments'

/** null tant qu'aucune image Wikipédia n'a été trouvée (ou trouvable) — le composant appelant
 * doit afficher une icône générique par forme pharmaceutique dans ce cas. */
export function useMedicamentImage(nom: Ref<string | null | undefined>) {
  const url = ref<string | null>(null)

  async function load() {
    url.value = null
    const name = nom.value
    if (!name) return
    try {
      url.value = await fetchMedicamentImage(name)
    } catch {
      url.value = null
    }
  }

  watch(nom, load, { immediate: true })

  return { url: readonly(url) }
}
