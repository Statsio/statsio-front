import type { HomeV2Content } from '@/data/brands/home-content.types'

export const statsioHomeV2: HomeV2Content = {
  heroBadge: 'DONNÉES PUBLIQUES',
  heroFlash: 'Mis à jour en continu',
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
  // Plus affiché sur la home Statsio (hero éditorial sans KPI). Conservé pour le contrat de type.
  heroStats: [],

  carousels: {
    articles: { eyebrow: 'ARTICLES', title: 'Décryptages et enquêtes du moment', allLabel: 'Tous les articles' },
    statsdata: { eyebrow: 'STATSDATA', title: 'Des chiffres qui bougent en direct', allLabel: 'Toutes les statsdata' },
    sondages: { eyebrow: 'SONDAGES', title: 'Votez, ça compte vraiment', allLabel: 'Toutes les consultations' },
  },

  channelsTitle: 'Rédactions, institutions et analystes à suivre',

  stepsEyebrow: 'POUR TOUT LE MONDE',
  stepsTitle: 'Créez vos propres contenus, simplement et gratuitement',
  stepsDesc:
    "Pas besoin d'être une rédaction : un article, une statsdata ou un sondage se publient en quelques minutes, sans rien payer.",
  stepsCta: 'Créer un compte et publier →',
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

  faqEyebrow: 'QUESTIONS FRÉQUENTES',
  faqTitle: "Tout ce qu'il faut savoir avant de commencer",
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

  cta: {
    headline: 'Rejoignez tous ceux qui lisent, votent et publient sur Statsio.',
    subtitle: 'Gratuit, sans carte bancaire. Vous gardez le contrôle de vos données et de vos publications.',
    primary: 'Créer un compte gratuit',
    secondary: 'Explorer sans compte',
  },
}
