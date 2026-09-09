/** Chiffres publics agrégés de la plateforme, exposés par `GET /api/public-stats`. */
export interface PlatformStats {
  /** Nombre de StatsData publiées. */
  statsdata: number
  /** Nombre d'articles publiés. */
  articles: number
  /** Nombre de sondages publiés. */
  surveys: number
  /** Total des contenus publiés (statsdata + articles + sondages). */
  publishedTotal: number
  /** Nombre de jeux de données prêts à l'emploi. */
  datasets: number
  /** Nombre de chaînes actives. */
  channels: number
  /** Nombre de créateurs distincts ayant au moins un contenu publié. */
  contributors: number
  /** Date ISO de la dernière publication, `null` si aucun contenu publié. */
  lastPublishedAt: string | null
}
