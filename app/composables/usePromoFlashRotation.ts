import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { PromoCategory, PromoCategoryInfo } from '@/types/promo-category'

export type PromoFlashPhase = 'ticker' | 'flash'

/**
 * Machine à états du bandeau promo : alterne entre le ticker classique des
 * contenus et le "flash" d'une catégorie de promotion (titre fixe, infos qui
 * défilent une à une), en boucle round-robin sur les catégories actives.
 * Timers client-only — le rendu initial (SSR + hydratation) reste en phase
 * `ticker`, comportement inchangé du bandeau actuel.
 *
 * Exception : une catégorie `always_visible` (« toujours affichée ») prend le
 * pas sur tout le reste — le bandeau reste en flash sur cette seule catégorie
 * en permanence, ses infos continuant de défiler en boucle ; le ticker et les
 * autres catégories ne sont alors jamais montrés. S'il y en a plusieurs, la
 * première (par position) l'emporte.
 */
export function usePromoFlashRotation(categories: Ref<PromoCategory[]>) {
  const phase = ref<PromoFlashPhase>('ticker')
  const categoryIndex = ref(0)
  const infoIndex = ref(0)
  let timer: ReturnType<typeof setTimeout> | null = null

  const pinnedCategory = computed<PromoCategory | null>(
    () => categories.value.find((category) => category.always_visible) ?? null,
  )

  const currentCategory = computed<PromoCategory | null>(() => {
    if (pinnedCategory.value) return pinnedCategory.value
    const cats = categories.value
    if (!cats.length) return null
    return cats[categoryIndex.value % cats.length] ?? null
  })

  const currentInfo = computed<PromoCategoryInfo | null>(() => {
    if (phase.value !== 'flash') return null
    const infos = currentCategory.value?.infos ?? []
    return infos[infoIndex.value] ?? null
  })

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function scheduleNext() {
    clearTimer()

    const pinned = pinnedCategory.value
    if (pinned) {
      phase.value = 'flash'
      const infoCount = pinned.infos?.length ?? 0
      if (infoCount === 0) return
      timer = setTimeout(() => {
        infoIndex.value = (infoIndex.value + 1) % infoCount
        scheduleNext()
      }, Math.max(1, pinned.info_duration_seconds) * 1000)
      return
    }

    const cats = categories.value
    if (!cats.length) {
      phase.value = 'ticker'
      return
    }

    const category = cats[categoryIndex.value % cats.length]
    if (!category) return

    if (phase.value === 'ticker') {
      timer = setTimeout(() => {
        phase.value = 'flash'
        infoIndex.value = 0
        scheduleNext()
      }, Math.max(1, category.ticker_duration_seconds) * 1000)
      return
    }

    const infoCount = category.infos?.length ?? 0
    timer = setTimeout(() => {
      if (infoIndex.value + 1 < infoCount) {
        infoIndex.value += 1
        scheduleNext()
      } else {
        phase.value = 'ticker'
        categoryIndex.value = (categoryIndex.value + 1) % cats.length
        scheduleNext()
      }
    }, Math.max(1, category.info_duration_seconds) * 1000)
  }

  if (import.meta.client) {
    watch(
      categories,
      (cats) => {
        clearTimer()
        categoryIndex.value = 0
        infoIndex.value = 0
        phase.value = pinnedCategory.value ? 'flash' : 'ticker'
        if (cats.length) scheduleNext()
      },
      { immediate: true },
    )
  }

  onBeforeUnmount(clearTimer)

  return { phase, currentCategory, currentInfo }
}
