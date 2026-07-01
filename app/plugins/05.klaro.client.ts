import { getManager } from 'klaro/dist/klaro-no-css.js'
import { klaroConfig } from '@/lib/klaro'

export default defineNuxtPlugin((nuxtApp) => {
  const manager = getManager(klaroConfig)

  if (manager.confirmed) {
    manager.saveAndApplyConsents()
    // Rétablit les signaux GCM v2 pour les utilisateurs ayant déjà consenti
    const w = window as typeof window & { gtag?: (...args: unknown[]) => void }
    if (w.gtag) {
      w.gtag('consent', 'update', {
        analytics_storage: manager.consents['google-tag-manager'] ? 'granted' : 'denied',
        functionality_storage: manager.consents['youtube'] ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      })
    }
  }

  nuxtApp.provide('klaroManager', manager)
})
