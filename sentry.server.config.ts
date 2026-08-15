import * as Sentry from '@sentry/nuxt'

// useRuntimeConfig() ne fonctionne pas dans ce fichier : il est chargé avant l'initialisation de
// Nuxt (cf. doc officielle @sentry/nuxt). Contrairement à sentry.client.config.ts, il faut lire
// la variable d'environnement directement.
const dsn = process.env.NUXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NUXT_PUBLIC_APP_ENV ?? 'development',
    tracesSampleRate: 0.1,
  })
}
