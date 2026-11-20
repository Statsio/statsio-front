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
  /** Logo à afficher à la place de `icon` (ex. logo de chaîne dans le menu Audiences). */
  logoUrl?: string | null
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

/** Sous-groupes optionnels d'une liste de cartes (ex. « En ce moment » / « Ce soir »). */
export type MegaMenuCardSection<TCard> = {
  label: string
  cards: TCard[]
}

export type MegaMenuContent =
  | { variant: 'doc'; cards: MegaMenuArticleCard[]; sections?: MegaMenuCardSection<MegaMenuArticleCard>[] }
  | { variant: 'bar'; cards: MegaMenuDataCard[] }
  | { variant: 'pie'; cards: MegaMenuPollCard[] }
  | { variant: 'plane'; cards: MegaMenuChannelCard[] }

/** Type d'info du bandeau « En continu » (étiquette colorée devant le texte). */
export type PromoTickerKind = 'une' | 'actu' | 'chiffre' | 'sondage' | 'maj'

/** Fragment de texte d'une info du bandeau ; `strong` = chiffre mis en avant (mono). */
export type PromoTickerPart = { text: string; strong?: boolean }

/** Une info du bandeau « En continu » — toujours construite depuis le catalogue réel. */
export type PromoTickerItem = {
  kind: PromoTickerKind
  /** libellé de l'étiquette (« À la une », « Dernier chiffre »…) */
  label: string
  parts: PromoTickerPart[]
  href: string
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
