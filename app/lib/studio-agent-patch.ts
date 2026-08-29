import type { useStudioStore } from '@/stores/studio'
import type { AgentPatchOp } from '@/api/ai'
import type { BlockType, FieldMapping, BlockConfig, BlockFilter, SectionLayout } from '@/types/studio'
import { loopZoneId } from '@/types/studio'

type StudioStore = ReturnType<typeof useStudioStore>

export interface ApplyPatchResult {
  applied: number
  undoSteps: number
  errors: string[]
}

/**
 * Applique un patch d'ops de l'assistant IA sur le store du Studio.
 *
 * L'agent désigne les nouveaux éléments par une *ref* (« p1 », « s1 », « b1 ») et
 * les éléments existants par leur id réel ; on tient une table ref→id au fil de la
 * création. Tout le patch est encapsulé dans un batch d'historique → une seule
 * annulation le révoque entièrement.
 */
export function applyAgentPatch(ops: AgentPatchOp[], studio: StudioStore): ApplyPatchResult {
  const refs = new Map<string, string>()
  const errors: string[] = []
  let applied = 0

  const resolve = (ref: unknown): string => {
    const key = String(ref ?? '')
    return refs.get(key) ?? key
  }

  studio.beginBatch()
  try {
    for (const op of ops) {
      try {
        switch (op.op) {
          case 'addPage':
            applyAddPage(op, studio, refs)
            break
          case 'addSection':
            applyAddSection(op, studio, refs, resolve)
            break
          case 'addBlock':
            applyAddBlock(op, studio, refs, resolve)
            break
          case 'updateBlock':
            applyUpdateBlock(op, studio, resolve)
            break
          case 'removeBlock':
            studio.removeBlock(resolve(op.blockRef))
            break
          case 'moveBlock':
            studio.moveBlock(resolve(op.blockRef), `${resolve(op.toSectionRef)}-${Number(op.col ?? 0)}`)
            break
          default:
            errors.push(`Op inconnue : ${op.op}`)
            continue
        }
        applied++
      } catch (e) {
        errors.push(`${op.op} : ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  } finally {
    studio.endBatch()
  }

  return { applied, undoSteps: applied > 0 ? 1 : 0, errors }
}

function applyAddPage(op: AgentPatchOp, studio: StudioStore, refs: Map<string, string>) {
  const page = studio.addPage(String(op.title ?? 'Page'), {
    icon: op.icon ? String(op.icon) : undefined,
  })
  refs.set(String(op.ref), page.id)

  // Paramètres déclarés (nouveau modèle).
  for (const raw of Array.isArray(op.params) ? op.params : []) {
    if (!raw || typeof raw !== 'object') continue
    const p = raw as Record<string, unknown>
    if (typeof p.name !== 'string' || !p.name) continue
    studio.addPageParam(page.id, {
      name: p.name,
      column: typeof p.column === 'string' ? p.column : undefined,
      datasetId: p.datasetId != null ? String(p.datasetId) : undefined,
      defaultValue: typeof p.defaultValue === 'string' ? p.defaultValue : undefined,
      slugColumn: typeof p.slugColumn === 'string' ? p.slugColumn : undefined,
      fanOut: p.fanOut === true || undefined,
    })
  }

  // Ancien op « page template » (isTemplate + paramName) : traduit dans le nouveau
  // modèle — un `PageParam` déclaré + une barre de recherche NORMALE qui filtre la page.
  const paramName = op.paramName ? String(op.paramName) : ''
  if ((op.isTemplate || paramName) && paramName) {
    // Colonne identifiante = celle du paramètre (code commune/postal…) → slug d'URL sans ambiguïté.
    const idColumn = op.paramColumn ? String(op.paramColumn) : paramName
    studio.addPageParam(page.id, {
      name: paramName,
      column: idColumn,
      datasetId: op.searchDatasetId != null ? String(op.searchDatasetId) : undefined,
      fanOut: true,
      slugColumn: idColumn,
    })

    const section = studio.addSection('1-col', 0)
    const block = studio.addBlock('search', `${section.id}-0`, 0)

    const fieldMapping: Record<string, unknown> = { targetPageId: page.id }
    if (op.searchDatasetId != null) {
      const columns = Array.isArray(op.searchColumns) ? op.searchColumns.map(String) : []
      fieldMapping.searchSources = [{ datasetId: String(op.searchDatasetId), columns }]
      if (op.resultTitleColumn) fieldMapping.resultTitleColumn = String(op.resultTitleColumn)
      if (Array.isArray(op.resultDescColumns) && op.resultDescColumns.length) {
        fieldMapping.resultDescColumns = op.resultDescColumns.map(String)
      }
      if (op.paramColumn) fieldMapping.urlParams = [String(op.paramColumn)]
    }
    studio.updateBlockFieldMapping(block.id, fieldMapping as Partial<FieldMapping>)

    const config: Record<string, unknown> = {}
    if (op.searchTitle) config.title = String(op.searchTitle)
    if (op.searchPlaceholder) config.searchPlaceholder = String(op.searchPlaceholder)
    if (Object.keys(config).length) studio.updateBlockConfig(block.id, config as Partial<BlockConfig>)
  }
}

function applyAddSection(
  op: AgentPatchOp,
  studio: StudioStore,
  refs: Map<string, string>,
  resolve: (r: unknown) => string,
) {
  studio.switchPage(resolve(op.pageRef))
  const index = typeof op.index === 'number' ? op.index : undefined
  const section = studio.addSection((op.layout as SectionLayout) ?? '1-col', index)
  refs.set(String(op.ref), section.id)

  const patch: Record<string, unknown> = {}
  for (const k of ['kicker', 'title', 'description', 'anchorId'] as const) {
    if (typeof op[k] === 'string' && op[k]) patch[k] = op[k]
  }
  if (op.theme === 'dark' || op.theme === 'accent') patch.theme = op.theme
  if (Object.keys(patch).length) studio.updateSection(section.id, patch)
}

function applyAddBlock(
  op: AgentPatchOp,
  studio: StudioStore,
  refs: Map<string, string>,
  resolve: (r: unknown) => string,
) {
  // Bloc enfant d'une boucle : `loopRef` désigne le bloc loop ; sinon section + colonne.
  const zoneId = op.loopRef != null
    ? loopZoneId(resolve(op.loopRef))
    : `${resolve(op.sectionRef)}-${Number(op.col ?? 0)}`
  const block = studio.addBlock(op.type as BlockType, zoneId)
  refs.set(String(op.ref), block.id)

  if (op.datasetId != null) studio.updateBlockDataset(block.id, String(op.datasetId))
  if (isRecord(op.fieldMapping)) studio.updateBlockFieldMapping(block.id, normalizeFieldMapping(op.fieldMapping))
  if (isRecord(op.config)) studio.updateBlockConfig(block.id, op.config as Partial<BlockConfig>)
  if (Array.isArray(op.filters)) studio.updateBlockFilters(block.id, op.filters as BlockFilter[])
  if (Array.isArray(op.joins)) studio.updateBlockJoins(block.id, op.joins as never[])
}

function applyUpdateBlock(op: AgentPatchOp, studio: StudioStore, resolve: (r: unknown) => string) {
  const id = resolve(op.blockRef)
  const target = studio.blocks.find((b) => b.id === id)
  if (!target) throw new Error(`bloc ${id} introuvable`)
  // Un bloc verrouillé (barre de recherche d'une page template) reste configurable.

  // updateBlockDataset réinitialise le fieldMapping — à éviter sur un bloc `search`
  // (qui garde sa source dans fieldMapping.searchSources, pas dans datasetId).
  if (op.datasetId != null && target.type !== 'search') {
    studio.updateBlockDataset(id, String(op.datasetId))
  }
  if (isRecord(op.fieldMapping)) {
    studio.updateBlockFieldMapping(id, normalizeFieldMapping(op.fieldMapping))
  }
  if (isRecord(op.config)) studio.updateBlockConfig(id, op.config as Partial<BlockConfig>)
  if (Array.isArray(op.filters)) studio.updateBlockFilters(id, op.filters as BlockFilter[])
  if (Array.isArray(op.comparisonFilters)) {
    studio.updateBlockComparisonFilters(id, op.comparisonFilters as BlockFilter[])
  }
  if (Array.isArray(op.joins)) studio.updateBlockJoins(id, op.joins as never[])
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Le modèle renvoie parfois les datasetId en nombre — le store les veut en chaîne. */
function normalizeFieldMapping(fm: Record<string, unknown>): Partial<FieldMapping> {
  const out = { ...fm }
  for (const key of ['searchSources', 'searchJoins'] as const) {
    if (Array.isArray(out[key])) {
      out[key] = (out[key] as Record<string, unknown>[]).map((s) =>
        s && s.datasetId != null ? { ...s, datasetId: String(s.datasetId) } : s,
      )
    }
  }
  return out as Partial<FieldMapping>
}
