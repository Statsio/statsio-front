import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },

  devtools: { enabled: true },

  ssr: true,

  nitro: {
    preset: 'cloudflare_module',
  },

  modules: ['@pinia/nuxt'],

  css: [
    '~/assets/main.css',
    '~/assets/theme.scss',
    '~/assets/accessibility.css',
  ],

  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: true,
        interval: 300,
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://localhost:8080/api',
      googleClientId: '',
    },
  },

  imports: {
    dirs: ['stores', 'composables', 'api'],
  },

  components: [
    // Exclude brand-specific nav components from auto-import (they share the name AppHeaderNav)
    // AppHeader.vue imports them explicitly with aliased names.
    { path: '~/components', pathPrefix: false, ignore: ['**/brands/**'] },
  ],

  alias: {
    '@': fileURLToPath(new URL('./app', import.meta.url)),
  },

  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: true,
      },
    },
  },
})
