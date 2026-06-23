export type PollOption = {
  id: string
  label: string
  description?: string
  image?: string
}

export type PollQuestion = {
  id: string
  prompt: string
  helper?: string
  selection: 'single' | 'multiple'
  options: PollOption[]
}

export type PollStatus = 'open' | 'closed'

export type PollSummary = {
  slug: string
  category: string
  title: string
  summary: string
  audience: string
  responseCount: number
  questionCount: number
  status: PollStatus
  deadline?: string
  coverImage?: string
}

export type PollDetail = PollSummary & {
  intro: string
  author: string
  publishedAt: string
  estimatedTime: string
  highlights: string[]
  questions: PollQuestion[]
}

export const pollDetails: Record<string, PollDetail> = {
  'barometre-municipales-priorites-locales': {
    slug: 'barometre-municipales-priorites-locales',
    category: 'Politique locale',
    title: 'Baromètre municipales 2026: priorités locales et attentes de proximité',
    summary:
      'Un sondage court pour hiérarchiser les sujets qui doivent peser dans les dernières semaines de campagne.',
    intro:
      'Cette consultation permet de distinguer les thèmes qui structurent vraiment le vote local: services publics, sécurité, mobilités et cadre de vie.',
    audience: 'Citoyens inscrits',
    responseCount: 1842,
    questionCount: 1,
    status: 'open',
    deadline: '18 avril 2026',
    coverImage:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80',
    author: 'Équipe Statsio',
    publishedAt: '2 avril 2026',
    estimatedTime: '1 min',
    highlights: [
      'Question unique pensée pour une réponse rapide.',
      'Réponse possible uniquement depuis la page détail.',
      'La date limite est visible dès le listing et rappelée dans le détail.',
    ],
    questions: [
      {
        id: 'priorite-principale',
        prompt: 'Quel sujet doit être traité en priorité par votre future équipe municipale ?',
        helper: 'Choisissez une seule priorité principale.',
        selection: 'single',
        options: [
          {
            id: 'services-publics',
            label: 'Services publics de proximité',
            description: 'Écoles, démarches, accueil et présence sur le terrain.',
          },
          {
            id: 'securite',
            label: 'Sécurité et tranquillité',
            description: 'Prévention, éclairage, présence et médiation.',
          },
          {
            id: 'mobilites',
            label: 'Mobilités et circulation',
            description: 'Transports, stationnement et accès au centre-ville.',
          },
          {
            id: 'cadre-de-vie',
            label: 'Cadre de vie et propreté',
            description: 'Espaces verts, entretien urbain et qualité de vie.',
          },
        ],
      },
    ],
  },
  'plateformes-video-usage-quotidien': {
    slug: 'plateformes-video-usage-quotidien',
    category: 'Usages médias',
    title: 'Plateformes vidéo: vos usages quotidiens et vos arbitrages',
    summary:
      'Un sondage multi-questions pour comprendre les habitudes de visionnage, la fatigue des abonnements et les formats préférés.',
    intro:
      'Le parcours combine des questions simples et des réponses illustrées pour mieux qualifier les usages réels et les arbitrages du quotidien.',
    audience: 'Utilisateurs connectés',
    responseCount: 2674,
    questionCount: 3,
    status: 'open',
    coverImage:
      'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1600&q=80',
    author: 'Pôle audience',
    publishedAt: '28 mars 2026',
    estimatedTime: '3 min',
    highlights: [
      'Plusieurs questions dans un même formulaire.',
      'Certaines réponses incluent un visuel pour renforcer la lisibilité.',
      'Aucune date limite définie pour cette vague.',
    ],
    questions: [
      {
        id: 'moment-visionnage',
        prompt: 'À quel moment regardez-vous le plus souvent des contenus vidéo ?',
        helper: 'Une seule réponse attendue.',
        selection: 'single',
        options: [
          {
            id: 'matin',
            label: 'Le matin',
            description: 'Avant le travail ou pendant les transports.',
            image:
              'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
          },
          {
            id: 'pause',
            label: 'À la pause déjeuner',
            description: 'Formats courts ou rattrapage rapide.',
            image:
              'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
          },
          {
            id: 'soir',
            label: 'Le soir',
            description: 'Session principale de visionnage.',
            image:
              'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80',
          },
        ],
      },
      {
        id: 'formats-preferes',
        prompt: 'Quels formats consultez-vous le plus souvent ?',
        helper: 'Plusieurs choix possibles.',
        selection: 'multiple',
        options: [
          { id: 'live', label: 'Live', description: 'Actualité chaude, sport, soirées événementielles.' },
          { id: 'replay', label: 'Replay', description: 'Programmes revus à la demande.' },
          { id: 'shorts', label: 'Formats courts', description: 'Capsules, extraits, vertical video.' },
          { id: 'documentaires', label: 'Formats longs', description: 'Docu, enquêtes, entretiens.' },
        ],
      },
      {
        id: 'frein-abonnement',
        prompt: 'Quel est aujourd’hui votre principal frein à un abonnement supplémentaire ?',
        helper: 'Une seule réponse attendue.',
        selection: 'single',
        options: [
          { id: 'prix', label: 'Le prix', description: 'Le budget mensuel est déjà au maximum.' },
          { id: 'temps', label: 'Le manque de temps', description: 'Je n’utilise pas assez les offres existantes.' },
          { id: 'dispersion', label: 'La dispersion des catalogues', description: 'Les contenus sont trop fragmentés.' },
          { id: 'aucun', label: 'Aucun frein majeur', description: 'Je peux encore ajouter une plateforme.' },
        ],
      },
    ],
  },
  'intentions-vote-ecologie-jeunesse': {
    slug: 'intentions-vote-ecologie-jeunesse',
    category: 'Opinion',
    title: 'Intentions de vote et écologie chez les 18-24 ans',
    summary:
      'Une vague désormais clôturée, conservée pour consultation et comparaison des thèmes dominants.',
    intro:
      'Le sondage n’accepte plus de réponse, mais la structure reste visible pour documenter les choix proposés lors de la dernière vague.',
    audience: 'Panel 18-24 ans',
    responseCount: 3921,
    questionCount: 2,
    status: 'closed',
    deadline: '31 mars 2026',
    coverImage:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
    author: 'Cellule opinion',
    publishedAt: '15 mars 2026',
    estimatedTime: '2 min',
    highlights: [
      'Sondage fermé: le formulaire est désactivé.',
      'La date limite passée reste affichée pour contextualiser la vague.',
      'Le détail permet de consulter la structure du questionnaire.',
    ],
    questions: [
      {
        id: 'importance-ecologie',
        prompt: 'À quel niveau l’écologie pèse-t-elle dans votre choix électoral ?',
        selection: 'single',
        options: [
          { id: 'decisif', label: 'C’est décisif' },
          { id: 'important', label: 'C’est important mais pas unique' },
          { id: 'secondaire', label: 'C’est secondaire' },
          { id: 'faible', label: 'Cela pèse peu' },
        ],
      },
      {
        id: 'sujets-attendus',
        prompt: 'Quels sujets écologiques attendez-vous en priorité dans les programmes ?',
        helper: 'Question multi-réponse conservée en archive.',
        selection: 'multiple',
        options: [
          { id: 'transports', label: 'Transports et mobilités' },
          { id: 'energie', label: 'Énergie et rénovation' },
          { id: 'dechets', label: 'Déchets et recyclage' },
          { id: 'alimentation', label: 'Alimentation et agriculture' },
        ],
      },
    ],
  },
}

export const pollSummaries: PollSummary[] = Object.values(pollDetails).map(
  ({ intro: _intro, author: _author, publishedAt: _publishedAt, estimatedTime: _estimatedTime, highlights: _highlights, questions, ...summary }) => ({
    ...summary,
    questionCount: questions.length,
  }),
)

export const pollFilterLabels = ['Tous', 'Ouverts', 'Fermés', 'Avec date limite', 'Multi-questions'] as const
