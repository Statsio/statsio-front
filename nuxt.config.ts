import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },

  devtools: { enabled: true },

  ssr: true,

  app: {
    head: {
      htmlAttrs: {
        lang: 'fr',
      },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      meta: [
        { name: 'apple-mobile-web-app-title', content: 'Statsio' },
      ],
      script: [
        {
          // Google Consent Mode v2 — defaults AVANT GTM (obligatoire).
          // region: refus strict limité à l'EEE + UK + CH (zones où le consentement est
          // légalement requis) pour ne pas bloquer analytics_storage pour le reste du monde,
          // où Google applique 'granted' par défaut en l'absence de commande 'default' ciblée.
          innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'denied',wait_for_update:500,region:['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH']});`,
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

  modules: ['@pinia/nuxt', '@sentry/nuxt/module'],

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
    // Utilisée uniquement côté serveur (SSR) : dans Docker, le conteneur front ne peut pas
    // atteindre l'API via "localhost" (c'est son propre localhost, pas celui de l'hôte).
    apiBaseUrlServer: process.env.NUXT_API_BASE_URL_SERVER ?? process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api',
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api',
      // Back-office admin : panneau Filament servi par l'API Laravel (routes web /admin).
      adminUrl: process.env.NUXT_PUBLIC_ADMIN_URL ?? 'http://localhost:8090/admin',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV ?? 'development',
      passwordMiddleware: process.env.NUXT_PUBLIC_PASSWORD_MIDDLEWARE ?? '',
      comingSoon: process.env.NUXT_PUBLIC_COMING_SOON ?? 'false',
      comingSoonBypassCode: process.env.NUXT_PUBLIC_COMING_SOON_BYPASS_CODE ?? '',
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN ?? '',
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY ?? '0x4AAAAAADreXCM3U-LKGq0q',
      // Assistant IA du Studio — masqué tant que non activé (backend + clé requis).
      // Clé alignée sur le nom de la variable → Nuxt applique aussi l'override runtime
      // NUXT_PUBLIC_STUDIO_ASSISTANT_ENABLED même si la lecture ci-dessous a lieu trop tôt.
      studioAssistantEnabled: process.env.NUXT_PUBLIC_STUDIO_ASSISTANT_ENABLED === 'true',
    },
  },

  // DSN volontairement absent ici : Sentry n'est initialisé que si NUXT_PUBLIC_SENTRY_DSN est
  // défini (cf. sentry.client.config.ts / sentry.server.config.ts), pour ne rien activer par
  // défaut en développement local sans configuration.
  sentry: {
    autoInjectServerSentry: 'top-level-import',
  },

  sourcemap: { client: 'hidden' },

  imports: {
    dirs: ['stores', 'composables', 'api'],
  },

  routeRules: {
    '/profile': { redirect: '/user' },
    // Espace compte v2 : onglets consolidés en routes imbriquées sous /user.
    '/contenus': { redirect: '/user/contenus' },
    '/mes-chaines': { redirect: '/user/chaines' },
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
