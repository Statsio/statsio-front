import { ref } from 'vue'

export type GlobalStatusVariant = 'info' | 'error' | 'success' | 'warning'

type GlobalStatusInput = {
  variant: GlobalStatusVariant
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void | Promise<void>
  }
}

// Generic, reusable global status bar state
export const globalStatus = ref<{
  variant: GlobalStatusVariant
  title?: string
  message: string
  visible: boolean
  action?: {
    label: string
    onClick: () => void | Promise<void>
  }
} | null>(null)

let _statusTimer: ReturnType<typeof setTimeout> | null = null

export function showGlobalStatus(input: GlobalStatusInput) {
  const duration = input.duration ?? 5500
  globalStatus.value = {
    variant: input.variant,
    title: input.title,
    message: input.message,
    visible: true,
    action: input.action,
  }

  // If duration <= 0, keep visible until explicitly hidden
  if (_statusTimer) {
    clearTimeout(_statusTimer)
  }
  if (duration > 0) {
    _statusTimer = setTimeout(() => {
      if (globalStatus.value) globalStatus.value.visible = false
    }, duration)
  } else {
    _statusTimer = null
  }
}

export function hideGlobalStatus() {
  if (globalStatus.value) globalStatus.value.visible = false
  if (_statusTimer) {
    clearTimeout(_statusTimer)
    _statusTimer = null
  }
}
