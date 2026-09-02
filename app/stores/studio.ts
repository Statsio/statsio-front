import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  StudioBlock,
  StudioContent,
  StudioDocumentPage,
  PageParam,
  BlockType,
  FieldMapping,
  BlockConfig,
  SaveStatus,
  SidebarLeftTab,
  Section,
  SectionLayout,
} from '@/types/studio'
import { SECTION_LAYOUT_DEFINITIONS, scriptZoneId, scriptIdFromZone, scriptZoneBranch, pageZoneId, isPageZone, isScriptBlock, isContainerBlock, FORM_BLOCK_TYPES } from '@/types/studio'
import type { CanvasItemRef } from '@/types/studio'
import { readIfBranches, withAddedBranch, withRemovedBranch } from '@/lib/studio-if'
import { normalizeBlockSources } from '@/lib/studio-block-sources'
import { parseColumnRef } from '@/lib/studio-columns'
import type { BlockSource, BlockJoin } from '@/types/studio'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function getColCount(layout: SectionLayout): number {
  return SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === layout)?.cols ?? 1
}

/**
 * Valeurs initiales de `pageParams` pour une page : la `defaultValue` de chaque
 * paramètre déclaré qui en porte une. Une page sans paramètre → `{}` (comportement
 * historique inchangé).
 */
function defaultParamsForPage(page: StudioDocumentPage | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  for (const p of page?.params ?? []) {
    if (p.name && p.defaultValue != null && p.defaultValue !== '') out[p.name] = p.defaultValue
  }
  return out
}

interface HistoryEntry {
  pages: StudioDocumentPage[]
  sections: Section[]
  blocks: StudioBlock[]
}

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val))
}

const MAX_HISTORY = 50

