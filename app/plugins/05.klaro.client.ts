import { getManager } from 'klaro/dist/klaro-no-css.js'
import { klaroConfig } from '@/lib/klaro'

export default defineNuxtPlugin((nuxtApp) => {
  const manager = getManager(klaroConfig)
  // Re-applique les consentements déjà stockés (ex: active GTM si déjà accepté)
  if (manager.confirmed) {
    manager.saveAndApplyConsents()
  }
  nuxtApp.provide('klaroManager', manager)
})
