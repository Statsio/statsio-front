import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { AppNotificationItem, PushAppNotificationInput } from '@/types/app-notification'

const MAX_VISIBLE = 6

const defaultDurationFor = (variant: PushAppNotificationInput['variant']) =>
  variant === 'error' ? 8_000 : 5_500

export const useAppNotificationsStore = defineStore('app-notifications', () => {
  const items = ref<AppNotificationItem[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  const clearTimer = (id: string) => {
    const handle = timers.get(id)
    if (handle !== undefined) {
      clearTimeout(handle)
      timers.delete(id)
    }
  }

  const dismiss = (id: string) => {
    clearTimer(id)
    const index = items.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    for (const id of timers.keys()) {
      clearTimer(id)
    }
    items.value = []
  }

  const push = (input: PushAppNotificationInput): string => {
    while (items.value.length >= MAX_VISIBLE) {
      dismiss(items.value[0]!.id)
    }

    const id = crypto.randomUUID()
    const duration = input.duration ?? defaultDurationFor(input.variant)
    const item: AppNotificationItem = {
      id,
      variant: input.variant,
      title: input.title,
      message: input.message,
      createdAt: Date.now(),
      duration,
    }

    items.value.push(item)

    if (duration > 0) {
      timers.set(
        id,
        setTimeout(() => {
          dismiss(id)
        }, duration),
      )
    }

    return id
  }

  return {
    items,
    push,
    dismiss,
    clearAll,
  }
})
