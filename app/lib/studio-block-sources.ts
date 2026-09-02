import type { BlockJoin, BlockSource, DatasetColumn, FieldMapping, StudioBlock } from '@/types/studio'

/**
 * Ancien format de jointure d'un bloc data (rattachée à la source primaire) :
 * `{ datasetId, leftColumn, rightColumn, columns, type }`. Lu uniquement à la
 * migration vers le modèle `sources[]` + `joins[]` (graphe).
 */
interface LegacyBlockJoin {
  datasetId: string
  leftColumn: string
  rightColumn: string
  columns?: string[]
  type?: 'inner' | 'left'
}

function legacyJoinsOf(block: StudioBlock): LegacyBlockJoin[] {
  return ((block.joins ?? []) as unknown[]).filter(
    (j): j is LegacyBlockJoin => !!j && typeof j === 'object' && 'datasetId' in (j as Record<string, unknown>),
  )
}

/** Réécrit une ref de colonne nue en `name@<sourceId>` si elle appartient à une source jointe (legacy). */
function requalify(ref: string | undefined, colToSource: Map<string, string>): string | undefined {
  if (!ref || ref.includes('@')) return ref
  const sid = colToSource.get(ref)
  return sid ? `${ref}@${sid}` : ref
}

function requalifyMapping(fm: FieldMapping, colToSource: Map<string, string>): FieldMapping {
  if (colToSource.size === 0) return fm
  const r = (v?: string) => requalify(v, colToSource)
  const rArr = (a?: string[]) => a?.map((v) => r(v) as string)
  const rKeys = <T>(rec?: Record<string, T>) =>
    rec ? Object.fromEntries(Object.entries(rec).map(([k, v]) => [r(k) as string, v])) : rec

  return {
    ...fm,
    xAxis: r(fm.xAxis),
    yAxis: r(fm.yAxis),
    yAxes: rArr(fm.yAxes),
    label: r(fm.label),
    value: r(fm.value),
    series: r(fm.series),
    columns: rArr(fm.columns),
    columnLabels: rKeys(fm.columnLabels),
    columnFormats: rKeys(fm.columnFormats),
    cellRules: fm.cellRules?.map((c) => ({ ...c, column: r(c.column) as string })),
    recordTitleColumn: r(fm.recordTitleColumn),
    valueColumn: r(fm.valueColumn),
    comparisonColumn: r(fm.comparisonColumn),
    aggregates: fm.aggregates?.map((a) => ({ ...a, column: r(a.column) as string })),
    loopColumn: r(fm.loopColumn),
    paramColumn: r(fm.paramColumn),
  }
}

/**
 * Garantit qu'un bloc data porte `sources[]` + `primarySourceId` + `joins[]`
 * (graphe). Idempotent. Convertit l'ancien `datasetId` (+ anciennes `joins`
 * rattachées à la primaire) et requalifie les refs de colonnes des sources
 * jointes. Ne touche pas les blocs recherche ni les blocs sans source.
 */
export function normalizeBlockSources(block: StudioBlock): StudioBlock {
  // Le bloc recherche garde son modèle propre (searchSources / searchJoins).
  if (block.type === 'search') return block

  // Déjà au nouveau format.
  const existing = block.sources
  if (existing?.length) {
    const primaryId = block.primarySourceId && existing.some((s) => s.id === block.primarySourceId)
      ? block.primarySourceId
      : existing[0]!.id
    if (primaryId === block.primarySourceId) return block
    return { ...block, primarySourceId: primaryId }
  }

  // Pas de source du tout (bloc texte, recherche, formulaire…).
  if (!block.datasetId) return block

  const primaryId = block.datasetId
  const sources: BlockSource[] = [{ id: primaryId, datasetId: primaryId }]
  const joins: BlockJoin[] = []
  const colToSource = new Map<string, string>()

  for (const lj of legacyJoinsOf(block)) {
    if (!lj.datasetId) continue
    const sid = lj.datasetId
    if (!sources.some((s) => s.id === sid)) sources.push({ id: sid, datasetId: sid })
    joins.push({
      leftSourceId: primaryId,
      leftColumn: lj.leftColumn ?? '',
      rightSourceId: sid,
      rightColumn: lj.rightColumn ?? '',
      type: lj.type === 'inner' ? 'inner' : 'left',
    })
    for (const c of lj.columns ?? []) colToSource.set(c, sid)
  }

  return {
    ...block,
    sources,
    primarySourceId: primaryId,
    joins,
    fieldMapping: requalifyMapping(block.fieldMapping, colToSource),
  }
}

/** Datasets référencés par un bloc (sources + fallback legacy). Pour précharger les schémas. */
export function blockDatasetIds(block: StudioBlock): string[] {
  const ids = new Set<string>()
  if (block.datasetId) ids.add(block.datasetId)
  for (const s of block.sources ?? []) if (s.datasetId) ids.add(s.datasetId)
  return [...ids]
}

/** Famille de type pour juger la compatibilité de deux colonnes de clé de jointure. */
function typeFamily(t?: DatasetColumn['type']): string {
  if (t === 'integer' || t === 'float') return 'number'
  if (t === 'date' || t === 'datetime') return 'date'
  return t ?? 'string'
}

/**
 * Devine la paire de colonnes la plus probable pour joindre deux sources :
 * 1. même nom (insensible à la casse) + types compatibles ;
 * 2. un nom contient l'autre (≥ 3 car.) + types compatibles ;
 * sinon `null`.
 */
export function suggestJoinKeys(
  leftCols: Pick<DatasetColumn, 'name' | 'type'>[],
  rightCols: Pick<DatasetColumn, 'name' | 'type'>[],
): { leftColumn: string; rightColumn: string } | null {
  const compatible = (a?: DatasetColumn['type'], b?: DatasetColumn['type']) => typeFamily(a) === typeFamily(b)

  for (const l of leftCols) {
    for (const r of rightCols) {
      if (l.name.toLowerCase() === r.name.toLowerCase() && compatible(l.type, r.type)) {
        return { leftColumn: l.name, rightColumn: r.name }
      }
    }
  }

  let best: { leftColumn: string; rightColumn: string; score: number } | null = null
  for (const l of leftCols) {
    const ln = l.name.toLowerCase()
    for (const r of rightCols) {
      const rn = r.name.toLowerCase()
      if (Math.min(ln.length, rn.length) < 3 || !compatible(l.type, r.type)) continue
      if (ln.includes(rn) || rn.includes(ln)) {
        const score = Math.min(ln.length, rn.length)
        if (!best || score > best.score) best = { leftColumn: l.name, rightColumn: r.name, score }
      }
    }
  }
  return best ? { leftColumn: best.leftColumn, rightColumn: best.rightColumn } : null
}
