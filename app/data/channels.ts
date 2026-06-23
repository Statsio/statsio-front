export type ChannelTone = 'primary' | 'accent' | 'secondary'

export type ChannelEntry = {
  slug: string
  name: string
  handle: string
  initials: string
  isOfficial: boolean
  description: string
  longDescription: string
  themes: string[]
  subscriptions: number
  followers: number
  articles: string[]
  polls: string[]
  tone: ChannelTone
  hasPaidSubscription: boolean
  subscriptionPrice?: string
  logoUrl?: string | null
  bannerUrl?: string | null
  ageRestriction?: number
}

export const channels: ChannelEntry[] = [
  {
    slug: 'statsio-direct',
    name: 'Statsio Direct',
    handle: '@statsio',
    initials: 'ST',
    isOfficial: true,
    description:
      'La chaîne officielle pour suivre les directs, les bascules électorales et les alertes éditoriales de la plateforme.',
    longDescription:
      'Statsio Direct agrège les signaux prioritaires de la plateforme: directs électoraux, alertes de visibilité, nouveaux formats et publications maison. C’est la porte d’entrée officielle pour suivre les temps forts sans attendre.',
    themes: ['Municipales', 'Présidentielle', 'Direct', 'Statsio'],
    subscriptions: 18200,
    followers: 46800,
    articles: [
      'Présidentielle 2027 : les bassins d’indécision qui peuvent faire basculer le second tour',
      'Réforme des retraites : où le rejet reste le plus fort',
    ],
    polls: ['Municipales 2026 : intentions de vote', 'Abstention probable par segment'],
    tone: 'primary',
    hasPaidSubscription: false,
  },
  {
    slug: 'scan-politique',
    name: 'Le Scan Politique',
    handle: '@scan-politique',
    initials: 'SP',
    isOfficial: false,
    description:
      'Une chaîne dédiée aux rapports de force électoraux, aux campagnes locales et aux bascules qui comptent vraiment.',
    longDescription:
      'Le Scan Politique suit les campagnes, les rapports de force territoriaux et les inflexions d’opinion utiles aux rédactions. Sa force tient à une lecture claire des signaux faibles avant qu’ils ne deviennent des évidences.',
    themes: ['Présidentielle', 'Municipales', 'Opinion', 'Territoires'],
    subscriptions: 12800,
    followers: 38400,
    articles: [
      'Présidentielle 2027 : les bassins d’indécision qui peuvent faire basculer le second tour',
      'Réforme des retraites : où le rejet reste le plus fort',
    ],
    polls: ['Municipales 2026 : intentions de vote', 'Priorités locales avant le scrutin'],
    tone: 'primary',
    hasPaidSubscription: true,
    subscriptionPrice: '9,90 €/mois',
  },
  {
    slug: 'eco-signal',
    name: 'Éco Signal',
    handle: '@eco-signal',
    initials: 'ES',
    isOfficial: false,
    description:
      'Inflation, arbitrages de consommation, emploi et revenus: une lecture courte, exploitable et continue des signaux économiques.',
    longDescription:
      'Éco Signal condense les tensions économiques utiles à la lecture éditoriale: inflation, arbitrages, revenus et consommation. La chaîne privilégie les signaux directement racontables plutôt que l’accumulation de chiffres.',
    themes: ['Inflation', 'Pouvoir d’achat', 'Consommation', 'Emploi'],
    subscriptions: 9400,
    followers: 24100,
    articles: [
      'Inflation : qui retrouve un peu d’air en 2026 ?',
      'Pouvoir d’achat : ce que les ménages coupent en premier',
    ],
    polls: ['Perception de l’inflation ce trimestre', 'Confiance budgétaire des ménages'],
    tone: 'accent',
    hasPaidSubscription: true,
    subscriptionPrice: '7,90 €/mois',
  },
  {
    slug: 'sante-territoires',
    name: 'Santé & Territoires',
    handle: '@sante-territoires',
    initials: 'ST',
    isOfficial: false,
    description:
      'Suivi des déserts médicaux, des accès aux soins et des fractures territoriales avec une approche très terrain.',
    longDescription:
      'Santé & Territoires suit les disparités d’accès aux soins, les tensions hospitalières et les indicateurs sanitaires qui pèsent sur les territoires. La chaîne assume un angle concret, territorial et très actionnable.',
    themes: ['Santé publique', 'Déserts médicaux', 'Jeunesse', 'Prévention'],
    subscriptions: 7100,
    followers: 19300,
    articles: [
      'Déserts médicaux : les zones où l’accès se détériore le plus vite',
      'Hôpitaux : l’impact des déserts médicaux',
    ],
    polls: ['Qualité perçue de l’offre de soins', 'Temps d’attente avant consultation'],
    tone: 'secondary',
    hasPaidSubscription: false,
  },
  {
    slug: 'climat-sols',
    name: 'Climat & Sols',
    handle: '@climat-sols',
    initials: 'CS',
    isOfficial: false,
    description:
      'Sécheresse, eau, agriculture et tensions environnementales analysées avec une lecture territoriale et saisonnière.',
    longDescription:
      'Climat & Sols se concentre sur l’eau, la sécheresse, les tensions agricoles et les dynamiques locales liées au climat. Les contenus mettent l’accent sur les cartes, les comparaisons et les séries utiles à la narration.',
    themes: ['Climat', 'Sécheresse', 'Agriculture', 'Territoires'],
    subscriptions: 5600,
    followers: 14700,
    articles: [
      'Sécheresse : la fracture hydrique s’installe au printemps',
      'Les cartes qui racontent la France des mobilités contraintes',
    ],
    polls: ['Priorité eau dans les budgets locaux', 'Perception du risque sécheresse'],
    tone: 'accent',
    hasPaidSubscription: true,
    subscriptionPrice: '6,90 €/mois',
  },
  {
    slug: 'societe-express',
    name: 'Société Express',
    handle: '@societe-express',
    initials: 'SE',
    isOfficial: false,
    description:
      'Une chaîne pour suivre comportements, arbitrages du quotidien et transformations sociales avec des formats courts.',
    longDescription:
      'Société Express observe les renoncements, arbitrages et transformations du quotidien avec des formats courts et très lisibles. La chaîne vise les sujets à forte résonance pratique et sociale.',
    themes: ['Société', 'Budget', 'Consommation', 'Jeunesse'],
    subscriptions: 8300,
    followers: 21100,
    articles: [
      'Pouvoir d’achat : ce que les ménages coupent en premier',
      'Les cartes qui racontent la France des mobilités contraintes',
    ],
    polls: ['Renoncements du quotidien', 'Priorités budgétaires des ménages'],
    tone: 'secondary',
    hasPaidSubscription: false,
  },
  {
    slug: 'data-elections',
    name: 'Data Élections',
    handle: '@data-elections',
    initials: 'DE',
    isOfficial: false,
    description:
      'Un flux centré sur les scrutins, les intentions de vote, les reports et les dynamiques locales à fort enjeu.',
    longDescription:
      'Data Élections est construite pour les équipes qui veulent suivre les scrutins avec un maximum de densité utile: rapports de force, participation, reports, zones de bascule et intentions par bassin.',
    themes: ['Élections', 'Opinion', 'Municipales', 'Présidentielle'],
    subscriptions: 15100,
    followers: 40200,
    articles: [
      'Présidentielle 2027 : les bassins d’indécision qui peuvent faire basculer le second tour',
      'Réforme des retraites : où le rejet reste le plus fort',
    ],
    polls: ['Municipales 2026 : intentions de vote', 'Abstention probable par segment'],
    tone: 'primary',
    hasPaidSubscription: true,
    subscriptionPrice: '12,90 €/mois',
  },
  {
    slug: 'terrains-publics',
    name: 'Terrains Publics',
    handle: '@terrains-publics',
    initials: 'TP',
    isOfficial: false,
    description:
      'Services publics, accès aux droits, santé, mobilité: des chaînes de lecture concrètes sur les inégalités territoriales.',
    longDescription:
      'Terrains Publics relie services publics, mobilités, accès aux soins et fractures territoriales dans un même espace éditorial. Les contenus sont pensés pour servir autant la synthèse que l’enquête.',
    themes: ['Services publics', 'Santé publique', 'Territoires', 'Mobilité'],
    subscriptions: 6200,
    followers: 17200,
    articles: [
      'Déserts médicaux : les zones où l’accès se détériore le plus vite',
      'Hôpitaux : l’impact des déserts médicaux',
    ],
    polls: ['Qualité des services publics locaux', 'Accès perçu aux soins'],
    tone: 'secondary',
    hasPaidSubscription: false,
  },
  {
    slug: 'marches-signaux',
    name: 'Marchés & Signaux',
    handle: '@marches-signaux',
    initials: 'MS',
    isOfficial: false,
    description:
      'Une lecture continue des prix, revenus, consommation et tension économique avec un angle éditorial simple à exploiter.',
    longDescription:
      'Marchés & Signaux synthétise prix, revenus et consommation dans une perspective directement éditoriale. La chaîne se concentre sur les variations qui changent réellement la lecture d’un sujet économique.',
    themes: ['Inflation', 'Marchés', 'Pouvoir d’achat', 'Économie'],
    subscriptions: 10400,
    followers: 26800,
    articles: [
      'Inflation : qui retrouve un peu d’air en 2026 ?',
      'Pouvoir d’achat : ce que les ménages coupent en premier',
    ],
    polls: ['Confiance économique du trimestre', 'Perception de l’inflation'],
    tone: 'accent',
    hasPaidSubscription: true,
    subscriptionPrice: '8,90 €/mois',
  },
  {
    slug: 'bfm-business',
    name: 'BFM Business',
    handle: '@bfm_business',
    initials: 'BF',
    isOfficial: false,
    description:
      'La chaîne de référence pour l’actualité économique et financière, les marchés et l’entreprise.',
    longDescription:
      'BFM Business propose une couverture en temps réel de l’actualité économique, des marchés financiers et de l’univers de l’entreprise. Des analyses, des débats et des décryptages pour les professionnels et les passionnés d’économie.',
    themes: ['Économie', 'Finance', 'Entreprise', 'Marchés'],
    subscriptions: 25000,
    followers: 75000,
    articles: [
      'BFM Business : l’impact de la inflation sur les marchés',
      'Les indicateurs économiques à surveiller ce trimestre',
    ],
    polls: ['Confiance des entrepreneurs', 'Perspectives économiques'],
    tone: 'primary',
    hasPaidSubscription: true,
    subscriptionPrice: '14,90 €/mois',
  },
]

export const channelToneClasses = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/15 text-slate-900',
  secondary: 'bg-secondary/70 text-slate-900',
} as const

export const channelThemeFilters = [
  'Tous',
  'Présidentielle',
  'Municipales',
  'Inflation',
  'Santé publique',
  'Climat',
  'Territoires',
] as const
