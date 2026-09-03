export type HeaderNavIcon =
  | 'articles'
  | 'stats'
  | 'polls'
  | 'channels'
  | 'dossiers'
  | 'remote'
  | 'disease'
  | 'medicine'
  | 'medical-service'

export type MegaMenuCategory = {
  name: string
  color: string
  /** Nombre de contenus dans cette catégorie. Absent quand la source ne l'expose pas. */
  count?: number
  /** Lien direct vers la catégorie filtrée. Absent = lien vers la rubrique générale. */
  href?: string
}

export type MegaMenuArticleCard = {
  tag: string
  title: string
  meta: string
  /** Champs v2 — enrichis par le catalogue public, optionnels pour les autres marques. */
  href?: string
  tagColor?: string
  readingLabel?: string
  publisher?: string
  initials?: string
  logoUrl?: string | null
  isChannel?: boolean
}

export type MegaMenuDataCard = {
  icon: string
  title: string
  meta: string
  /** Hauteurs (px) codées en dur, décoratives. La dernière barre est mise en avant. */
  sparkline: number[]
  /** Champs v2. */
  href?: string
  theme?: string
  themeColor?: string
  freq?: string
  freqLive?: boolean
  kpi?: string
  kpiDelta?: string
}

export type MegaMenuPollCard = {
  question: string
  voteCount: string
  /** Absent quand aucun résultat agrégé n'est disponible pour ce sondage. */
  splitA?: { label: string; percent: number }
  splitB?: { label: string; percent: number }
  /** Champs v2. */
  href?: string
  kind?: string
  kindColor?: string
  statusOpen?: boolean
  lead?: string
  percent?: number
}

export type MegaMenuChannelCard = {
  name: string
  initials: string
  meta: string
  logoUrl: string | null
  avatarPrimary: string
  avatarSecondary: string
  /** Champs v2. */
  href?: string
  verified?: boolean
  followers?: string
}

export type MegaMenuContent =
  | { variant: 'doc'; cards: MegaMenuArticleCard[] }
  | { variant: 'bar'; cards: MegaMenuDataCard[] }
  | { variant: 'pie'; cards: MegaMenuPollCard[] }
  | { variant: 'plane'; cards: MegaMenuChannelCard[] }

export type PromoTickerItem = {
  kind: 'article' | 'statsdata' | 'survey'
  tag: string
  tagColor: string
  title: string
  href: string
  /** StatsData : valeur mise en avant + libellé. */
  kpi?: string
  kpiLabel?: string
  /** StatsData : mini série décorative dérivée de l'id. */
  sparkline?: number[]
  /** Sondage : pourcentage de l'option en tête. */
  percent?: number
}

export type HeaderNavItem = {
  label: string
  href: string
  icon: HeaderNavIcon
  eyebrow: string
  links: string[]
  menuHeading: string
  /** Titre de la colonne catégories (« Rubriques », « Thèmes »…). */
  categoryHeading?: string
  categories: MegaMenuCategory[]
  menu: MegaMenuContent
}
