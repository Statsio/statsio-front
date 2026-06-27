declare module '#app' {
  interface PageMeta {
    title?: string
    description?: string
    ogImage?: string
    ogType?: string
    robots?: string
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
