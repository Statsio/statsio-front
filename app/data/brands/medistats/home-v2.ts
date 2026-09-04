import type { HomeV2Content } from '@/data/brands/home-content.types'

export const medistatsHomeV2: HomeV2Content = {
  heroBadge: 'SANTÉ PUBLIQUE',
  heroFlash: 'Indicateurs santé actualisés cette semaine',
  heroHeadline: [
    { text: 'La santé publique, ' },
    { text: 'racontée', color: '#991b1b' },
    { text: ' et ' },
    { text: 'chiffrée', color: '#ef4444' },
    { text: ' pour tous.' },
  ],
  heroSubtitle:
    "Medistats réunit articles, statsdata en direct et sondages sur les maladies, les médicaments et l'offre de soins. Lisez, votez — ou publiez les vôtres, gratuitement.",
  heroCtaPrimary: 'Créer mon compte gratuitement',
  heroCtaSecondary: 'Publier un contenu en 2 minutes',
  heroStats: [
    { label: 'Indicateurs santé', value: '96' },
    { label: 'Statsdata suivies', value: '120' },
    { label: 'Chaînes actives', value: '58' },
    { label: 'Consultations ouvertes', value: '27' },
  ],

  carousels: {
    articles: { eyebrow: 'ARTICLES', title: 'Décryptages santé du moment', allLabel: 'Tous les articles' },
    statsdata: { eyebrow: 'STATSDATA', title: 'Les chiffres de la santé, en direct', allLabel: 'Toutes les statsdata' },
    sondages: { eyebrow: 'SONDAGES', title: 'Votre avis sur le système de soins', allLabel: 'Toutes les consultations' },
  },

  channelsTitle: 'Institutions, chercheurs et rédactions santé à suivre',

  stepsEyebrow: 'POUR TOUT LE MONDE',
  stepsTitle: 'Publiez vos analyses santé, simplement et gratuitement',
  stepsDesc:
    "Pas besoin d'être une institution : un décryptage, une statsdata ou un sondage sur l'offre de soins se publient en quelques minutes, sans rien payer.",
  stepsCta: 'Créer un compte et publier →',
  steps: [
    {
      num: '1',
      icon: '✎',
      iconBg: '#fee2e2',
      iconFg: '#991b1b',
      title: 'Choisissez un format',
      desc: 'Article, statsdata en direct, sondage express, questionnaire ou pétition.',
    },
    {
      num: '2',
      icon: '⚡',
      iconBg: '#fee2e2',
      iconFg: '#b91c1c',
      title: 'Publiez en quelques minutes',
      desc: 'Un éditeur guidé, sans compétence technique, avec aperçu en direct.',
    },
    {
      num: '3',
      icon: '▤',
      iconBg: '#fef9c3',
      iconFg: '#a16207',
      title: 'Suivez votre audience',
      desc: 'Statistiques de lecture et de participation, exportables à tout moment.',
    },
  ],

  faqEyebrow: 'QUESTIONS FRÉQUENTES',
  faqTitle: "Tout ce qu'il faut savoir avant de commencer",
  faqs: [
    {
      q: 'Est-ce vraiment gratuit de créer un compte ?',
      a: 'Oui, entièrement. Aucune carte bancaire n’est demandée pour créer un compte, publier un article, une statsdata ou un sondage.',
    },
    {
      q: 'D’où viennent les données de santé affichées ?',
      a: 'De sources publiques (Santé publique France, DREES, Assurance maladie, ministères) et des chaînes vérifiées qui les mettent à jour régulièrement.',
    },
    {
      q: 'Qui peut publier sur Medistats ?',
      a: 'Tout le monde : patients, soignants, chercheurs, associations ou administrations. Chaque publication reste identifiée avec son auteur.',
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

  cta: {
    headline: 'Rejoignez la communauté qui décrypte la santé publique en données.',
    subtitle: 'Gratuit, sans carte bancaire. Vous gardez le contrôle de vos données et de vos publications.',
    primary: 'Créer un compte gratuit',
    secondary: 'Explorer sans compte',
  },
}
