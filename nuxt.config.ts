import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },

  devtools: { enabled: true },

  ssr: true,

  app: {
    head: {
      script: [
        // Chargé en synchrone avant Klaro pour que les traductions FR soient disponibles
        { src: '/klaro-config.js' },
        {
          src: 'https://api.kiprotect.com/v1/privacy-managers/318f49b2787f2e172489c52c11662e61/klaro.js',
          async: true,
        },
      ],
    },
  },

  nitro: {
    preset: 'cloudflare_module',
  },

  modules: ['@pinia/nuxt'],

  css: [
    '~/assets/main.css',
    '~/assets/theme.scss',
    '~/assets/accessibility.css',
    '~/assets/klaro.css',
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
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV ?? 'development',
      passwordMiddleware: process.env.NUXT_PUBLIC_PASSWORD_MIDDLEWARE ?? '',
      comingSoon: process.env.NUXT_PUBLIC_COMING_SOON ?? 'false',
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
