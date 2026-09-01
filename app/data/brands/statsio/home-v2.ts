/**
 * Contenu éditorial de la page d'accueil Statsio v2 (maquette « Accueil v2 »).
 * Les carrousels Articles / StatsData / Sondages / Chaînes sont alimentés par
 * l'API ; ce fichier ne porte que les textes marketing (hero, étapes, FAQ, CTA).
 */

export type HomeHeroStat = { label: string; value: string }

export type HomeHeadlinePart = { text: string; color?: string }

export type HomeStep = {
  num: string
  icon: string
  iconBg: string
  iconFg: string
  title: string
  desc: string
}

export type HomeFaqItem = { q: string; a: string }

export type StatsioHomeContent = {
  heroBadge: string
  heroFlash: string
  heroHeadline: HomeHeadlinePart[]
  heroSubtitle: string
  heroCtaPrimary: string
  heroCtaSecondary: string
  heroStats: HomeHeroStat[]
  steps: HomeStep[]
  faqs: HomeFaqItem[]
}

export const statsioHomeV2: StatsioHomeContent = {
  heroBadge: 'DONNÉES PUBLIQUES',
  heroFlash: '1,2 M de réponses ce mois-ci',
  heroHeadline: [
    { text: 'Les données publiques, ' },
    { text: 'racontées', color: '#7c3aed' },
    { text: ' et ' },
    { text: 'votées', color: '#2563eb' },
    { text: ' par tout le monde.' },
  ],
  heroSubtitle:
    "Statsio réunit articles, statsdata en direct et sondages sur l'énergie, la santé, le climat et l'économie. Lisez, votez — ou publiez les vôtres, gratuitement.",
  heroCtaPrimary: 'Créer mon compte gratuitement',
  heroCtaSecondary: 'Publier un contenu en 2 minutes',
  heroStats: [
    { label: 'Consultations ouvertes', value: '312' },
    { label: 'Statsdata suivies', value: '640' },
    { label: 'Chaînes actives', value: '1 284' },
    { label: 'Comptes créés', value: '84 k' },
  ],
  steps: [
    {
      num: '1',
      icon: '✎',
      iconBg: '#f2ecfd',
      iconFg: '#7c3aed',
      title: 'Choisissez un format',
      desc: 'Article, statsdata en direct, sondage rapide, questionnaire ou pétition.',
    },
    {
      num: '2',
      icon: '⚡',
      iconBg: '#eaf1fe',
      iconFg: '#2563eb',
      title: 'Publiez en quelques minutes',
      desc: 'Un éditeur guidé, sans compétence technique, avec aperçu en direct.',
    },
    {
      num: '3',
      icon: '▤',
      iconBg: '#fdeef1',
      iconFg: '#be123c',
      title: 'Suivez votre audience',
      desc: 'Statistiques de lecture et de participation, exportables à tout moment.',
    },
  ],
  faqs: [
    {
      q: 'Est-ce vraiment gratuit de créer un compte ?',
      a: 'Oui, entièrement. Aucune carte bancaire n’est demandée pour créer un compte, publier un article, une statsdata ou un sondage.',
    },
    {
      q: 'Qui peut publier du contenu sur Statsio ?',
      a: 'Tout le monde : particuliers, journalistes, chercheurs, associations ou administrations. Chaque publication reste identifiée avec son auteur.',
    },
    {
      q: 'D’où viennent les statsdata affichées ?',
      a: 'Des sources publiques (INSEE, ministères, opérateurs) et des chaînes vérifiées qui les mettent à jour régulièrement, parfois en direct.',
    },
    {
      q: 'Mes votes et signatures sont-ils anonymes ?',
      a: 'Votre participation est liée à votre compte pour éviter les votes multiples, mais elle n’est jamais affichée publiquement avec votre nom.',
    },
    {
      q: 'Puis-je supprimer un contenu que j’ai publié ?',
      a: 'Oui, à tout moment depuis votre espace de gestion. Les statistiques de participation restent visibles sur les copies déjà partagées.',
    },
  ],
}
