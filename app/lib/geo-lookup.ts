export interface CommuneResult {
  nom: string
  codesPostaux: string[]
  region?: { nom: string; code: string } | null
}

/**
 * Recherche des communes françaises par code postal via l'API Découpage administratif
 * (geo.api.gouv.fr) — publique, sans clé, CORS ouvert. Un code postal peut correspondre à
 * plusieurs communes (ex. arrondissements, communes associées) : l'appelant décide s'il
 * faut pré-sélectionner automatiquement un résultat unique ou proposer un choix.
 */
export async function lookupCommunesByPostalCode(postalCode: string): Promise<CommuneResult[]> {
  const res = await fetch(
    `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(postalCode)}&fields=nom,region,codesPostaux&format=json`,
  )
  if (!res.ok) return []
  return (await res.json()) as CommuneResult[]
}
