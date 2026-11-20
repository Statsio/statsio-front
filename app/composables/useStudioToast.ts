import { readonly, ref } from 'vue'

export interface StudioToast {
  id: number
  message: string
  actionLabel?: string
  action?: () => void
}

const current = ref<StudioToast | null>(null)
let seq = 0
let timer: ReturnType<typeof setTimeout> | null = null

/**
 * Toast unique du Studio (« Bloc ajouté », « Bloc supprimé · Annuler »…).
 * Un nouveau toast remplace le précédent ; disparaît après 2,4 s (5 s avec action).
 */
export function useStudioToast() {
  function dismiss() {
    if (timer) clearTimeout(timer)
    timer = null
    current.value = null
  }

  function show(message: string, actionLabel?: string, action?: () => void) {
    if (timer) clearTimeout(timer)
    current.value = { id: ++seq, message, actionLabel, action }
    timer = setTimeout(dismiss, action ? 5000 : 2400)
  }

  function runAction() {
    const fn = current.value?.action
    dismiss()
    fn?.()
  }

  return { toast: readonly(current), show, dismiss, runAction }
}
