import { slugify } from '@/lib/slug'

/**
 * Export CSV côté client : sérialise les lignes déjà chargées d'un bloc de données
 * (tableau, fiche…) et déclenche un téléchargement. Ne fait pas d'appel réseau —
 * n'exporte donc que ce qui est visible (page courante du tableau).
 */

/** Échappe une valeur selon RFC 4180 (guillemets doublés, encadrement si besoin). */
function escapeCell(value: unknown): string {
  const str = value == null ? '' : String(value)
  return /[",\n\r;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

/**
 * @param columns ordre des colonnes exportées
 * @param rows lignes (objets colonne → valeur)
 * @param separator `,` par défaut ; `;` pour Excel FR
 */
export function rowsToCsv(
  columns: string[],
  rows: Array<Record<string, unknown>>,
  separator = ',',
): string {
  const header = columns.map(escapeCell).join(separator)
  const body = rows.map((row) => columns.map((col) => escapeCell(row[col])).join(separator))
  // BOM pour qu'Excel ouvre l'UTF-8 correctement.
  return '﻿' + [header, ...body].join('\r\n')
}

/** Slugifie un titre en nom de fichier sûr. */
export function csvFileName(base: string): string {
  return `${slugify(base) || 'export'}.csv`
}

/** Déclenche le téléchargement d'un contenu CSV (no-op côté serveur). */
export function downloadCsv(fileName: string, csv: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
