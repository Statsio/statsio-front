export type ArticleSummary = {
  slug: string
  category: string
  title: string
  excerpt: string
  author: string
  readTime: string
  signal: string
  signalLabel: string
  image?: string
}

export type ArticleDetail = {
  category: string
  title: string
  intro: string
  image: string
  author: string
  publishedAt: string
  readTime: string
  stats: { label: string; value: string }[]
  body: string[]
  keyPoints: string[]
}

export const articleSummaries: ArticleSummary[] = [
  {
    slug: 'inflation-qui-retrouve-un-peu-dair-en-2026',
    category: 'Économie',
    title: 'Inflation : qui retrouve un peu d’air en 2026 ?',
    excerpt:
      'Lecture croisée des prix, des revenus et des arbitrages de consommation sur douze grandes villes françaises.',
    author: 'Camille Bernard',
    readTime: '6 min',
    signal: '+18%',
    signalLabel: 'engagement',
    image:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'deserts-medicaux-zones-ou-lacces-se-deteriore',
    category: 'Santé',
    title: 'Déserts médicaux : les zones où l’accès se détériore le plus vite',
    excerpt:
      'Un panorama des territoires sous tension, avec densité de praticiens, délais d’accès et évolution sur cinq ans.',
    author: 'Nora Petit',
    readTime: '7 min',
    signal: '24 départements',
    signalLabel: 'sous tension',
    image:
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'secheresse-fracture-hydrique-printemps',
    category: 'Climat',
    title: 'Sécheresse : la fracture hydrique s’installe au printemps',
    excerpt:
      'Cartes, anomalies et historique des niveaux d’alerte pour anticiper les zones les plus exposées.',
    author: 'Julien Laurent',
    readTime: '5 min',
    signal: '3 vagues',
    signalLabel: 'déjà observées',
  },
  {
    slug: 'pouvoir-dachat-ce-que-les-menages-coupent-en-premier',
    category: 'Société',
    title: 'Pouvoir d’achat : ce que les ménages coupent en premier',
    excerpt:
      'Une analyse par profils, arbitrages budgétaires et perception de la pression quotidienne.',
    author: 'Équipe Statsio',
    readTime: '4 min',
    signal: '52k',
    signalLabel: 'lectures',
    image:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'reforme-des-retraites-ou-le-rejet-reste-le-plus-fort',
    category: 'Politique',
    title: 'Réforme des retraites : où le rejet reste le plus fort',
    excerpt:
      'Territoires, tranches d’âge et catégories sociales comparés dans un format lisible et actionnable.',
    author: 'Sofia Martin',
    readTime: '6 min',
    signal: '+9%',
    signalLabel: 'partages',
  },
  {
    slug: 'les-cartes-qui-racontent-la-france-des-mobilites-contraintes',
    category: 'Data story',
    title: 'Les cartes qui racontent la France des mobilités contraintes',
    excerpt:
      'Un format visuel construit autour des trajets, des coûts et du temps perdu pour aller travailler.',
    author: 'Léo Vincent',
    readTime: '9 min',
    signal: '12 visuels',
    signalLabel: 'interactifs',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  },
]

export const articleDetails: Record<string, ArticleDetail> = {
  'presidentielle-2027-bassins-indecision': {
    category: 'Politique',
    title: 'Présidentielle 2027 : les bassins d’indécision qui peuvent faire basculer le second tour',
    intro:
      'Les dernières vagues d’opinion montrent une stabilité apparente au niveau national, mais les écarts territoriaux restent suffisamment marqués pour déplacer le centre de gravité du second tour.',
    image:
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1600&q=80',
    author: 'Équipe Statsio',
    publishedAt: '22 mars 2026',
    readTime: '8 min',
    stats: [
      { label: 'Sources croisées', value: '14' },
      { label: 'Territoires étudiés', value: '36' },
      { label: 'Mise à jour', value: 'Il y a 2 h' },
    ],
    body: [
      'Au-delà des moyennes nationales, ce sont les zones de flottement électoral qui dessinent aujourd’hui le rapport de force le plus instable. Dans plusieurs bassins urbains et périurbains, les intentions de vote restent sensibles aux thèmes du pouvoir d’achat, de la sécurité quotidienne et de l’accès aux services publics.',
      'L’analyse montre que l’indécision ne se répartit pas de manière homogène. Elle se concentre davantage dans les territoires où l’offre politique est perçue comme peu différenciante, mais aussi dans les segments d’électeurs ayant déjà changé de préférence lors des deux derniers cycles électoraux.',
      'En pratique, cela signifie qu’un déplacement limité, mais géographiquement bien placé, peut produire un effet plus fort qu’une progression diffuse à l’échelle nationale. Les campagnes qui réussiront à densifier leur présence dans ces zones clés disposeront d’un levier plus déterminant que celles qui misent uniquement sur la visibilité globale.',
    ],
    keyPoints: [
      'Les bassins d’indécision se concentrent dans des zones urbaines moyennes et des couronnes périurbaines.',
      'Le pouvoir d’achat reste le principal facteur de volatilité déclaré.',
      'Les écarts locaux sont assez forts pour modifier la hiérarchie nationale en cas de mobilisation différenciée.',
    ],
  },
  'inflation-qui-retrouve-un-peu-dair-en-2026': {
    category: 'Économie',
    title: 'Inflation : qui retrouve un peu d’air en 2026 ?',
    intro:
      'Les prix ralentissent, mais le soulagement reste très inégal selon les villes, les profils de revenus et les postes de dépense réellement contraints.',
    image:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
    author: 'Camille Bernard',
    publishedAt: '22 mars 2026',
    readTime: '6 min',
    stats: [
      { label: 'Villes comparées', value: '12' },
      { label: 'Indicateurs', value: '7' },
      { label: 'Engagement', value: '+18%' },
    ],
    body: [
      'La décrue de l’inflation masque des réalités encore très contrastées. Dans les agglomérations où le logement et l’alimentation pèsent plus lourd dans le budget des ménages, l’amélioration reste perçue comme partielle et tardive.',
      'Les foyers intermédiaires ressentent davantage la stabilisation, notamment lorsque l’énergie et les dépenses contraintes cessent d’augmenter au même rythme. Mais pour les ménages les plus exposés, le ralentissement des hausses ne suffit pas à recréer une sensation de marge.',
      'En observant les arbitrages de consommation, on constate surtout un déplacement: moins de renoncements brutaux, mais plus de vigilance continue. L’air revient, sans pour autant restaurer un sentiment de confort budgétaire.',
    ],
    keyPoints: [
      'Le ralentissement est visible, mais pas encore perçu de manière homogène.',
      'Le logement et l’alimentation restent les premiers postes de tension.',
      'Les arbitrages changent, sans retour complet à une consommation détendue.',
    ],
  },
}
