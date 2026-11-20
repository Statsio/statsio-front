/**
 * Textes de la page d'accueil Statsio (charte « Tranches »).
 * Les chiffres affichés ne vivent jamais ici : ils sont calculés depuis le
 * catalogue public (voir composables/useStatsioHome.ts).
 */
export type HomeTranchesAsk = {
  /** question affichée sur la pastille */
  label: string
  /** requête envoyée à la recherche globale */
  query: string
}

export type HomeTranchesContent = {
  hero: {
    /** titre : segments, `em` = mis en avant (couleur d'accent) */
    title: { text: string; em?: boolean }[]
    lede: string
    placeholder: string
    asksLabel: string
    asks: HomeTranchesAsk[]
  }
  explore: { label: string; title: { text: string; em?: boolean }[]; description: string }
  live: { label: string; title: { text: string; em?: boolean }[]; description: string }
  channels: { label: string; title: { text: string; em?: boolean }[]; allLabel: string }
  publish: { label: string; title: string; steps: string[]; cta: string }
}

export const statsioHomeTranches: HomeTranchesContent = {
  hero: {
    title: [{ text: 'Que voulez-vous ' }, { text: 'savoir ?', em: true }],
    lede: "Une question, un sujet, une chaîne : Statsio cherche dans les données publiques, les articles qui les expliquent et les sondages.",
    placeholder: 'Ex. carburants, urgences, audiences…',
    asksLabel: 'Pistes pour commencer',
    asks: [
      { label: 'Combien coûte le carburant ?', query: 'carburant' },
      { label: "Que disent les chiffres de l'hôpital ?", query: 'hôpital' },
      { label: 'Qui regarde quoi à la télé ?', query: 'audiences' },
      { label: 'Quels sondages sont ouverts ?', query: 'sondage' },
    ],
  },
  explore: {
    label: 'Explorer',
    title: [{ text: 'Choisissez ' }, { text: 'votre part', em: true }],
    description: "Chaque part du camembert est un sujet. Cliquez dessus : elle se détache et ses contenus s'affichent.",
  },
  live: {
    label: 'En direct',
    title: [{ text: 'Ce qui vient de ' }, { text: 'bouger', em: true }],
    description:
      "Les données qui se mettent à jour, les analyses publiées, les consultations ouvertes, dans l'ordre où elles arrivent.",
  },
  channels: {
    label: 'Qui publie ?',
    title: [{ text: 'Des rédactions, ' }, { text: 'pas des algorithmes', em: true }],
    allLabel: 'Toutes les chaînes',
  },
  publish: {
    label: 'Publier · gratuit',
    title: 'Vous avez des données ? Publiez-les en trois tranches.',
    steps: ['Branchez une source publique', 'Construisez vos graphiques', 'Publiez sur votre chaîne'],
    cta: 'Ouvrir le Studio',
  },
}
