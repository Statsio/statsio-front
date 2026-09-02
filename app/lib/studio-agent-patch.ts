import type { useStudioStore } from '@/stores/studio'
import type { AgentPatchOp } from '@/api/ai'
import type { BlockType, FieldMapping, BlockConfig, BlockFilter } from '@/types/studio'
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
  // modèle — une barre de recherche qui déclare automatiquement un paramètre
  // point-barre (fan-out) sur sa page.
  const paramName = op.paramName ? String(op.paramName) : ''
  if (op.isTemplate || paramName) {
    const section = studio.addSection(0)
    const block = studio.addBlock('search', `${section.id}-0`, 0)

    if (op.searchDatasetId != null) studio.updateBlockDataset(block.id, String(op.searchDatasetId))

    const columns = Array.isArray(op.searchColumns) ? op.searchColumns.map(String) : []
    const fieldMapping: Record<string, unknown> = {}
    if (columns.length) fieldMapping.searchColumns = columns
    if (op.resultTitleColumn) fieldMapping.resultTitleParts = [{ ref: String(op.resultTitleColumn) }]
    if (Array.isArray(op.resultDescColumns) && op.resultDescColumns.length) {
      fieldMapping.resultDescParts = op.resultDescColumns.map((c) => ({ ref: String(c) }))
    }
    if (Object.keys(fieldMapping).length) {
      studio.updateBlockFieldMapping(block.id, fieldMapping as Partial<FieldMapping>)
    }

    // Le bloc recherche n'a pas de titre/description propres — seul le placeholder.
    if (op.searchPlaceholder) {
      studio.updateBlockConfig(block.id, { searchPlaceholder: String(op.searchPlaceholder) } as Partial<BlockConfig>)
    }
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
  // `op.layout` (agencement en colonnes) n'est plus porté par la section — ignoré ;
  // ce rôle est désormais celui du bloc « Disposition ».
  const section = studio.addSection(index)
  refs.set(String(op.ref), section.id)

  const patch: Record<string, unknown> = {}
  for (const k of ['kicker', 'title', 'description'] as const) {
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
  // Bloc enfant d'une boucle : `loopRef` désigne le bloc loop ; sinon section (toujours
  // colonne 0 — une section n'a plus qu'une seule colonne, `op.col` est ignoré).
  const zoneId = op.loopRef != null
    ? loopZoneId(resolve(op.loopRef))
    : `${resolve(op.sectionRef)}-0`
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

  if (op.datasetId != null) {
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
  return { ...fm } as Partial<FieldMapping>
}
