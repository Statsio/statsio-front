export type HeaderNavIcon =
  | 'articles'
  | 'stats'
  | 'polls'
  | 'channels'
  | 'remote'
  | 'disease'
  | 'medicine'
  | 'medical-service'

export type MegaMenuCategory = {
  name: string
  color: string
}

export type MegaMenuArticleCard = {
  tag: string
  title: string
  meta: string
}

export type MegaMenuDataCard = {
  icon: string
  title: string
  meta: string
  /** Hauteurs (px) codées en dur, décoratives. La dernière barre est mise en avant. */
  sparkline: number[]
}

export type MegaMenuPollCard = {
  question: string
  voteCount: string
  /** Absent quand aucun résultat agrégé n'est disponible pour ce sondage. */
  splitA?: { label: string; percent: number }
  splitB?: { label: string; percent: number }
}

export type MegaMenuChannelCard = {
  name: string
  initials: string
  meta: string
  avatarColor: string
}

export type MegaMenuContent =
  | { variant: 'doc'; cards: MegaMenuArticleCard[] }
  | { variant: 'bar'; cards: MegaMenuDataCard[] }
  | { variant: 'pie'; cards: MegaMenuPollCard[] }
  | { variant: 'plane'; cards: MegaMenuChannelCard[] }

export type HeaderNavItem = {
  label: string
  href: string
  icon: HeaderNavIcon
  eyebrow: string
  links: string[]
  menuHeading: string
  categories: MegaMenuCategory[]
  menu: MegaMenuContent
}
