import * as Sentry from '@sentry/nuxt'

// N'initialise Sentry que si un DSN est configuré : pas d'activation par défaut en
// développement local ou si le secret n'a pas encore été renseigné côté déploiement.
const config = useRuntimeConfig()
const dsn = config.public.sentryDsn

if (dsn) {
  Sentry.init({
    dsn,
    environment: config.public.appEnv,
    tracesSampleRate: 0.1,
  })
}
