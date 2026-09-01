import { RuntimeConfig as UserRuntimeConfig, PublicRuntimeConfig as UserPublicRuntimeConfig } from 'nuxt/schema'
  interface SharedRuntimeConfig {
   app: {
      buildId: string,

      baseURL: string,

      buildAssetsDir: string,

      cdnURL: string,
   },

   apiBaseUrlServer: string,
  }
  interface SharedPublicRuntimeConfig {
   apiBaseUrl: string,

   adminUrl: string,

   googleClientId: string,

   appEnv: string,

   passwordMiddleware: string,

   comingSoon: string,

   comingSoonBypassCode: string,

   sentryDsn: string,

   turnstileSiteKey: string,

   studioAssistantEnabled: boolean,
  }
declare module '@nuxt/schema' {
  interface RuntimeConfig extends UserRuntimeConfig {}
  interface PublicRuntimeConfig extends UserPublicRuntimeConfig {}
}
declare module 'nuxt/schema' {
  interface RuntimeConfig extends SharedRuntimeConfig {}
  interface PublicRuntimeConfig extends SharedPublicRuntimeConfig {}
}
declare module 'vue' {
        interface ComponentCustomProperties {
          $config: UserRuntimeConfig
        }
      }