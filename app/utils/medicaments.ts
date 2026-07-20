/** Icône générique de repli quand aucune photo Wikipédia n'est trouvée pour un médicament — aucune
 * source officielle (BDPM, Open Medic, OMS, openFDA) ne fournit de photo de conditionnement. */
export function getMedicamentFormEmoji(formePharmaceutique: string | null | undefined): string {
  const forme = (formePharmaceutique ?? '').toLowerCase()

  if (forme.includes('sirop') || forme.includes('solution buvable') || forme.includes('suspension buvable')) return '🧴'
  if (forme.includes('pommade') || forme.includes('crème') || forme.includes('gel') || forme.includes('creme')) return '🧪'
  if (forme.includes('injectable') || forme.includes('ampoule') || forme.includes('seringue')) return '💉'
  if (forme.includes('patch') || forme.includes('dispositif transdermique')) return '🩹'
  if (forme.includes('collyre') || forme.includes('gouttes oculaires')) return '👁️'

  return '💊'
}

/**
 * Les noms BDPM/Open Medic sont "MARQUE dosage, forme" (ex. "DOLIPRANE 1000 mg, comprimé")
 * ou "MARQUE dosage forme" — jamais le titre exact d'un article Wikipédia. On ne garde que la
 * partie avant le premier chiffre (le nom commercial) pour donner une chance de matcher un
 * article Wikipédia ; les associations marque+fabricant génériques (ex. "AMOXICILLINE ARROW")
 * ne matcheront souvent pas d'article dédié — c'est attendu, l'icône générique prend le relai.
 */
export function extractMedicamentBrandName(fullName: string): string {
  const beforeDosage = fullName.split(/\d/)[0] ?? fullName

  return beforeDosage.replace(/[,\s]+$/, '').trim()
}
