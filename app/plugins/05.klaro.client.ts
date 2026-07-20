import { klaroConfig } from '@/lib/klaro'
import type { KlaroManager } from '@/lib/klaro'

// @ts-expect-error klaro ne fournit aucune déclaration de type et allowJs empêche toute augmentation de module pour son fichier réel — cf. app/lib/klaro.ts pour les types applicables une fois importé.
import * as klaroNoCss from 'klaro/dist/klaro-no-css.js'

const { getManager } = klaroNoCss as unknown as {
  setup: (config?: Record<string, unknown>) => void
  getManager: (config?: Record<string, unknown>) => KlaroManager
  show: (config?: Record<string, unknown>, modal?: boolean) => void
}

export default defineNuxtPlugin((nuxtApp) => {
  const manager = getManager(klaroConfig)

  if (manager.confirmed) {
    manager.saveAndApplyConsents()
    // Rétablit les signaux GCM v2 pour les utilisateurs ayant déjà consenti
    const w = window as typeof window & { gtag?: (...args: unknown[]) => void }
    if (w.gtag) {
      w.gtag('consent', 'update', {
        analytics_storage: manager.consents['google-analytics'] ? 'granted' : 'denied',
        functionality_storage: manager.consents['youtube'] ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      })
    }
  }

  nuxtApp.provide('klaroManager', manager)
})
