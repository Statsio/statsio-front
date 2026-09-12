import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { StudioBlock, StudioContent, StudioDocumentPage, SidebarLeftTab, Section } from '@/types/studio'
import { normalizeBlockSources } from '@/lib/studio-block-sources'
import { useStudioSaveStatus } from '@/stores/studio/save-status'
import { useStudioPremium } from '@/stores/studio/premium'
import { useStudioMobileSheet } from '@/stores/studio/mobile-sheet'
import { useStudioHistory } from '@/stores/studio/history'
import { useStudioCanvas } from '@/stores/studio/canvas'
import { useStudioPageParams, defaultParamsForPage } from '@/stores/studio/page-params'
import { useStudioSections } from '@/stores/studio/sections'
import { useStudioBlocks } from '@/stores/studio/blocks'
import { useStudioPages } from '@/stores/studio/pages'
import { useStudioBlockDataSources } from '@/stores/studio/block-data-sources'
import { useStudioIfBranches } from '@/stores/studio/if-branches'
import { useStudioBlockFilters } from '@/stores/studio/block-filters'
import { migrateLegacyTemplatePages, migrateMultiColumnSections } from '@/stores/studio/migrations'
import { useStudioSerialization } from '@/stores/studio/serialization'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export const useStudioStore = defineStore('studio', () => {
  // ─── Core state (partagé par (quasi) tous les composables ci-dessous) ────────

  const content = ref<StudioContent | null>(null)
  const pages = ref<StudioDocumentPage[]>([{ id: 'default', title: 'Page 1' }])
  const currentPageId = ref<string>('default')
  const pageParams = ref<Record<string, string>>({})
  const sections = ref<Section[]>([{ id: uid(), layout: '1-col', pageId: 'default' }])
  const blocks = ref<StudioBlock[]>([])

  const selectedBlockId = ref<string | null>(null)
  const selectedSectionId = ref<string | null>(null)
  const activeLeftTab = ref<SidebarLeftTab>('blocks')
  const isPanelOpen = ref(false)
  const isSidebarRightOpen = ref(false)
  /** Aperçu : canevas en lecture seule, chrome d'édition masqué. */
  const isPreview = ref(false)

  // ─── Composables internes ─────────────────────────────────────────────────────
  // Chacun ferme sur un sous-ensemble du state ci-dessus (+ `snapshot`/`markDirty`
  // pour l'historique/dirty-tracking) — voir app/stores/studio/*.ts. `sections` et
  // `blocks` se référencent mutuellement (`addPageBlock` → `addBlock`,
  // `fallbackZoneId` → `addSection`) : liaison tardive via deux `let` assignés
  // juste après construction, résolus uniquement à l'appel (jamais pendant le setup).

  const saveStatusApi = useStudioSaveStatus({ content })
  const premiumApi = useStudioPremium({ content, blocks })
  const mobileSheetApi = useStudioMobileSheet()
  const historyApi = useStudioHistory({
    pages, sections, blocks, currentPageId, selectedBlockId, selectedSectionId, isSidebarRightOpen,
    markDirty: saveStatusApi.markDirty,
  })
  const canvasApi = useStudioCanvas({
    content, pages, sections, blocks, currentPageId, selectedBlockId, selectedSectionId, isSidebarRightOpen,
    snapshot: historyApi.snapshot, markDirty: saveStatusApi.markDirty,
  })
  const pageParamsApi = useStudioPageParams({
    pages, sections, blocks, currentPageId, pageParams, currentPage: canvasApi.currentPage,
    snapshot: historyApi.snapshot, markDirty: saveStatusApi.markDirty,
  })

  // `blocksApi` et `sectionsApi` se référencent mutuellement (`addPageBlock` →
  // `addBlock`, `fallbackZoneId` → `addSection`). `blocksApi` est construit en
  // premier ; sa dépendance vers `addSection` ne peut donc pas encore fermer sur
  // une variable `sectionsApi` — on la range dans un holder mutable, rempli juste
  // après construction. L'appel réel n'a lieu qu'à l'usage (jamais pendant le setup).
  const lateBound: { sections?: ReturnType<typeof useStudioSections> } = {}

  const blocksApi = useStudioBlocks({
    blocks, sections, pages, currentPageId, selectedBlockId, selectedSectionId, isSidebarRightOpen,
    selectedBlock: canvasApi.selectedBlock,
    canPlaceInZone: canvasApi.canPlaceInZone,
    loopChildIds: canvasApi.loopChildIds,
    dropCanvasRef: canvasApi.dropCanvasRef,
    addSection: () => lateBound.sections!.addSection(),
    syncParamBlockPageParam: pageParamsApi.syncParamBlockPageParam,
    syncAutoPageParam: pageParamsApi.syncAutoPageParam,
    snapshot: historyApi.snapshot,
    markDirty: saveStatusApi.markDirty,
  })

  const sectionsApi = useStudioSections({
    sections, blocks, currentPageId, selectedBlockId, selectedSectionId, isSidebarRightOpen,
    currentPage: canvasApi.currentPage,
    currentPageCanvasItems: canvasApi.currentPageCanvasItems,
    sectionsInZone: canvasApi.sectionsInZone,
    insertCanvasRef: canvasApi.insertCanvasRef,
    dropCanvasRef: canvasApi.dropCanvasRef,
    loopChildIds: canvasApi.loopChildIds,
    addBlock: (type, zoneId, atIndex, locked) => blocksApi.addBlock(type, zoneId, atIndex, locked),
    snapshot: historyApi.snapshot,
    markDirty: saveStatusApi.markDirty,
  })
  lateBound.sections = sectionsApi

  const pagesApi = useStudioPages({
    pages, sections, blocks, currentPageId, pageParams, selectedBlockId, selectedSectionId, isSidebarRightOpen,
    loopChildIds: canvasApi.loopChildIds,
    snapshot: historyApi.snapshot, markDirty: saveStatusApi.markDirty,
  })

  const blockDataSourcesApi = useStudioBlockDataSources({
    blocks, syncAutoPageParam: pageParamsApi.syncAutoPageParam,
    snapshot: historyApi.snapshot, markDirty: saveStatusApi.markDirty,
  })

  const ifBranchesApi = useStudioIfBranches({
    blocks, sections, loopChildIds: canvasApi.loopChildIds,
    snapshot: historyApi.snapshot, markDirty: saveStatusApi.markDirty,
  })

  const blockFiltersApi = useStudioBlockFilters({
    blocks, syncAutoPageParam: pageParamsApi.syncAutoPageParam,
    snapshot: historyApi.snapshot, markDirty: saveStatusApi.markDirty,
  })

  const serializationApi = useStudioSerialization({
    content, pages, sections, blocks, currentPageId, pageParams, selectedBlockId, selectedSectionId,
    isPanelOpen, isSidebarRightOpen, supportsPages: canvasApi.supportsPages,
    syncAllSearchPageParams: pageParamsApi.syncAllSearchPageParams,
    syncAllParamBlockPageParams: pageParamsApi.syncAllParamBlockPageParams,
    snapshot: historyApi.snapshot, dropLastSnapshot: historyApi.dropLastSnapshot, markDirty: saveStatusApi.markDirty,
  })

  // ─── Page init ───────────────────────────────────────────────────────────────

  function initPage(
    pageContent: StudioContent,
    pageSections?: Section[],
    pageBlocks?: StudioBlock[],
    documentPages?: StudioDocumentPage[],
    options: { seedEmptySection?: boolean } = {},
  ) {
    void premiumApi.loadPremiumBlockGates()
    content.value = pageContent

    if (documentPages && documentPages.length > 0) {
      pages.value = documentPages
    } else {
      pages.value = [{ id: 'default', title: 'Page 1' }]
    }
    currentPageId.value = pages.value[0]?.id ?? 'default'

    // Migrate sections without pageId to the first page
    const defaultPageId = pages.value[0]?.id ?? 'default'
    // Un document fraîchement créé arrive avec `sections: []` : côté éditeur
    // (`seedEmptySection`), on amorce une section vide pour ne pas ouvrir le
    // Studio sur un canevas nu. Le rendu public, lui, garde le tableau tel quel.
    let initialSections = pageSections ?? [{ id: uid(), layout: '1-col', pageId: defaultPageId }]
    if (initialSections.length === 0 && options.seedEmptySection) {
      initialSections = [{ id: uid(), layout: '1-col', pageId: defaultPageId }]
    }
    sections.value = initialSections.map((s) => ({
      ...s,
      pageId: s.pageId ?? defaultPageId,
    }))

    blocks.value = (pageBlocks ?? []).map(normalizeBlockSources)

    migrateLegacyTemplatePages(pages, sections, blocks)
    migrateMultiColumnSections(sections, blocks)
    // Bloc `param` : le toggle « générer une page » a été retiré (fan-out toujours actif).
    for (const b of blocks.value) {
      if (b.type === 'param' && 'paramFanOut' in b.config) {
        delete (b.config as Record<string, unknown>).paramFanOut
      }
    }
    pageParamsApi.syncAllSearchPageParams()
    pageParamsApi.syncAllParamBlockPageParams()
    pageParams.value = defaultParamsForPage(pages.value.find((p) => p.id === currentPageId.value))

    selectedBlockId.value = null
    selectedSectionId.value = null
    saveStatusApi.resetSaveStatus(pageContent)
    historyApi.resetHistory()
  }

  function setTitle(title: string) {
    if (!content.value) return
    content.value.title = title
    saveStatusApi.markDirty()
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

  // ─── Surface publique ─────────────────────────────────────────────────────────
  // Contrat figé : ~130 clés consommées par nom dans une centaine de fichiers +
  // `studio.spec.ts`. Toute restructuration interne doit se faire SOUS ce return
  // (renommer/déplacer une clé ici casse tous les appelants).

  return {
    content,
    pages,
    supportsPages: canvasApi.supportsPages,
    currentPageId,
    currentPage: canvasApi.currentPage,
    currentPageSections: canvasApi.currentPageSections,
    currentPageTopLevelSections: canvasApi.currentPageTopLevelSections,
    currentPageCanvasItems: canvasApi.currentPageCanvasItems,
    sectionsInZone: canvasApi.sectionsInZone,
    pageParams,
    sections,
    blocks,
    selectedBlock: canvasApi.selectedBlock,
    selectedBlockId,
    selectedSection: canvasApi.selectedSection,
    selectedSectionId,
    selectSection: canvasApi.selectSection,
    updateSection: canvasApi.updateSection,
    blocksByZone: canvasApi.blocksByZone,
    loopChildIds: canvasApi.loopChildIds,
    loopAncestors: canvasApi.loopAncestors,
    canPlaceInZone: canvasApi.canPlaceInZone,
    saveStatus: saveStatusApi.saveStatus,
    saveErrorStatus: saveStatusApi.saveErrorStatus,
    isDirty: saveStatusApi.isDirty,
    dirtyVersion: saveStatusApi.dirtyVersion,
    hasUnpublishedChanges: saveStatusApi.hasUnpublishedChanges,
    isPreview,
    premiumBlockTypes: premiumApi.premiumBlockTypes,
    premiumBlockOffers: premiumApi.premiumBlockOffers,
    premiumUpsellBlockType: premiumApi.premiumUpsellBlockType,
    isBlockPremium: premiumApi.isBlockPremium,
    requiredOfferForBlock: premiumApi.requiredOfferForBlock,
    canUseBlock: premiumApi.canUseBlock,
    isFormBlockLimitReached: premiumApi.isFormBlockLimitReached,
    requestPremiumUpsell: premiumApi.requestPremiumUpsell,
    dismissPremiumUpsell: premiumApi.dismissPremiumUpsell,
    activeLeftTab,
    isPanelOpen,
    isSidebarRightOpen,
    activeBlockTab: mobileSheetApi.activeBlockTab,
    mobileSheetSnap: mobileSheetApi.mobileSheetSnap,
    canUndo: historyApi.canUndo,
    canRedo: historyApi.canRedo,
    initPage,
    setTitle,
    togglePreview,
    addSection: sectionsApi.addSection,
    addSectionInFlow: sectionsApi.addSectionInFlow,
    addPageBlock: sectionsApi.addPageBlock,
    removeSection: sectionsApi.removeSection,
    moveSectionInFlow: sectionsApi.moveSectionInFlow,
    duplicateSection: sectionsApi.duplicateSection,
    reorderSections: sectionsApi.reorderSections,
    reorderSectionZone: sectionsApi.reorderSectionZone,
    moveSectionToZone: sectionsApi.moveSectionToZone,
    moveSectionToFlow: sectionsApi.moveSectionToFlow,
    reorderPageCanvas: sectionsApi.reorderPageCanvas,
    addPage: pagesApi.addPage,
    updatePage: pagesApi.updatePage,
    switchPage: pagesApi.switchPage,
    removePage: pagesApi.removePage,
    movePage: pagesApi.movePage,
    reorderPages: pagesApi.reorderPages,
    setPageParam: pagesApi.setPageParam,
    setPageParams: pagesApi.setPageParams,
    clearPageParams: pagesApi.clearPageParams,
    currentPageParamDefs: pageParamsApi.currentPageParamDefs,
    hasActivePageFilters: pageParamsApi.hasActivePageFilters,
    addPageParam: pageParamsApi.addPageParam,
    updatePageParam: pageParamsApi.updatePageParam,
    removePageParam: pageParamsApi.removePageParam,
    pageIdOfBlock: pageParamsApi.pageIdOfBlock,
    syncSearchPageParam: pageParamsApi.syncSearchPageParam,
    syncParamBlockPageParam: pageParamsApi.syncParamBlockPageParam,
    switchPageKeepParams: pagesApi.switchPageKeepParams,
    reorderCurrentPageSections: sectionsApi.reorderCurrentPageSections,
    addBlock: blocksApi.addBlock,
    addBlockSmart: blocksApi.addBlockSmart,
    removeBlock: blocksApi.removeBlock,
    duplicateBlock: blocksApi.duplicateBlock,
    selectBlock: blocksApi.selectBlock,
    moveBlock: blocksApi.moveBlock,
    moveBlockWithinZone: blocksApi.moveBlockWithinZone,
    setZoneBlocks: blocksApi.setZoneBlocks,
    updateBlockConfig: blocksApi.updateBlockConfig,
    changeBlockLayout: blockDataSourcesApi.changeBlockLayout,
    updateBlockDataset: blockDataSourcesApi.updateBlockDataset,
    updateBlockSources: blockDataSourcesApi.updateBlockSources,
    addBlockSource: blockDataSourcesApi.addBlockSource,
    removeBlockSource: blockDataSourcesApi.removeBlockSource,
    setPrimarySource: blockDataSourcesApi.setPrimarySource,
    purgeDataset: blockDataSourcesApi.purgeDataset,
    importPayload: serializationApi.importPayload,
    addIfBranch: ifBranchesApi.addIfBranch,
    removeIfBranch: ifBranchesApi.removeIfBranch,
    updateBlockFieldMapping: blockFiltersApi.updateBlockFieldMapping,
    updateBlockFilters: blockFiltersApi.updateBlockFilters,
    updateBlockComparisonFilters: blockFiltersApi.updateBlockComparisonFilters,
    updateBlockFilterGroups: blockFiltersApi.updateBlockFilterGroups,
    updateBlockFiltersMatch: blockFiltersApi.updateBlockFiltersMatch,
    updateBlockComparisonFilterGroups: blockFiltersApi.updateBlockComparisonFilterGroups,
    updateBlockComparisonFiltersMatch: blockFiltersApi.updateBlockComparisonFiltersMatch,
    updateBlockJoins: blockFiltersApi.updateBlockJoins,
    setSaveStatus: saveStatusApi.setSaveStatus,
    setSaveError: saveStatusApi.setSaveError,
    markDirty: saveStatusApi.markDirty,
    markPublished: saveStatusApi.markPublished,
    beginBatch: historyApi.beginBatch,
    endBatch: historyApi.endBatch,
    undo: historyApi.undo,
    redo: historyApi.redo,
    setLeftTab,
    closePanel,
    openMobileSheet: mobileSheetApi.openMobileSheet,
    closeMobileSheet: mobileSheetApi.closeMobileSheet,
    setMobileSheetSnap: mobileSheetApi.setMobileSheetSnap,
    getPayload: serializationApi.getPayload,
  }
})
