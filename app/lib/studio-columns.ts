import type { DatasetColumn, StudioBlock } from '@/types/studio'

export interface ColumnItem {
  name: string
  type?: DatasetColumn['type']
}

export interface StudioColumnGroup {
  /** Nom de la source (alias ou nom du dataset). */
  label: string
  /** Id local de la source (BlockSource.id). Absent pour les groupes hérités (recherche). */
  sourceId?: string
  /** True pour la source primaire du bloc. */
  isPrimary?: boolean
  columns: ColumnItem[]
}

interface DatasetsLike {
  getSchema: (id: string) => { columns: DatasetColumn[] } | undefined | null
  readyDatasets: { id: string; name: string }[]
}

/** Id de la source primaire d'un bloc (fallback : première source, puis datasetId legacy). */
export function primarySourceId(block: StudioBlock): string {
  return block.primarySourceId
    ?? block.sources?.[0]?.id
    ?? block.datasetId
    ?? ''
}

/**
 * Découpe une référence de colonne : `name` (source primaire) ou `name@<sourceId>`.
 * Split sur le DERNIER `@` pour tolérer un nom de colonne contenant `@`.
 */
export function parseColumnRef(ref: string): { name: string; sourceId: string | null } {
  if (!ref) return { name: ref, sourceId: null }
  const at = ref.lastIndexOf('@')
  if (at <= 0) return { name: ref, sourceId: null }
  return { name: ref.slice(0, at), sourceId: ref.slice(at + 1) }
}

/** Construit une référence : nue si la colonne appartient à la source primaire, sinon `name@<sourceId>`. */
export function makeColumnRef(name: string, sourceId: string | null | undefined, primaryId: string): string {
  if (!sourceId || sourceId === primaryId) return name
  return `${name}@${sourceId}`
}

/** Libellé lisible d'une référence : `prix` ou `prix · Régions`. */
export function columnRefLabel(ref: string, block: StudioBlock, datasets: DatasetsLike): string {
  const { name, sourceId } = parseColumnRef(ref)
  const primary = primarySourceId(block)
  if (!sourceId || sourceId === primary) return name
  const src = block.sources?.find((s) => s.id === sourceId)
  const dsName = src && datasets.readyDatasets.find((d) => d.id === src.datasetId)?.name
  return `${name} · ${src?.alias || dsName || sourceId}`
}

/**
 * Colonnes disponibles pour un bloc, groupées par source (une entrée par
 * `block.sources`). Source unique de tous les sélecteurs de colonnes.
 */
export function blockColumnGroups(block: StudioBlock, datasets: DatasetsLike): StudioColumnGroup[] {
  const groups: StudioColumnGroup[] = []
  const primary = primarySourceId(block)

  // Sources normalisées (ou fallback legacy datasetId).
  const sources = block.sources?.length
    ? block.sources
    : block.datasetId
      ? [{ id: block.datasetId, datasetId: block.datasetId, alias: undefined }]
      : []

  for (const src of sources) {
    const schema = src.datasetId ? datasets.getSchema(src.datasetId) : null
    if (!schema) continue
    const dsName = datasets.readyDatasets.find((d) => d.id === src.datasetId)?.name
    groups.push({
      label: src.alias || dsName || (src.id === primary ? 'Source principale' : src.id),
      sourceId: src.id,
      isPrimary: src.id === primary,
      columns: schema.columns.map((c) => ({ name: c.name, type: c.type })),
    })
  }

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
