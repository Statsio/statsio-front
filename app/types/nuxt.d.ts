import type { KlaroManager } from '../lib/klaro'

declare module '#app' {
  interface PageMeta {
    title?: string
    description?: string
    ogImage?: string
    ogType?: string
    robots?: string
  }
  interface NuxtApp {
    $klaroManager: KlaroManager
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    ogImage?: string
    ogType?: string
    robots?: string
  }
}

export {}
