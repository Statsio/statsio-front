export type AppNotificationVariant = 'success' | 'error' | 'warning' | 'info'

export type AppNotificationItem = {
  id: string
  variant: AppNotificationVariant
  title?: string
  message: string
  createdAt: number
  /** Durée avant fermeture automatique (ms). 0 = pas de fermeture auto. */
  duration: number
}

export type PushAppNotificationInput = {
  variant: AppNotificationVariant
  title?: string
  message: string
  /** Par défaut : erreurs 8s, autres 5,5s. 0 = persistant jusqu’à fermeture manuelle. */
  duration?: number
}
