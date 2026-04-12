/// <reference types="vite/client" />

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    studio?: boolean
    studioDocumentKind?: 'statsdata' | 'article'
  }
}

declare module 'vuedraggable' {
  const Draggable: import('vue').DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default Draggable
}

interface ImportMetaEnv {
  readonly VITE_AUTH_API_BASE_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string; select_by?: string }) => void | Promise<void>
            ux_mode?: 'popup' | 'redirect'
            auto_select?: boolean
            itp_support?: boolean
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              logo_alignment?: 'left' | 'center'
              width?: number
            },
          ) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}
