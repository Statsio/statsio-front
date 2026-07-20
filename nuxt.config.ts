import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },

  devtools: { enabled: true },

  ssr: true,

  app: {
    head: {
      script: [
        {
          // Google Consent Mode v2 — defaults AVANT GTM (obligatoire)
          innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'denied',wait_for_update:500});`,
        },
        {
          innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5J28CWLR');`,
        },
      ],
      noscript: [
        {
          tagPosition: 'bodyClose',
          innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5J28CWLR" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
        },
      ],
    },
  },

  nitro: {
    preset: 'cloudflare_module',
    alias: {
      // axios importe https-proxy-agent (→ agent-base → debug) de façon statique dans son
      // adaptateur HTTP Node ; cette chaîne casse à l'exécution sur Workers (voir le stub).
      'https-proxy-agent': fileURLToPath(new URL('./server/stubs/https-proxy-agent.mjs', import.meta.url)),
    },
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

  routeRules: {
    '/profile': { redirect: '/user' },
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
