import statsioLogo from '@/assets/brand/statsio-logo.svg'
import tvstatsLogo from '@/assets/brand/tvstats/tvstats-logo.svg'

export type BrandId = 'statsio' | 'tvstats'

export type BrandMenuItem = {
  id: BrandId
  to: string
  name: string
  logo: string
  eyebrow: string
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
        eyebrow: 'Sous-marque',
      },
    ],
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
        name: 'Statsio',
        logo: statsioLogo,
        eyebrow: 'Marque principale',
      },
    ],
  },
}

export const getBrandConfig = (brandId: BrandId) => brandConfigs[brandId]

export const getBrandFromPath = (path: string): BrandConfig =>
  path.startsWith('/tvstats') ? brandConfigs.tvstats : brandConfigs.statsio
