import type { ComputedRef, MaybeRef } from "vue";
import type { ComponentProps } from "../../node_modules/vue-component-type-helpers/index.js";

declare module 'nuxt/app' {
  interface NuxtLayouts {
    account: ComponentProps<typeof import("/app/app/layouts/account.vue").default>
    "channel-dashboard": ComponentProps<typeof import("/app/app/layouts/channel-dashboard.vue").default>
    "content-dashboard": ComponentProps<typeof import("/app/app/layouts/content-dashboard.vue").default>
    default: ComponentProps<typeof import("/app/app/layouts/default.vue").default>
    embed: ComponentProps<typeof import("/app/app/layouts/embed.vue").default>
    studio: ComponentProps<typeof import("/app/app/layouts/studio.vue").default>
  }
  export type LayoutKey = keyof NuxtLayouts extends never ? string : keyof NuxtLayouts
  interface PageMeta {
    layout?: MaybeRef<LayoutKey | false> | ComputedRef<LayoutKey | false> | {
      [K in LayoutKey]: {
        name?: MaybeRef<K | false> | ComputedRef<K | false>
        props?: NuxtLayouts[K]
      }
    }[LayoutKey]
  }
}