export const useStudioStore = defineStore('studio', () => {
  // ─── State ──────────────────────────────────────────────────────────────────

  const content = ref<StudioContent | null>(null)
  const pages = ref<StudioDocumentPage[]>([{ id: 'default', title: 'Page 1' }])
  const currentPageId = ref<string>('default')
  const pageParams = ref<Record<string, string>>({})
  const sections = ref<Section[]>([{ id: uid(), layout: '1-col', pageId: 'default' }])
  const blocks = ref<StudioBlock[]>([])

  const selectedBlockId = ref<string | null>(null)
  const saveStatus = ref<SaveStatus>('idle')
  const activeLeftTab = ref<SidebarLeftTab>('blocks')
  const isPanelOpen = ref(false)
  const isSidebarRightOpen = ref(false)
  const isDirty = ref(false)
  const dirtyVersion = ref(0)
  /** Aperçu : canevas en lecture seule, chrome d'édition masqué. */
  const isPreview = ref(false)

  // ─── History (undo/redo) ─────────────────────────────────────────────────────

  const past = ref<HistoryEntry[]>([])
  const future = ref<HistoryEntry[]>([])

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  // Batch : coalesce plusieurs mutations (ex. un run de l'assistant IA) en une
  // seule entrée d'historique → « Annuler ces changements » = un seul Ctrl+Z.
  let batchDepth = 0
  let batchSnapshotTaken = false

  function beginBatch() {
    batchDepth++
    batchSnapshotTaken = false
  }

  function endBatch() {
    batchDepth = Math.max(0, batchDepth - 1)
  }

  // Call BEFORE applying a mutation to save the current state
  function snapshot() {
    if (batchDepth > 0) {
      if (batchSnapshotTaken) return
      batchSnapshotTaken = true
    }
    past.value = [
      ...past.value.slice(-(MAX_HISTORY - 1)),
      { pages: deepClone(pages.value), sections: deepClone(sections.value), blocks: deepClone(blocks.value) },
    ]
    future.value = []
  }

  function undo() {
    const prev = past.value[past.value.length - 1]
    if (!prev) return
    future.value = [
      ...future.value,
      { pages: deepClone(pages.value), sections: deepClone(sections.value), blocks: deepClone(blocks.value) },
    ]
    past.value = past.value.slice(0, -1)
    pages.value = prev.pages
    sections.value = prev.sections
    blocks.value = prev.blocks
    if (!pages.value.find((p: StudioDocumentPage) => p.id === currentPageId.value)) {
      currentPageId.value = pages.value[0]?.id ?? 'default'
    }
    selectedBlockId.value = null
    selectedSectionId.value = null
    isSidebarRightOpen.value = false
    markDirty()
  }

  function redo() {
    const next = future.value[future.value.length - 1]
    if (!next) return
    past.value = [
      ...past.value.slice(-(MAX_HISTORY - 1)),
      { pages: deepClone(pages.value), sections: deepClone(sections.value), blocks: deepClone(blocks.value) },
    ]
    future.value = future.value.slice(0, -1)
    pages.value = next.pages
    sections.value = next.sections
    blocks.value = next.blocks
    if (!pages.value.find((p: StudioDocumentPage) => p.id === currentPageId.value)) {
      currentPageId.value = pages.value[0]?.id ?? 'default'
    }
    selectedBlockId.value = null
    selectedSectionId.value = null
    isSidebarRightOpen.value = false
    markDirty()
  }

  // ─── Computed ────────────────────────────────────────────────────────────────

  const currentPage = computed<StudioDocumentPage | undefined>(
    () => pages.value.find((p: StudioDocumentPage) => p.id === currentPageId.value),
  )

  const currentPageSections = computed<Section[]>(
    () => sections.value.filter((s: Section) => (s.pageId ?? 'default') === currentPageId.value),
  )

  /** Sections racine de la page courante (pas nichées dans la zone d'un bloc de script de page). */
  const currentPageTopLevelSections = computed<Section[]>(
    () => currentPageSections.value.filter((s: Section) => !s.zoneId),
  )

  /** Sections nichées dans une zone de bloc de script (`scriptZoneId(blockId, branch)`), dans l'ordre du tableau. */
  function sectionsInZone(zoneId: string): Section[] {
    return sections.value.filter((s: Section) => s.zoneId === zoneId)
  }

  /**
   * Éléments de premier niveau du flux de la page courante — sections racine +
   * blocs `loop`/`if` posés au niveau page — dans l'ordre de `currentPage.canvas`.
   * Repli sur l'ordre des sections racine quand `canvas` est absent ; complète en
   * fin toute section / bloc de page manquant (robustesse + docs existants).
   */
  const currentPageCanvasItems = computed<Array<{ ref: CanvasItemRef; section?: Section; block?: StudioBlock }>>(() => {
    const rootSections = currentPageTopLevelSections.value
    const zone = pageZoneId(currentPageId.value)
    const pageBlocks = blocks.value.filter((b: StudioBlock) => b.zoneId === zone)
    const bySection = new Map(rootSections.map((s) => [s.id, s]))
    const byBlock = new Map(pageBlocks.map((b) => [b.id, b]))

    const out: Array<{ ref: CanvasItemRef; section?: Section; block?: StudioBlock }> = []
    const seen = new Set<string>()
    for (const ref of currentPage.value?.canvas ?? []) {
      const key = `${ref.kind}:${ref.id}`
      if (seen.has(key)) continue
      if (ref.kind === 'section' && bySection.has(ref.id)) {
        out.push({ ref, section: bySection.get(ref.id) }); seen.add(key)
      } else if (ref.kind === 'block' && byBlock.has(ref.id)) {
        out.push({ ref, block: byBlock.get(ref.id) }); seen.add(key)
      }
    }
    for (const s of rootSections) {
      if (!seen.has(`section:${s.id}`)) out.push({ ref: { kind: 'section', id: s.id }, section: s })
    }
    for (const b of pageBlocks) {
      if (!seen.has(`block:${b.id}`)) out.push({ ref: { kind: 'block', id: b.id }, block: b })
    }
    return out
  })

  const selectedBlock = computed<StudioBlock | null>(() => {
    if (!selectedBlockId.value) return null
    return blocks.value.find((b: StudioBlock) => b.id === selectedBlockId.value) ?? null
  })

  const selectedSectionId = ref<string | null>(null)
  const selectedSection = computed<Section | null>(
    () => sections.value.find((s: Section) => s.id === selectedSectionId.value) ?? null,
  )

  function selectSection(sectionId: string | null) {
    selectedSectionId.value = sectionId
    if (sectionId) selectedBlockId.value = null
    isSidebarRightOpen.value = sectionId !== null
  }

  function updateSection(sectionId: string, patch: Partial<Omit<Section, 'id'>>) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (!section) return
    snapshot()
    Object.assign(section, patch)
    markDirty()
  }

  // Zone IDs derived from sections: `${sectionId}-${colIndex}`
  // Plus one zone per script block: a `loop` has `loop:${blockId}:0`, an `if` has
  // one zone per branch (`loop:${blockId}:${branchIndex}`).
  const blocksByZone = computed<Record<string, StudioBlock[]>>(() => {
    const map: Record<string, StudioBlock[]> = {}
    for (const page of pages.value) {
      // Zone racine de page : accueille les blocs `loop`/`if` posés hors des sections.
      map[pageZoneId(page.id)] = []
    }
    for (const section of sections.value) {
      const cols = getColCount(section.layout)
      for (let i = 0; i < cols; i++) {
        map[`${section.id}-${i}`] = []
      }
    }
    for (const block of blocks.value) {
      if (block.type === 'if') {
        const branchCount = Math.max(1, readIfBranches(block.config).length)
        for (let i = 0; i < branchCount; i++) map[scriptZoneId(block.id, i)] ??= []
      } else if (block.type === 'layout') {
        const cols = getColCount(block.config.layoutType ?? '2-cols')
        for (let i = 0; i < cols; i++) map[scriptZoneId(block.id, i)] ??= []
      } else if (isScriptBlock(block.type)) {
        map[scriptZoneId(block.id)] ??= []
      }
    }
    for (const block of blocks.value) {
      if (!map[block.zoneId]) map[block.zoneId] = []
      map[block.zoneId]!.push(block)
    }
    return map
  })

  /** Ids des blocs enfants (directs + descendants) d'un bloc de script — toutes branches confondues. */
  function loopChildIds(scriptBlockId: string): string[] {
    const out: string[] = []
    const stack = [scriptBlockId]
    while (stack.length) {
      const parentId = stack.pop()!
      for (const b of blocks.value) {
        if (scriptIdFromZone(b.zoneId) === parentId) {
          out.push(b.id)
          if (isContainerBlock(b.type)) stack.push(b.id)
        }
      }
    }
    return out
  }

  /** Blocs de script englobant `blockId`, du plus proche au plus lointain. */
  function loopAncestors(blockId: string): StudioBlock[] {
    const out: StudioBlock[] = []
    let current = blocks.value.find((b: StudioBlock) => b.id === blockId)
    const guard = new Set<string>()
    while (current) {
      const parentId = scriptIdFromZone(current.zoneId)
      if (!parentId || guard.has(parentId)) break
      guard.add(parentId)
      const parent = blocks.value.find((b: StudioBlock) => b.id === parentId && isContainerBlock(b.type))
      if (!parent) break
      out.push(parent)
      current = parent
    }
    return out
  }

  /**
   * Dans une zone de script (`loop:` / `if:`) on autorise tout SAUF `search`,
   * `param` et les blocs de formulaire. Le script imbriqué (loop/if dans loop/if)
   * est permis.
   */
  function canPlaceInZone(type: BlockType, zoneId: string): boolean {
    // Zone racine de page : uniquement des blocs de script (répètent / conditionnent des sections).
    if (isPageZone(zoneId)) return type === 'loop' || type === 'if'
    if (!zoneId.startsWith('loop:')) return true
    return type !== 'search' && type !== 'param' && !FORM_BLOCK_TYPES.includes(type)
  }

  // ─── Migration : pages « template » → page normale + paramètre ───────────────
  // Plan Statsdata v2 : plus qu'un seul type de page. Une page `isTemplate` est
  // convertie en page normale portant un `PageParam` (avec `fanOut` pour la
  // génération d'URL par valeur — Phase 2). Idempotent, sans effet sur une page
  // déjà normale.

  function migrateLegacyTemplatePages() {
    for (const page of pages.value) {
      if (!page.isTemplate) continue

      const feedingSearch = blocks.value.find(
        (b: StudioBlock) => b.type === 'search' && b.fieldMapping.targetPageId === page.id,
      )
      const src = feedingSearch?.fieldMapping.searchSources?.[0]
      // Colonne identifiante (unique) : celle qui pilotait les filtres `{{param}}`.
      // On l'utilise aussi pour l'URL fan-out — un slug de code postal / code commune
      // est sans ambiguïté (deux « Grigny » n'ont pas le même code).
      const idColumn =
        page.paramName ||
        feedingSearch?.fieldMapping.urlParams?.[0] ||
        feedingSearch?.fieldMapping.resultTitleColumn ||
        src?.columns?.[0]

      if (idColumn) {
        const decl: PageParam = {
          name: idColumn,
          column: idColumn,
          datasetId: src?.datasetId ?? feedingSearch?.datasetId,
          defaultValue: undefined,
          fanOut: true,
          slugColumn: idColumn,
        }
        page.params = [decl, ...(page.params ?? []).filter((p) => p.name !== idColumn)]
      }

      page.isTemplate = undefined
      page.paramName = undefined
    }

    // Les sections/blocs verrouillés n'existaient que pour la barre de recherche
    // auto-provisionnée des pages template — plus de raison de les figer.
    for (const s of sections.value) if (s.locked) s.locked = undefined
    for (const b of blocks.value) if (b.locked) b.locked = undefined
  }

  // ─── Migration : sections multi-colonnes → bloc « Disposition » ─────────────
  // Une section ne porte plus de mise en page en colonnes (toujours `1-col`) : les
  // anciennes sections `2-cols`/`3-cols`/… sont converties en une section 1-col
  // contenant un unique bloc `layout` qui reprend l'agencement et les blocs des
  // anciennes colonnes. Idempotent (ne touche pas les sections déjà `1-col`).

  function migrateMultiColumnSections() {
    for (const section of sections.value) {
      if (section.layout === '1-col') continue

      const layoutBlock: StudioBlock = {
        id: uid(),
        type: 'layout',
        zoneId: `${section.id}-0`,
        fieldMapping: {},
        config: { title: '', layoutType: section.layout },
      }

      const prefix = `${section.id}-`
      for (const b of blocks.value) {
        if (!b.zoneId.startsWith(prefix)) continue
        const colIdx = parseInt(b.zoneId.slice(prefix.length), 10)
        if (Number.isNaN(colIdx)) continue
        b.zoneId = scriptZoneId(layoutBlock.id, colIdx)
      }

      blocks.value.push(layoutBlock)
      section.layout = '1-col'
    }
  }

  // ─── Page init ───────────────────────────────────────────────────────────────

  function initPage(
    pageContent: StudioContent,
    pageSections?: Section[],
    pageBlocks?: StudioBlock[],
    documentPages?: StudioDocumentPage[],
  ) {
    content.value = pageContent

    if (documentPages && documentPages.length > 0) {
      pages.value = documentPages
    } else {
      pages.value = [{ id: 'default', title: 'Page 1' }]
    }
    currentPageId.value = pages.value[0]?.id ?? 'default'

    // Migrate sections without pageId to the first page
    const defaultPageId = pages.value[0]?.id ?? 'default'
    sections.value = (pageSections ?? [{ id: uid(), layout: '1-col', pageId: defaultPageId }]).map((s) => ({
      ...s,
      pageId: s.pageId ?? defaultPageId,
    }))

    blocks.value = (pageBlocks ?? []).map(normalizeBlockSources)

    migrateLegacyTemplatePages()
    migrateMultiColumnSections()
    pageParams.value = defaultParamsForPage(pages.value.find((p) => p.id === currentPageId.value))

    selectedBlockId.value = null
    selectedSectionId.value = null
    saveStatus.value = 'idle'
    isDirty.value = false
    dirtyVersion.value = 0
    past.value = []
    future.value = []
  }

  function setTitle(title: string) {
    if (!content.value) return
    content.value.title = title
    markDirty()
  }

  // ─── Sections ────────────────────────────────────────────────────────────────

  /** Refs actuelles du flux de la page courante — sert à matérialiser `page.canvas`. */
  function currentCanvasRefs(): CanvasItemRef[] {
    return currentPageCanvasItems.value.map((i) => i.ref)
  }
  function insertCanvasRef(ref: CanvasItemRef, atIndex?: number) {
    const page = currentPage.value
    if (!page) return
    // Matérialise depuis l'ordre courant EN EXCLUANT l'élément qu'on insère
    // (l'auto-complétion de `currentPageCanvasItems` l'a déjà mis en fin).
    const base = (page.canvas ?? currentCanvasRefs()).filter((r) => !(r.kind === ref.kind && r.id === ref.id))
    if (atIndex !== undefined && atIndex >= 0 && atIndex <= base.length) base.splice(atIndex, 0, ref)
    else base.push(ref)
    page.canvas = base
  }
  function dropCanvasRef(kind: CanvasItemRef['kind'], id: string) {
    const canvas = currentPage.value?.canvas
    if (canvas) currentPage.value!.canvas = canvas.filter((r) => !(r.kind === kind && r.id === id))
  }

  /**
   * `zoneId` : insère la section dans la zone d'un bloc de script de page
   * (`scriptZoneId(blockId, branch)`) plutôt qu'à la racine — `atIndex` se lit
   * alors parmi les sections de cette zone (défaut : à la fin). Sans `zoneId`,
   * insertion au niveau page ; `atIndex` = position dans le tableau `sections.value`
   * (bas niveau — l'ordre du flux visible passe par `page.canvas`). Toujours
   * `layout: '1-col'` (colonnes portées par le bloc « Disposition »).
   */
  function addSection(atIndex?: number, locked?: boolean, zoneId?: string): Section {
    snapshot()
    const section: Section = { id: uid(), layout: '1-col', pageId: currentPageId.value, locked, zoneId }
    if (zoneId) {
      const siblings = sectionsInZone(zoneId)
      const useAt = atIndex !== undefined && atIndex < siblings.length
      const anchor = useAt ? siblings[atIndex] : siblings[siblings.length - 1]
      if (anchor) {
        const at = sections.value.findIndex((s: Section) => s.id === anchor.id)
        sections.value.splice(useAt ? at : at + 1, 0, section)
      } else {
        sections.value.push(section)
      }
    } else if (atIndex !== undefined) {
      sections.value.splice(atIndex, 0, section)
    } else {
      sections.value.push(section)
    }
    markDirty()
    return section
  }

  /** Ajoute une section racine à la position `atIndex` du flux de la page (drag depuis le canevas). */
  function addSectionInFlow(atIndex?: number): Section {
    const section = addSection()
    insertCanvasRef({ kind: 'section', id: section.id }, atIndex)
    markDirty()
    return section
  }

  /**
   * Ajoute un bloc `loop`/`if` au niveau page (hors des sections) : répète ou
   * conditionne des sections entières. `atIndex` = position dans le flux de la page.
   */
  function addPageBlock(type: 'loop' | 'if', atIndex?: number): StudioBlock {
    const block = addBlock(type, pageZoneId(currentPageId.value))
    insertCanvasRef({ kind: 'block', id: block.id }, atIndex)
    markDirty()
    return block
  }

  /** Repositionne le groupe de sections d'une zone dans `sections.value`, dans l'ordre voulu (sans snapshot). */
  function applyZoneOrder(zoneId: string, orderIds: string[]) {
    const byId = new Map(sections.value.map((s) => [s.id, s]))
    const ordered = orderIds.map((id) => byId.get(id)).filter((s): s is Section => !!s).map((s) => ({ ...s, zoneId }))
    const kept = sections.value.filter((s: Section) => s.zoneId !== zoneId)
    const firstRemovedIdx = sections.value.findIndex((s: Section) => s.zoneId === zoneId)
    let at = kept.length
    if (firstRemovedIdx !== -1) {
      at = sections.value.slice(0, firstRemovedIdx).filter((s: Section) => s.zoneId !== zoneId).length
    }
    kept.splice(at, 0, ...ordered)
    sections.value = kept
  }

  /** Réordonne les sections d'une zone de bloc de script (drag & drop interne). */
  function reorderSectionZone(zoneId: string, newOrder: Section[]) {
    snapshot()
    applyZoneOrder(zoneId, newOrder.map((s) => s.id))
    markDirty()
  }

  /** Déplace une section (racine ou autre zone) DANS une zone de bloc de script, à l'index voulu. */
  function moveSectionToZone(sectionId: string, zoneId: string, atIndex: number) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (!section || section.zoneId === zoneId) return
    snapshot()
    dropCanvasRef('section', sectionId)
    const others = sectionsInZone(zoneId).filter((s) => s.id !== sectionId).map((s) => s.id)
    const at = Math.max(0, Math.min(atIndex, others.length))
    others.splice(at, 0, sectionId)
    section.zoneId = zoneId
    applyZoneOrder(zoneId, others)
    markDirty()
  }

  /** Sort une section d'une zone de script pour la remettre à la racine de la page, à l'index de flux voulu. */
  function moveSectionToFlow(sectionId: string, atFlowIndex: number) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (!section) return
    snapshot()
    section.zoneId = undefined
    insertCanvasRef({ kind: 'section', id: sectionId }, atFlowIndex)
    markDirty()
  }

  /** Réécrit l'ordre du flux de premier niveau de la page courante. */
  function reorderPageCanvas(newItems: CanvasItemRef[]) {
    const page = currentPage.value
    if (!page) return
    snapshot()
    page.canvas = [...newItems]
    markDirty()
  }

  /** Réordonne les sections racine de la page courante (compat — le canevas passe par `reorderPageCanvas`). */
  function reorderCurrentPageSections(newTopLevelOrder: Section[]) {
    snapshot()
    const otherSections = sections.value.filter((s: Section) => (s.pageId ?? 'default') !== currentPageId.value)
    const currentPageOriginal = sections.value.filter((s: Section) => (s.pageId ?? 'default') === currentPageId.value)
    const currentTopOriginal = currentPageOriginal.filter((s: Section) => !s.zoneId)
    const nested = currentPageOriginal.filter((s: Section) => s.zoneId)

    const currentNonLocked = newTopLevelOrder.filter((s) => !s.locked)
    const mergedTop: Section[] = []
    let idx = 0
    for (const orig of currentTopOriginal) {
      if (orig.locked) mergedTop.push(orig)
      else if (idx < currentNonLocked.length) mergedTop.push(currentNonLocked[idx++]!)
    }
    while (idx < currentNonLocked.length) mergedTop.push(currentNonLocked[idx++]!)

    sections.value = [...otherSections, ...mergedTop, ...nested]
    if (currentPage.value?.canvas) {
      const order = new Map(mergedTop.map((s, i) => [s.id, i]))
      currentPage.value.canvas = [...currentPage.value.canvas].sort((a, b) => {
        const av = a.kind === 'section' ? order.get(a.id) ?? Infinity : Infinity
        const bv = b.kind === 'section' ? order.get(b.id) ?? Infinity : Infinity
        return av - bv
      })
    }
    markDirty()
  }

  function removeSection(sectionId: string) {
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (section?.locked) return
    snapshot()
    sections.value = sections.value.filter((s: Section) => s.id !== sectionId)
    dropCanvasRef('section', sectionId)
    if (selectedSectionId.value === sectionId) {
      selectedSectionId.value = null
      isSidebarRightOpen.value = false
    }
    const removed = new Set<string>()
    for (const b of blocks.value) {
      if (!b.zoneId?.startsWith(`${sectionId}-`)) continue
      removed.add(b.id)
      if (isContainerBlock(b.type)) loopChildIds(b.id).forEach((id) => removed.add(id))
    }
    blocks.value = blocks.value.filter((b: StudioBlock) => !removed.has(b.id))
    if (selectedBlockId.value) {
      const stillExists = blocks.value.find((b: StudioBlock) => b.id === selectedBlockId.value)
      if (!stillExists) {
        selectedBlockId.value = null
        isSidebarRightOpen.value = false
      }
    }
    markDirty()
  }

  function reorderSections(newOrder: Section[]) {
    snapshot()
    // Keep locked sections in their original relative positions, only reorder non-locked ones
    const originalLocked = sections.value.filter(s => s.locked)
    const newNonLocked = newOrder.filter(s => !s.locked)
    
    // Create a map of locked section IDs to their original indices
    const lockedPositions = new Map<string, number>()
    originalLocked.forEach((s, idx) => lockedPositions.set(s.id, idx))
    
    // Merge locked sections (in original order) with non-locked sections (in new order), keeping locked in their original relative positions
    const result: Section[] = []
    let nonLockedIndex = 0
    
    // Iterate through original sections, inserting locked sections in original place and non-locked in new order
    for (const originalSection of sections.value) {
      if (originalSection.locked) {
        result.push(originalSection)
      } else if (nonLockedIndex < newNonLocked.length) {
        result.push(newNonLocked[nonLockedIndex++]!)
      }
    }
    // Add any remaining non-locked sections (shouldn't happen, but just in case)
    while (nonLockedIndex < newNonLocked.length) {
      result.push(newNonLocked[nonLockedIndex++]!)
    }
    
    sections.value = result
    markDirty()
  }

  // ─── Pages ───────────────────────────────────────────────────────────────────

  function addPage(title: string, options: { isTemplate?: boolean; paramName?: string; description?: string; icon?: string } = {}): StudioDocumentPage {
    snapshot()
    const page: StudioDocumentPage = {
      id: uid(),
      title,
      slug: title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: options.description,
      isTemplate: options.isTemplate,
      paramName: options.paramName,
      icon: options.icon,
    }
    pages.value.push(page)
    currentPageId.value = page.id
    pageParams.value = defaultParamsForPage(page)
    selectedBlockId.value = null
    selectedSectionId.value = null
    isSidebarRightOpen.value = false
    markDirty()
    return page
  }

  function updatePage(pageId: string, patch: Partial<Omit<StudioDocumentPage, 'id'>>) {
    const page = pages.value.find((p: StudioDocumentPage) => p.id === pageId)
    if (!page) return
    snapshot()
    Object.assign(page, patch)
    markDirty()
  }

  function switchPage(pageId: string) {
    const page = pages.value.find((p: StudioDocumentPage) => p.id === pageId)
    if (!page) return
    currentPageId.value = pageId
    pageParams.value = defaultParamsForPage(page)
    selectedBlockId.value = null
    selectedSectionId.value = null
    isSidebarRightOpen.value = false
  }

  // Like switchPage but keeps existing pageParams (used when URL navigation already set them)
  function switchPageKeepParams(pageId: string) {
    if (!pages.value.find((p: StudioDocumentPage) => p.id === pageId)) return
    currentPageId.value = pageId
    selectedBlockId.value = null
    isSidebarRightOpen.value = false
  }

  function removePage(pageId: string) {
    if (pages.value.length <= 1) return
    snapshot()
    // Remove blocks that belong to sections of this page
    const pageSectionIds = sections.value
      .filter((s: Section) => (s.pageId ?? 'default') === pageId)
      .map((s: Section) => s.id)
    const removedFromPage = new Set<string>()
    for (const b of blocks.value) {
      const sectionId = b.zoneId?.split('-').slice(0, -1).join('-') ?? ''
      if (!pageSectionIds.includes(sectionId)) continue
      removedFromPage.add(b.id)
      if (isContainerBlock(b.type)) loopChildIds(b.id).forEach((id) => removedFromPage.add(id))
    }
    blocks.value = blocks.value.filter((b: StudioBlock) => !removedFromPage.has(b.id))
    sections.value = sections.value.filter((s: Section) => (s.pageId ?? 'default') !== pageId)
    pages.value = pages.value.filter((p: StudioDocumentPage) => p.id !== pageId)
    if (currentPageId.value === pageId) {
      currentPageId.value = pages.value[0]?.id ?? 'default'
      pageParams.value = defaultParamsForPage(pages.value[0])
      selectedBlockId.value = null
      isSidebarRightOpen.value = false
    }
    markDirty()
  }

  function setPageParam(name: string, value: string) {
    pageParams.value = { ...pageParams.value, [name]: value }
  }

  function setPageParams(params: Record<string, string>) {
    pageParams.value = { ...params }
  }

  function clearPageParams() {
    pageParams.value = {}
  }

  // ─── Page parameters (déclarations) ──────────────────────────────────────────
  // Une page porte une liste de `PageParam` (nom + source + valeur par défaut).
  // Les blocs les référencent via `{{nom}}` ; `pageParams` (les valeurs courantes)
  // est réamorcé avec les `defaultValue` à chaque `switchPage` / `initPage`.

  const currentPageParamDefs = computed<PageParam[]>(() => currentPage.value?.params ?? [])

  /** Vrai si au moins un paramètre de la page courante a une valeur qui diffère de son défaut. */
  const hasActivePageFilters = computed(() =>
    Object.entries(pageParams.value).some(([name, value]) => {
      if (!value) return false
      const def = currentPage.value?.params?.find((p) => p.name === name)
      return value !== (def?.defaultValue ?? '')
    }),
  )

  /** Réapplique les valeurs par défaut de la page courante à `pageParams` sans effacer les autres clés. */
  function seedCurrentPageParamDefaults() {
    const defaults = defaultParamsForPage(currentPage.value)
    const next = { ...pageParams.value }
    for (const [k, v] of Object.entries(defaults)) {
      if (next[k] == null || next[k] === '') next[k] = v
    }
    pageParams.value = next
  }

  function addPageParam(pageId: string, param: PageParam) {
    const page = pages.value.find((p: StudioDocumentPage) => p.id === pageId)
    if (!page || !param.name) return
    if ((page.params ?? []).some((p) => p.name === param.name)) return
    snapshot()
    page.params = [...(page.params ?? []), { ...param }]
    if (pageId === currentPageId.value) seedCurrentPageParamDefaults()
    markDirty()
  }

  function updatePageParam(pageId: string, name: string, patch: Partial<PageParam>) {
    const page = pages.value.find((p: StudioDocumentPage) => p.id === pageId)
    const existing = page?.params?.find((p) => p.name === name)
    if (!page || !existing) return
    snapshot()
    const prevDefault = existing.defaultValue
    page.params = page.params!.map((p) => (p.name === name ? { ...p, ...patch } : p))
    if (pageId === currentPageId.value) {
      // Si l'auteur change la valeur par défaut et que le paramètre courant est
      // encore « au défaut » (jamais changé à la main), on suit la nouvelle valeur.
      const cur = pageParams.value[name]
      if ('defaultValue' in patch && (cur == null || cur === '' || cur === prevDefault)) {
        const next = { ...pageParams.value }
        if (patch.defaultValue != null && patch.defaultValue !== '') next[name] = patch.defaultValue
        else delete next[name]
        pageParams.value = next
      }
      seedCurrentPageParamDefaults()
    }
    markDirty()
  }

  function removePageParam(pageId: string, name: string) {
    const page = pages.value.find((p: StudioDocumentPage) => p.id === pageId)
    if (!page?.params?.some((p) => p.name === name)) return
    snapshot()
    page.params = page.params.filter((p) => p.name !== name)
    if (pageId === currentPageId.value) {
      const next = { ...pageParams.value }
      delete next[name]
      pageParams.value = next
    }
    markDirty()
  }

  // ─── Blocks ──────────────────────────────────────────────────────────────────

  const TEXT_DEFAULTS: Partial<Record<BlockType, object>> = {
    heading:   { content: '<h2></h2>', headingLevel: 2, textAlign: 'left' },
    paragraph: { content: '<p></p>', textAlign: 'left' },
    quote:     { content: '<p></p>', textAlign: 'left' },
    callout:   { content: '<p></p>', textAlign: 'left', calloutColor: '#eff6ff' },
  }

  const FORM_DEFAULTS: Partial<Record<BlockType, object>> = {
    choice:     { formOptions: ['Option 1', 'Option 2'] },
    checkboxes: { formOptions: ['Option 1', 'Option 2'] },
    dropdown:   { formOptions: ['Option 1', 'Option 2'] },
    scale:      { scaleMin: 1, scaleMax: 5 },
    rating:     { ratingMax: 5 },
    'sd-embed': { showSourceLink: true },
    layout:     { layoutType: '2-cols' },
  }

  /** Zone de la première colonne de la dernière section de la page courante (en crée une au besoin). */
  function fallbackZoneId(): string {
    const pageSections = sections.value.filter(
      (s: Section) => (s.pageId ?? 'default') === currentPageId.value && !s.zoneId,
    )
    const last = pageSections[pageSections.length - 1]
    if (last) return `${last.id}-0`
    return `${addSection().id}-0`
  }

  function addBlock(type: BlockType, zoneId: string, atIndex?: number, locked?: boolean): StudioBlock {
    // Zone de boucle : un bloc loop / recherche / formulaire n'y est pas autorisé →
    // on le place dans une section normale plutôt que de créer un bloc invalide.
    if (!canPlaceInZone(type, zoneId)) {
      zoneId = fallbackZoneId()
      atIndex = undefined
    }
    snapshot()
    const block: StudioBlock = {
      id: uid(),
      type,
      zoneId,
      locked: locked || undefined,
      fieldMapping: {},
      config: { title: '', ...TEXT_DEFAULTS[type], ...FORM_DEFAULTS[type] },
    }

    if (atIndex !== undefined) {
      const zoneBlockIds = blocks.value.filter((b: StudioBlock) => b.zoneId === zoneId).map((b: StudioBlock) => b.id)
      if (atIndex < zoneBlockIds.length) {
        const flatIdx = blocks.value.findIndex((b: StudioBlock) => b.id === zoneBlockIds[atIndex])
        if (flatIdx >= 0) {
          blocks.value.splice(flatIdx, 0, block)
        } else {
          blocks.value.push(block)
        }
      } else {
        blocks.value.push(block)
      }
    } else {
      blocks.value.push(block)
    }

    selectedBlockId.value = block.id
    isSidebarRightOpen.value = true
    markDirty()
    return block
  }

  /**
   * Ajoute un bloc sans drag & drop (clic sur une carte du panneau « Éléments »).
   * Cible : la zone du bloc sélectionné, sinon la première zone de la dernière
   * section de la page courante, sinon une nouvelle section 1-col.
   */
  function addBlockSmart(type: BlockType): StudioBlock {
    const selected = selectedBlock.value
    if (selected) return addBlock(type, selected.zoneId)

    const pageSections = sections.value.filter(
      (s: Section) => (s.pageId ?? 'default') === currentPageId.value && !s.zoneId,
    )
    const lastSection = pageSections[pageSections.length - 1]
    if (lastSection) return addBlock(type, `${lastSection.id}-0`)

    const section = addSection()
    return addBlock(type, `${section.id}-0`)
  }

  /**
   * Descendants d'un bloc conteneur — blocs **et** sections nichées (cas d'un
   * bloc `loop`/`if` de page dont les zones portent des sections). Marche
   * récursive blocs↔sections (zones de script + colonnes `${sectionId}-`).
   */
  function scriptDescendants(blockId: string): { blocks: Set<string>; sections: Set<string> } {
    const outBlocks = new Set<string>()
    const outSections = new Set<string>()
    const blockStack = [blockId]
    const sectionStack: string[] = []
    while (blockStack.length || sectionStack.length) {
      if (blockStack.length) {
        const bid = blockStack.pop()!
        for (const b of blocks.value) {
          if (scriptIdFromZone(b.zoneId) === bid && !outBlocks.has(b.id)) {
            outBlocks.add(b.id)
            if (isContainerBlock(b.type)) blockStack.push(b.id)
          }
        }
        for (const s of sections.value) {
          if (s.zoneId && scriptIdFromZone(s.zoneId) === bid && !outSections.has(s.id)) {
            outSections.add(s.id)
            sectionStack.push(s.id)
          }
        }
      } else {
        const sid = sectionStack.pop()!
        for (const b of blocks.value) {
          if (b.zoneId.startsWith(`${sid}-`) && !outBlocks.has(b.id)) {
            outBlocks.add(b.id)
            if (isContainerBlock(b.type)) blockStack.push(b.id)
          }
        }
      }
    }
    return { blocks: outBlocks, sections: outSections }
  }

  function removeBlock(blockId: string) {
    const target = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (target?.locked) return
    snapshot()
    const toRemove = new Set<string>([blockId])
    let sectionsToRemove = new Set<string>()
    if (target && isContainerBlock(target.type)) {
      const d = scriptDescendants(blockId)
      d.blocks.forEach((id) => toRemove.add(id))
      sectionsToRemove = d.sections
    }
    blocks.value = blocks.value.filter((b: StudioBlock) => !toRemove.has(b.id))
    if (sectionsToRemove.size) sections.value = sections.value.filter((s: Section) => !sectionsToRemove.has(s.id))
    dropCanvasRef('block', blockId)
    if (selectedBlockId.value === blockId) {
      selectedBlockId.value = null
      isSidebarRightOpen.value = false
    }
    markDirty()
  }

  function duplicateBlock(blockId: string): StudioBlock | null {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block || block.locked) return null

    snapshot()
    const clone: StudioBlock = { ...deepClone(block), id: uid(), locked: undefined }
    const originalIdx = blocks.value.findIndex((b: StudioBlock) => b.id === blockId)
    const inserts: StudioBlock[] = [clone]

    // Bloc conteneur (loop / if / layout) : cloner aussi ses enfants et les rattacher à la zone du clone.
    if (isContainerBlock(block.type)) {
      const idMap = new Map<string, string>([[blockId, clone.id]])
      for (const childId of loopChildIds(blockId)) {
        const child = blocks.value.find((b: StudioBlock) => b.id === childId)
        if (!child) continue
        const newId = uid()
        idMap.set(childId, newId)
        const parentOldId = scriptIdFromZone(child.zoneId)!
        inserts.push({
          ...deepClone(child),
          id: newId,
          locked: undefined,
          zoneId: scriptZoneId(idMap.get(parentOldId) ?? clone.id, scriptZoneBranch(child.zoneId)),
        })
      }
    }

    blocks.value.splice(originalIdx + 1, 0, ...inserts)

    selectedBlockId.value = clone.id
    isSidebarRightOpen.value = true
    markDirty()
    return clone
  }

  function selectBlock(blockId: string | null) {
    selectedBlockId.value = blockId
    if (blockId) selectedSectionId.value = null
    isSidebarRightOpen.value = blockId !== null
  }

  function moveBlock(blockId: string, toZoneId: string) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.zoneId = toZoneId
    markDirty()
  }

  /** Réordonne un bloc à l'intérieur de sa zone (flèches ↑/↓ de la barre d'outils du bloc). */
  function moveBlockWithinZone(blockId: string, dir: -1 | 1) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    const zoneBlocks = blocks.value.filter((b: StudioBlock) => b.zoneId === block.zoneId)
    const posInZone = zoneBlocks.findIndex((b: StudioBlock) => b.id === blockId)
    const target = zoneBlocks[posInZone + dir]
    if (!target) return
    snapshot()
    const i = blocks.value.findIndex((b: StudioBlock) => b.id === blockId)
    const j = blocks.value.findIndex((b: StudioBlock) => b.id === target.id)
    const next = [...blocks.value]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    blocks.value = next
    markDirty()
  }

  function setZoneBlocks(zoneId: string, blockIds: string[]) {
    // Zone de boucle : ignore les blocs qu'on ne peut pas y placer (loop imbriquée,
    // recherche, formulaire) — ils gardent leur zone d'origine, le drop est annulé.
    if (zoneId.startsWith('loop:')) {
      blockIds = blockIds.filter((id) => {
        const b = blocks.value.find((x: StudioBlock) => x.id === id)
        return !b || b.zoneId === zoneId || canPlaceInZone(b.type, zoneId)
      })
    }
    snapshot()
    for (const block of blocks.value) {
      if (blockIds.includes(block.id)) {
        block.zoneId = zoneId
      }
    }
    const zoneBlocks = blockIds
      .map((id) => blocks.value.find((b: StudioBlock) => b.id === id))
      .filter(Boolean) as StudioBlock[]
    const otherBlocks = blocks.value.filter((b: StudioBlock) => !blockIds.includes(b.id) && b.zoneId !== zoneId)
    blocks.value = [...otherBlocks, ...zoneBlocks]
    markDirty()
  }

  function updateBlockConfig(blockId: string, config: Partial<BlockConfig>) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    // Text content changes are handled by Tiptap's internal history — no structural snapshot
    const isTextOnly = Object.keys(config).length === 1 && 'content' in config
    if (!isTextOnly) snapshot()
    block.config = { ...block.config, ...config }
    markDirty()
  }

  /** Change l'agencement en colonnes d'un bloc « Disposition » — réaffecte les blocs des colonnes retirées vers la dernière colonne restante. */
  function changeBlockLayout(blockId: string, layoutType: SectionLayout) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block || block.type !== 'layout') return
    snapshot()
    const newCols = getColCount(layoutType)
    blocks.value = blocks.value.map((b: StudioBlock) => {
      if (scriptIdFromZone(b.zoneId) !== blockId) return b
      const colIdx = scriptZoneBranch(b.zoneId)
      const safeIdx = Math.min(colIdx, newCols - 1)
      return { ...b, zoneId: scriptZoneId(blockId, safeIdx) }
    })
    block.config = { ...block.config, layoutType }
    markDirty()
  }

  /**
   * Compat : « choisir une source unique ». Remplace toutes les sources du bloc
   * par un seul dataset et purge les refs de colonnes devenues invalides.
   */
  function updateBlockDataset(blockId: string, datasetId: string) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    if (block.sources?.length === 1 && block.sources[0]?.datasetId === datasetId) return
    block.datasetId = datasetId
    block.sources = [{ id: datasetId, datasetId }]
    block.primarySourceId = datasetId
    block.joins = []
    pruneBlockColumnRefs(block)
    markDirty()
  }

  function updateBlockSources(blockId: string, sources: BlockSource[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.sources = sources
    if (!block.primarySourceId || !sources.some((s) => s.id === block.primarySourceId)) {
      block.primarySourceId = sources[0]?.id
    }
    block.datasetId = sources.find((s) => s.id === block.primarySourceId)?.datasetId ?? sources[0]?.datasetId
    block.joins = (block.joins ?? []).filter(
      (j) => sources.some((s) => s.id === j.leftSourceId) && sources.some((s) => s.id === j.rightSourceId),
    )
    pruneBlockColumnRefs(block)
    markDirty()
  }

  function addBlockSource(blockId: string, datasetId: string): string | undefined {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    const existing = block.sources ?? []
    let id = datasetId
    let n = 2
    while (existing.some((s) => s.id === id)) id = `${datasetId}~${n++}`
    block.sources = [...existing, { id, datasetId }]
    if (!block.primarySourceId) block.primarySourceId = id
    block.datasetId ??= datasetId
    markDirty()
    return id
  }

  function removeBlockSource(blockId: string, sourceId: string) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block?.sources) return
    block.sources = block.sources.filter((s) => s.id !== sourceId)
    block.joins = (block.joins ?? []).filter((j) => j.leftSourceId !== sourceId && j.rightSourceId !== sourceId)
    if (block.primarySourceId === sourceId) block.primarySourceId = block.sources[0]?.id
    block.datasetId = block.sources.find((s) => s.id === block.primarySourceId)?.datasetId ?? block.sources[0]?.datasetId
    pruneBlockColumnRefs(block)
    markDirty()
  }

  function setPrimarySource(blockId: string, sourceId: string) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block?.sources?.some((s) => s.id === sourceId)) return
    block.primarySourceId = sourceId
    block.datasetId = block.sources.find((s) => s.id === sourceId)?.datasetId
    pruneBlockColumnRefs(block)
    markDirty()
  }

  /** Retire des `fieldMapping` / `config` / `filters` toute ref `col@<sourceId>` dont la source n'existe plus. */
  function pruneBlockColumnRefs(block: StudioBlock) {
    const ids = new Set((block.sources ?? []).map((s) => s.id))
    const ok = (ref?: string | null): boolean => {
      if (!ref) return true
      const { sourceId } = parseColumnRef(ref)
      return !sourceId || ids.has(sourceId)
    }
    const keepArr = (a?: string[]) => a?.filter(ok)
    const keepKeys = <T>(rec?: Record<string, T>) =>
      rec ? Object.fromEntries(Object.entries(rec).filter(([k]) => ok(k))) : rec
    const fm = block.fieldMapping
    block.fieldMapping = {
      ...fm,
      xAxis: ok(fm.xAxis) ? fm.xAxis : undefined,
      yAxis: ok(fm.yAxis) ? fm.yAxis : undefined,
      yAxes: keepArr(fm.yAxes),
      label: ok(fm.label) ? fm.label : undefined,
      value: ok(fm.value) ? fm.value : undefined,
      series: ok(fm.series) ? fm.series : undefined,
      columns: keepArr(fm.columns),
      columnLabels: keepKeys(fm.columnLabels),
      columnFormats: keepKeys(fm.columnFormats),
      cellRules: fm.cellRules?.filter((c) => ok(c.column)),
      recordTitleColumn: ok(fm.recordTitleColumn) ? fm.recordTitleColumn : undefined,
      valueColumn: ok(fm.valueColumn) ? fm.valueColumn : undefined,
      comparisonColumn: ok(fm.comparisonColumn) ? fm.comparisonColumn : undefined,
      aggregates: fm.aggregates?.filter((a) => ok(a.column)),
      loopColumn: ok(fm.loopColumn) ? fm.loopColumn : undefined,
      paramColumn: ok(fm.paramColumn) ? fm.paramColumn : undefined,
    }
    if (block.config.distinctColumn && !ok(block.config.distinctColumn)) block.config = { ...block.config, distinctColumn: null }
    if (block.config.sortColumn && !ok(block.config.sortColumn)) block.config = { ...block.config, sortColumn: null }
    block.filters = block.filters?.filter((f) => ok(f.column))
    block.comparisonFilters = block.comparisonFilters?.filter((f) => ok(f.column))
  }

  // ─── Branches du bloc « Condition » (if / elsif / else) ──────────────────────

  /**
   * Réindexe les zones de branche d'un bloc `if` : `remap(i)` renvoie le nouvel
   * index de la branche `i`, ou `null` pour la supprimer (ses blocs + descendants
   * de script sont retirés). Ne touche pas `block.config`.
   */
  function reindexIfBranches(blockId: string, remap: (branch: number) => number | null) {
    const toRemove = new Set<string>()
    const sectionsToRemove = new Set<string>()
    for (const b of blocks.value) {
      if (scriptIdFromZone(b.zoneId) !== blockId) continue
      if (remap(scriptZoneBranch(b.zoneId)) === null) {
        toRemove.add(b.id)
        if (isContainerBlock(b.type)) loopChildIds(b.id).forEach((id) => toRemove.add(id))
      }
    }
    // Sections nichées dans les branches (bloc `if` de page qui conditionne des sections).
    for (const s of sections.value) {
      if (!s.zoneId || scriptIdFromZone(s.zoneId) !== blockId) continue
      if (remap(scriptZoneBranch(s.zoneId)) === null) {
        const d = sectionDescendants(s.id)
        sectionsToRemove.add(s.id)
        d.blocks.forEach((id) => toRemove.add(id))
        d.sections.forEach((id) => sectionsToRemove.add(id))
      }
    }
    if (toRemove.size) blocks.value = blocks.value.filter((b: StudioBlock) => !toRemove.has(b.id))
    if (sectionsToRemove.size) sections.value = sections.value.filter((s: Section) => !sectionsToRemove.has(s.id))
    for (const b of blocks.value) {
      if (scriptIdFromZone(b.zoneId) !== blockId) continue
      const next = remap(scriptZoneBranch(b.zoneId))
      if (next !== null) b.zoneId = scriptZoneId(blockId, next)
    }
    for (const s of sections.value) {
      if (!s.zoneId || scriptIdFromZone(s.zoneId) !== blockId) continue
      const next = remap(scriptZoneBranch(s.zoneId))
      if (next !== null) s.zoneId = scriptZoneId(blockId, next)
    }
  }

  /** Descendants d'une section (blocs de ses colonnes + sous-sections/blocs récursifs). */
  function sectionDescendants(sectionId: string): { blocks: Set<string>; sections: Set<string> } {
    const outBlocks = new Set<string>()
    const outSections = new Set<string>()
    const sectionStack = [sectionId]
    const blockStack: string[] = []
    while (sectionStack.length || blockStack.length) {
      if (sectionStack.length) {
        const sid = sectionStack.pop()!
        for (const b of blocks.value) {
          if (b.zoneId.startsWith(`${sid}-`) && !outBlocks.has(b.id)) {
            outBlocks.add(b.id)
            if (isContainerBlock(b.type)) blockStack.push(b.id)
          }
        }
      } else {
        const bid = blockStack.pop()!
        for (const b of blocks.value) {
          if (scriptIdFromZone(b.zoneId) === bid && !outBlocks.has(b.id)) {
            outBlocks.add(b.id)
            if (isContainerBlock(b.type)) blockStack.push(b.id)
          }
        }
        for (const s of sections.value) {
          if (s.zoneId && scriptIdFromZone(s.zoneId) === bid && !outSections.has(s.id)) {
            outSections.add(s.id)
            sectionStack.push(s.id)
          }
        }
      }
    }
    return { blocks: outBlocks, sections: outSections }
  }

  function addIfBranch(blockId: string, kind: 'elsif' | 'else') {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block || block.type !== 'if') return
    const edit = withAddedBranch(readIfBranches(block.config), kind)
    if (!edit) return
    snapshot()
    reindexIfBranches(blockId, edit.remap)
    block.config = { ...block.config, ifBranches: edit.branches }
    markDirty()
  }

  function removeIfBranch(blockId: string, branchIndex: number) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block || block.type !== 'if') return
    const edit = withRemovedBranch(readIfBranches(block.config), branchIndex)
    if (!edit) return
    snapshot()
    reindexIfBranches(blockId, edit.remap)
    block.config = { ...block.config, ifBranches: edit.branches }
    markDirty()
  }

  function updateBlockFieldMapping(blockId: string, mapping: Partial<FieldMapping>) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.fieldMapping = { ...block.fieldMapping, ...mapping }
    markDirty()
  }

  function updateBlockFilters(blockId: string, filters: import('@/types/studio').BlockFilter[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.filters = filters
    markDirty()
  }

  function updateBlockComparisonFilters(blockId: string, filters: import('@/types/studio').BlockFilter[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.comparisonFilters = filters
    markDirty()
  }

  function updateBlockJoins(blockId: string, joins: BlockJoin[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.joins = joins
    markDirty()
  }

  // ─── Preview ─────────────────────────────────────────────────────────────────

  function togglePreview(value?: boolean) {
    isPreview.value = value ?? !isPreview.value
    if (isPreview.value) {
      selectedBlockId.value = null
      isSidebarRightOpen.value = false
      isPanelOpen.value = false
    }
  }

  // ─── Save status ─────────────────────────────────────────────────────────────

  function setSaveStatus(status: SaveStatus) {
    saveStatus.value = status
    if (status === 'saved') isDirty.value = false
  }

  function markDirty() {
    isDirty.value = true
    saveStatus.value = 'idle'
    dirtyVersion.value++
  }

  // ─── Sidebar ─────────────────────────────────────────────────────────────────

  function setLeftTab(tab: SidebarLeftTab) {
    if (activeLeftTab.value === tab && isPanelOpen.value) {
      isPanelOpen.value = false
    } else {
      activeLeftTab.value = tab
      isPanelOpen.value = true
    }
  }

  function closePanel() {
    isPanelOpen.value = false
  }

  // ─── Serialization ────────────────────────────────────────────────────────────

  function getPayload() {
    return {
      title: content.value?.title,
      pages: pages.value,
      sections: sections.value,
      // Transition : on réécrit `datasetId` = dataset de la source primaire pour que
      // l'ancien back / les agrégateurs publics restent valides si le front est déployé avant.
      blocks: blocks.value.map((b: StudioBlock) => {
        const srcs = b.sources
        if (!srcs?.length) return b
        const primary = srcs.find((s) => s.id === b.primarySourceId) ?? srcs[0]
        return { ...b, datasetId: primary?.datasetId ?? b.datasetId }
      }),
    }
  }

  return {
    content,
    pages,
    currentPageId,
    currentPage,
    currentPageSections,
    currentPageTopLevelSections,
    currentPageCanvasItems,
    sectionsInZone,
    pageParams,
    sections,
    blocks,
    selectedBlock,
    selectedBlockId,
    selectedSection,
    selectedSectionId,
    selectSection,
    updateSection,
    blocksByZone,
    loopChildIds,
    loopAncestors,
    canPlaceInZone,
    saveStatus,
    isDirty,
    dirtyVersion,
    isPreview,
    activeLeftTab,
    isPanelOpen,
    isSidebarRightOpen,
    canUndo,
    canRedo,
    initPage,
    setTitle,
    togglePreview,
    addSection,
    addSectionInFlow,
    addPageBlock,
    removeSection,
    reorderSections,
    reorderSectionZone,
    moveSectionToZone,
    moveSectionToFlow,
    reorderPageCanvas,
    addPage,
    updatePage,
    switchPage,
    removePage,
    setPageParam,
    setPageParams,
    clearPageParams,
    currentPageParamDefs,
    hasActivePageFilters,
    addPageParam,
    updatePageParam,
    removePageParam,
    switchPageKeepParams,
    reorderCurrentPageSections,
    addBlock,
    addBlockSmart,
    removeBlock,
    duplicateBlock,
    selectBlock,
    moveBlock,
    moveBlockWithinZone,
    setZoneBlocks,
    updateBlockConfig,
    changeBlockLayout,
    updateBlockDataset,
    updateBlockSources,
    addBlockSource,
    removeBlockSource,
    setPrimarySource,
    addIfBranch,
    removeIfBranch,
    updateBlockFieldMapping,
    updateBlockFilters,
    updateBlockComparisonFilters,
    updateBlockJoins,
    setSaveStatus,
    markDirty,
    beginBatch,
    endBatch,
    undo,
    redo,
    setLeftTab,
    closePanel,
    getPayload,
  }
})
