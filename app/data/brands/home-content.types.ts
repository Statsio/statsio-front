/**
 * Contenu éditorial des pages d'accueil « v2 » (maquette Accueil v2).
 * Une seule forme partagée par Statsio / TVStats / Medistats — chaque marque
 * fournit son propre objet dans `app/data/brands/<marque>/home-v2.ts`.
 * Les carrousels (Articles / StatsData / Sondages / Chaînes) sont alimentés par
 * l'API et filtrés par domaine ; ce fichier ne porte que les textes marketing.
 */

export type HomeHeroStat = { label: string; value: string }

/** Fragment de titre du hero — `color` optionnel pour la mise en couleur (hex de marque). */
export type HomeHeadlinePart = { text: string; color?: string }

export type HomeStep = {
  num: string
  icon: string
  /** Fond de la pastille d'icône (hex). */
  iconBg: string
  /** Couleur de l'icône (hex). */
  iconFg: string
  title: string
  desc: string
}

export type HomeFaqItem = { q: string; a: string }

export type HomeV2Content = {
  heroBadge: string
  heroFlash: string
  heroHeadline: HomeHeadlinePart[]
  heroSubtitle: string
  heroCtaPrimary: string
  heroCtaSecondary: string
  heroStats: HomeHeroStat[]

  /** Titres des trois carrousels de catalogue. */
  carousels: {
    articles: { eyebrow: string; title: string; allLabel: string }
    statsdata: { eyebrow: string; title: string; allLabel: string }
    sondages: { eyebrow: string; title: string; allLabel: string }
  }

  channelsTitle: string

  stepsEyebrow: string
  stepsTitle: string
  stepsDesc: string
  stepsCta: string
  steps: HomeStep[]

  faqEyebrow: string
  faqTitle: string
  faqs: HomeFaqItem[]

  cta: {
    headline: string
    subtitle: string
    primary: string
    secondary: string
  }
}
