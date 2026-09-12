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
        // Seule cette entrée SVG pilote le favicon (cf. useFavicon.ts, même `key`).
        // Ne pas ajouter de <link rel="icon"> PNG/ICO statique en plus : les navigateurs
        // (Chrome notamment) les préfèrent au SVG, ce qui masquait le favicon par
        // sous-marque sur /tvstats et /medistats en réaffichant celui de Statsio.
        { key: 'icon-svg', rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
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
    // maplibre-gl charge un web worker en ESM que le pré-bundler Vite casse
    // (« maplibre-gl-worker.mjs … does not exist ») → on le sort de l'optimizer.
    optimizeDeps: {
      exclude: ['maplibre-gl'],
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
    // Studio : strictement client-only. `definePageMeta({ ssr: false })` ne suffit pas sur
    // le preset Cloudflare (le Worker rend quand même la route → 500) ; ces règles forcent
    // le fallback SPA statique pour que le Worker ne rende jamais le studio en SSR.
    '/studio': { ssr: false },
    '/studio/**': { ssr: false },
    '/tvstats/studio': { ssr: false },
    '/tvstats/studio/**': { ssr: false },
    // Cloudflare injecte `X-Frame-Options: SAMEORIGIN` en périphérie (absent du code de
    // l'app) ce qui bloque l'intégration <iframe> de /embed/** sur des sites tiers. La CSP
    // frame-ancestors prévaut sur X-Frame-Options côté navigateur : on l'ouvre explicitement
    // pour ces routes, pensées pour être embarquées n'importe où.
    '/embed/**': { headers: { 'content-security-policy': 'frame-ancestors *' } },
  },

  components: [
    // Exclude brand-specific nav components from auto-import (they share the name AppHeaderNav)
    // AppHeader.vue imports them explicitly with aliased names.
    { path: '~/components', pathPrefix: false, ignore: ['**/brands/**'] },
  ],

  alias: {
    '@': fileURLToPath(new URL('./app', import.meta.url)),
    // Utilitaires de test uniquement (mocks) — jamais importés par du code applicatif,
    // déclaré ici pour que `nuxt typecheck` résolve `#test/*` comme vitest.config.ts.
    '#test': fileURLToPath(new URL('./test', import.meta.url)),
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
