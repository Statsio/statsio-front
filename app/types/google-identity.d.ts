interface GoogleCredentialResponse {
  credential?: string
  select_by?: string
}

interface GoogleAccountsIdConfiguration {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void | Promise<void>
  ux_mode?: 'popup' | 'redirect'
  auto_select?: boolean
  itp_support?: boolean
}

interface GoogleAccountsButtonConfiguration {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleAccountsIdConfiguration) => void
        renderButton: (parent: HTMLElement, options: GoogleAccountsButtonConfiguration) => void
        disableAutoSelect: () => void
      }
    }
  }
}
