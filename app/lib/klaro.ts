export interface KlaroService {
  name: string
  title: string
  description?: string
  purposes: string[]
  default?: boolean
  required?: boolean
}

export interface KlaroManager {
  confirmed: boolean
  consents: Record<string, boolean>
  changeAll(value: boolean): void
  updateConsent(name: string, value: boolean): void
  saveAndApplyConsents(): void
  loadConsents(): void
}

export const klaroConfig = {
  version: 1,
  storageMethod: 'cookie',
  cookieName: 'klaro',
  cookieExpiresAfterDays: 365,
  services: [
    // ── Statistiques ──────────────────────────────────────────────────────────
    {
      name: 'google-tag-manager',
      title: 'Google Tag Manager',
      description: "Mesure d'audience et suivi des interactions utilisateurs (pages vues, clics, parcours).",
      purposes: ['analytics'],
      default: false,
      required: false,
    },

    // ── Vidéos ────────────────────────────────────────────────────────────────
    {
      name: 'youtube',
      title: 'YouTube',
      description: 'Lecture de vidéos intégrées depuis YouTube. Active des cookies publicitaires et de suivi Google.',
      purposes: ['videos'],
      default: false,
      required: false,
    },
    {
      name: 'vimeo',
      title: 'Vimeo',
      description: 'Lecture de vidéos intégrées depuis Vimeo.',
      purposes: ['videos'],
      default: false,
      required: false,
    },
    {
      name: 'dailymotion',
      title: 'Dailymotion',
      description: 'Lecture de vidéos intégrées depuis Dailymotion.',
      purposes: ['videos'],
      default: false,
      required: false,
    },

    // ── Fonctionnel ───────────────────────────────────────────────────────────
    {
      name: 'google-fonts',
      title: 'Google Fonts',
      description: 'Chargement des polices (Manrope, Atkinson, JetBrains Mono) depuis les serveurs Google. Nécessaire au bon affichage du site.',
      purposes: ['functional'],
      default: true,
      required: true,
    },

    // ── Sécurité ──────────────────────────────────────────────────────────────
    {
      name: 'cloudflare-turnstile',
      title: 'Cloudflare Turnstile',
      description: 'Protection anti-bot des formulaires. Aucun cookie publicitaire. Activé au titre de l\'intérêt légitime de sécurité.',
      purposes: ['security'],
      default: true,
      required: true,
    },
  ] as KlaroService[],
}

export const purposeMeta: Record<string, { label: string; description: string }> = {
  analytics: {
    label: 'Statistiques',
    description: "Nous aide à comprendre comment vous utilisez Statsio.",
  },
  videos: {
    label: 'Vidéos',
    description: 'Lecture de vidéos intégrées depuis des plateformes tierces.',
  },
  functional: {
    label: 'Fonctionnel',
    description: 'Services qui améliorent la qualité de votre expérience.',
  },
  security: {
    label: 'Sécurité',
    description: 'Services essentiels à la protection du site et de ses utilisateurs.',
  },
}
