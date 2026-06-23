import { useAppNotificationsStore } from '@/stores/app-notifications'
import type { PushAppNotificationInput } from '@/types/app-notification'

export function useAppNotifications() {
  const store = useAppNotificationsStore()

  const notify = (input: PushAppNotificationInput) => store.push(input)

  const success = (message: string, title?: string) =>
    store.push({ variant: 'success', message, ...(title !== undefined ? { title } : {}) })

  const error = (message: string, title?: string) =>
    store.push({ variant: 'error', message, ...(title !== undefined ? { title } : {}) })

  const warning = (message: string, title?: string) =>
    store.push({ variant: 'warning', message, ...(title !== undefined ? { title } : {}) })

  const info = (message: string, title?: string) =>
    store.push({ variant: 'info', message, ...(title !== undefined ? { title } : {}) })

  return {
    items: store.items,
    notify,
    success,
    error,
    warning,
    info,
    dismiss: store.dismiss,
    clearAll: store.clearAll,
  }
}
