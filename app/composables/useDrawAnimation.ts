import { onBeforeUnmount, ref } from 'vue'
import { usePrefsStore } from '@/stores/prefs'

/** Vrai si l'utilisateur a demandé moins d'animations (système ou réglage du site). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  try {
    if (usePrefsStore().reducedMotion) return true
  } catch {
    // Pinia indisponible (tests isolés) → on se rabat sur la media query.
  }
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Anime une progression 0 → 1 sur `duration` ms (requestAnimationFrame).
 * En mouvement réduit (ou côté serveur), saute directement à 1.
 * Un timeout de sécurité garantit l'état final même si rAF est suspendu
 * (onglet en arrière-plan, capture d'écran).
 */
export function useDrawAnimation(initial = 1) {
  const progress = ref(initial)
  let frame = 0
  let guard: ReturnType<typeof setTimeout> | undefined

  function stop() {
    if (frame) cancelAnimationFrame(frame)
    if (guard) clearTimeout(guard)
    frame = 0
    guard = undefined
  }

  function play(duration = 900, onDone?: () => void) {
    stop()
    if (!duration || prefersReducedMotion()) {
      progress.value = 1
      onDone?.()
      return
    }
    progress.value = 0
    let t0: number | null = null
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      stop()
      progress.value = 1
      onDone?.()
    }
    guard = setTimeout(finish, duration + 600)
    const step = (now: number) => {
      if (finished) return
      if (t0 == null) t0 = now
      const t = Math.min(1, (now - t0) / duration)
      progress.value = t
      if (t < 1) frame = requestAnimationFrame(step)
      else finish()
    }
    frame = requestAnimationFrame(step)
  }

  onBeforeUnmount(stop)

  return { progress, play, stop }
}
