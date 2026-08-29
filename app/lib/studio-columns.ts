import type { DatasetColumn, StudioBlock } from '@/types/studio'

export interface ColumnItem {
  name: string
  type?: DatasetColumn['type']
}

export interface StudioColumnGroup {
  /** Nom de la source (ou « Jointure — … »). */
  label: string
  columns: ColumnItem[]
}

interface DatasetsLike {
  getSchema: (id: string) => { columns: DatasetColumn[] } | undefined | null
  readyDatasets: { id: string; name: string }[]
}

/**
 * Colonnes disponibles pour un bloc, groupées par source : source principale
 * puis une entrée par jointure. Source unique pour tous les sélecteurs de
 * colonnes (filtres, mapping, distinct/tri/comparaison…).
 */
export function blockColumnGroups(block: StudioBlock, datasets: DatasetsLike): StudioColumnGroup[] {
  const groups: StudioColumnGroup[] = []

  const primary = block.datasetId ? datasets.getSchema(block.datasetId) : null
  if (primary) {
    const name = datasets.readyDatasets.find((d) => d.id === block.datasetId)?.name ?? 'Source principale'
    groups.push({ label: name, columns: primary.columns.map((c) => ({ name: c.name, type: c.type })) })
  }

  ;(block.joins ?? []).forEach((join, i) => {
    const schema = join.datasetId ? datasets.getSchema(join.datasetId) : null
    if (!schema) return
    const name = datasets.readyDatasets.find((d) => d.id === join.datasetId)?.name ?? `#${i + 1}`
    groups.push({ label: `Jointure — ${name}`, columns: schema.columns.map((c) => ({ name: c.name, type: c.type })) })
  })

  return groups
}

/** Idem pour un bloc Recherche (searchSources + searchJoins). */
export function searchColumnGroups(block: StudioBlock, datasets: DatasetsLike): StudioColumnGroup[] {
  const groups: StudioColumnGroup[] = []
  const seen = new Set<string>()

  for (const src of block.fieldMapping.searchSources ?? []) {
    if (!src.datasetId || seen.has(src.datasetId)) continue
    seen.add(src.datasetId)
    const schema = datasets.getSchema(src.datasetId)
    if (!schema) continue
    const name = datasets.readyDatasets.find((d) => d.id === src.datasetId)?.name ?? 'Source'
    groups.push({ label: name, columns: schema.columns.map((c) => ({ name: c.name, type: c.type })) })
  }
  for (const join of block.fieldMapping.searchJoins ?? []) {
    if (!join.datasetId || seen.has(join.datasetId)) continue
    seen.add(join.datasetId)
    const schema = datasets.getSchema(join.datasetId)
    if (!schema) continue
    const name = datasets.readyDatasets.find((d) => d.id === join.datasetId)?.name ?? 'jointure'
    groups.push({ label: `Jointure — ${name}`, columns: schema.columns.map((c) => ({ name: c.name, type: c.type })) })
  }
  return groups
}

export const COLUMN_TYPE_BADGE: Record<string, string> = {
  integer: '#',
  float: '~',
  string: 'T',
  date: 'd',
  datetime: 'dt',
  boolean: '?',
}
