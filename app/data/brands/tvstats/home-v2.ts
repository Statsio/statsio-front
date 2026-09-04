import type { HomeV2Content } from '@/data/brands/home-content.types'

export const tvstatsHomeV2: HomeV2Content = {
  heroBadge: 'AUDIENCES TV',
  heroFlash: 'Audiences de la veille mises à jour',
  heroHeadline: [
    { text: 'La télé et les médias, ' },
    { text: 'racontés', color: '#166534' },
    { text: ' et ' },
    { text: 'mesurés', color: '#22c55e' },
    { text: ' en chiffres.' },
  ],
  heroSubtitle:
    "TVStats réunit articles, statsdata en direct et sondages sur les audiences, les programmes, les chaînes et les personnalités TV. Suivez, votez — ou publiez les vôtres, gratuitement.",
  heroCtaPrimary: 'Créer mon compte gratuitement',
  heroCtaSecondary: 'Publier un contenu en 2 minutes',
  heroStats: [
    { label: 'Audiences suivies', value: '184' },
    { label: 'Statsdata TV & people', value: '96' },
    { label: 'Chaînes actives', value: '42' },
    { label: 'Consultations ouvertes', value: '31' },
  ],

  carousels: {
    articles: { eyebrow: 'ACTUS', title: 'Décryptages TV & people du moment', allLabel: 'Toutes les actus' },
    statsdata: { eyebrow: 'STATSDATA', title: 'Les chiffres des audiences, en direct', allLabel: 'Toutes les statsdata' },
    sondages: { eyebrow: 'SONDAGES', title: 'Votre avis sur les programmes', allLabel: 'Toutes les consultations' },
  },

  channelsTitle: 'Rédactions médias et analystes TV à suivre',

  stepsEyebrow: 'POUR TOUT LE MONDE',
  stepsTitle: 'Publiez vos analyses TV, simplement et gratuitement',
  stepsDesc:
    "Pas besoin d'être un institut : un décryptage d'audience, une statsdata ou un sondage sur les programmes se publient en quelques minutes, sans rien payer.",
  stepsCta: 'Créer un compte et publier →',
  steps: [
    {
      num: '1',
      icon: '✎',
      iconBg: '#dcfce7',
      iconFg: '#166534',
      title: 'Choisissez un format',
      desc: 'Décryptage, statsdata d’audience en direct, sondage express ou questionnaire.',
    },
    {
      num: '2',
      icon: '⚡',
      iconBg: '#dcfce7',
      iconFg: '#15803d',
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
      a: 'Oui, entièrement. Aucune carte bancaire n’est demandée pour créer un compte, publier une actu, une statsdata ou un sondage.',
    },
    {
      q: 'D’où viennent les audiences affichées ?',
      a: 'De sources publiques et professionnelles (Médiamétrie, communiqués des chaînes) et des chaînes vérifiées qui les mettent à jour régulièrement.',
    },
    {
      q: 'Qui peut publier sur TVStats ?',
      a: 'Tout le monde : passionnés, journalistes médias, chercheurs ou professionnels du secteur. Chaque publication reste identifiée avec son auteur.',
    },
    {
      q: 'Mes votes sont-ils anonymes ?',
      a: 'Votre participation est liée à votre compte pour éviter les votes multiples, mais elle n’est jamais affichée publiquement avec votre nom.',
    },
    {
      q: 'Puis-je supprimer un contenu que j’ai publié ?',
      a: 'Oui, à tout moment depuis votre espace de gestion. Les statistiques de participation restent visibles sur les copies déjà partagées.',
    },
  ],

  cta: {
    headline: 'Rejoignez la communauté qui décrypte la télé et les médias en données.',
    subtitle: 'Gratuit, sans carte bancaire. Vous gardez le contrôle de vos données et de vos publications.',
    primary: 'Créer un compte gratuit',
    secondary: 'Explorer sans compte',
  },
}
