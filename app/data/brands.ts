import statsioLogo from '@/assets/brand/statsio-logo.svg'
import tvstatsLogo from '@/assets/brand/tvstats/tvstats-logo.svg'
import medistatsLogo from '@/assets/brand/medistats/medistats-logo.svg'

export type BrandId = 'statsio' | 'tvstats' | 'medistats'

export type BrandMenuItem = {
  id: BrandId
  to: string
  name: string
  logo: string
  eyebrow: string
  description: string
  accentClass: string
}

export type FooterNavItem = {
  label: string
  href: string
}

export type BrandConfig = {
  id: BrandId
  to: string
  name: string
  logo: string
  logoAlt: string
  wordmarkClass: string
  prefix: string
  suffix: string
  suffixClass: string
  switchMenu: BrandMenuItem[]
  footerTagline: string
  footerNav: FooterNavItem[]
  /** Préfixe des routes de contenu partagé (articles/statsdata/sondages) pour cette marque. */
  contentBasePath: string
  /** Catégories de contenu affichées pour cette marque. `undefined` = pas de filtre (statsio). */
  contentCategories?: string[]
  /** URL du compte X (Twitter) de la marque. `#` = pas encore de compte dédié. */
  xUrl: string
}

const brandConfigs: Record<BrandId, BrandConfig> = {
  statsio: {
    id: 'statsio',
    to: '/',
    name: 'Statsio',
    logo: statsioLogo,
    logoAlt: 'Statsio',
    wordmarkClass: 'text-primary',
    prefix: 'Stats',
    suffix: 'io',
    suffixClass: 'text-accent',
    switchMenu: [
      {
        id: 'tvstats',
        to: '/tvstats',
        name: 'TVSTATS',
        logo: tvstatsLogo,
        eyebrow: 'Audiences TV',
        description: 'Programmes, grilles et audiences TV en temps réel.',
        accentClass: 'bg-emerald-50 border-emerald-100',
      },
      {
        id: 'medistats',
        to: '/medistats',
        name: 'MEDISTATS',
        logo: medistatsLogo,
        eyebrow: 'Médias & Presse',
        description: 'Audiences presse, radio et digital consolidées.',
        accentClass: 'bg-rose-50 border-rose-100',
      },
    ],
    footerTagline: 'La plateforme française qui transforme les statistiques en histoires et en décisions.',
    footerNav: [
      { label: 'Articles', href: '/articles' },
      { label: 'StatsData', href: '/statsdata' },
      { label: 'Sondages', href: '/sondages' },
      { label: 'Chaînes', href: '/chaines' },
    ],
    contentBasePath: '',
    xUrl: 'https://x.com/StatsIO_france',
  },
  tvstats: {
    id: 'tvstats',
    to: '/tvstats',
    name: 'TVSTATS',
    logo: tvstatsLogo,
    logoAlt: 'TVSTATS',
    wordmarkClass: 'text-tvstats-primary',
    prefix: 'TV',
    suffix: 'STATS',
    suffixClass: 'text-tvstats-secondary',
    switchMenu: [
      {
        id: 'statsio',
        to: '/',
        name: 'STATSIO',
        logo: statsioLogo,
        eyebrow: 'Plateforme data',
        description: 'Articles, datasets et sondages enrichis par la data.',
        accentClass: 'bg-violet-50 border-violet-100',
      },
      {
        id: 'medistats',
        to: '/medistats',
        name: 'MEDISTATS',
        logo: medistatsLogo,
        eyebrow: 'Médias & Presse',
        description: 'Audiences presse, radio et digital consolidées.',
        accentClass: 'bg-rose-50 border-rose-100',
      },
    ],
    footerTagline: 'Audiences, programmes et grilles TV décryptés par la donnée, en temps réel.',
    footerNav: [
      { label: 'Actus', href: '/tvstats/articles' },
      { label: 'Audiences', href: '/tvstats/audiences' },
      { label: 'Programme TV', href: '/tvstats/programme-tv' },
      { label: 'StatsData', href: '/tvstats/statsdata' },
      { label: 'Sondages', href: '/tvstats/sondages' },
      { label: 'Chaînes', href: '/chaines' },
    ],
    contentBasePath: '/tvstats',
    contentCategories: ['tv', 'people'],
    xUrl: 'https://x.com/tvstats_statsio',
  },
  medistats: {
    id: 'medistats',
    to: '/medistats',
    name: 'MEDISTATS',
    logo: medistatsLogo,
    logoAlt: 'MEDISTATS',
    wordmarkClass: 'text-medistats-primary',
    prefix: 'Medi',
    suffix: 'STATS',
    suffixClass: 'text-medistats-secondary',
    switchMenu: [
      {
        id: 'statsio',
        to: '/',
        name: 'STATSIO',
        logo: statsioLogo,
        eyebrow: 'Plateforme data',
        description: 'Articles, datasets et sondages enrichis par la data.',
        accentClass: 'bg-violet-50 border-violet-100',
      },
      {
        id: 'tvstats',
        to: '/tvstats',
        name: 'TVSTATS',
        logo: tvstatsLogo,
        eyebrow: 'Audiences TV',
        description: 'Programmes, grilles et audiences TV en temps réel.',
        accentClass: 'bg-emerald-50 border-emerald-100',
      },
    ],
    footerTagline: 'Maladies, médicaments et offre de soins décryptés par la donnée.',
    footerNav: [
      { label: 'Maladies', href: '/medistats/maladies' },
      { label: 'Médicaments', href: '/medistats/medicaments' },
      { label: 'Soins', href: '/medistats/soins' },
      { label: 'Articles', href: '/medistats/articles' },
      { label: 'StatsData', href: '/medistats/statsdata' },
      { label: 'Sondages', href: '/medistats/sondages' },
      { label: 'Chaînes', href: '/chaines' },
    ],
    contentBasePath: '/medistats',
    contentCategories: ['sante'],
    xUrl: '#',
  },
}

export const getBrandConfig = (brandId: BrandId) => brandConfigs[brandId]

export const getBrandFromPath = (path: string): BrandConfig => {
  if (path.startsWith('/tvstats')) return brandConfigs.tvstats
  if (path.startsWith('/medistats')) return brandConfigs.medistats
  return brandConfigs.statsio
}
