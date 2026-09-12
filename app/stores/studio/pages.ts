import type { Ref } from 'vue'
import type { Section, StudioBlock, StudioDocumentPage } from '@/types/studio'
import { isContainerBlock } from '@/types/studio'
import { defaultParamsForPage } from '@/stores/studio/page-params'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function useStudioPages(deps: {
  pages: Ref<StudioDocumentPage[]>
  sections: Ref<Section[]>
  blocks: Ref<StudioBlock[]>
  currentPageId: Ref<string>
  pageParams: Ref<Record<string, string>>
  selectedBlockId: Ref<string | null>
  selectedSectionId: Ref<string | null>
  isSidebarRightOpen: Ref<boolean>
  loopChildIds: (scriptBlockId: string) => string[]
  snapshot: () => void
  markDirty: () => void
}) {
  const {
    pages, sections, blocks, currentPageId, pageParams, selectedBlockId, selectedSectionId, isSidebarRightOpen,
    loopChildIds, snapshot, markDirty,
  } = deps

  function addPage(
    title: string,
    options: { isTemplate?: boolean; paramName?: string; description?: string; icon?: string; seedSection?: boolean } = {},
  ): StudioDocumentPage {
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
    // Une nouvelle page créée depuis l'éditeur démarre avec une section vide
    // (l'assistant IA, lui, gère ses propres sections → `seedSection` absent).
    if (options.seedSection) {
      sections.value.push({ id: uid(), layout: '1-col', pageId: page.id })
    }
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

  /** Déplace une page d'un cran (`-1` = vers le haut, `1` = vers le bas) dans l'ordre du document. */
  function movePage(pageId: string, direction: -1 | 1) {
    const index = pages.value.findIndex((p: StudioDocumentPage) => p.id === pageId)
    if (index === -1) return
    const target = index + direction
    if (target < 0 || target >= pages.value.length) return
    snapshot()
    const next = [...pages.value]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved!)
    pages.value = next
    markDirty()
  }

  /** Réécrit l'ordre complet des pages du document (drag & drop). */
  function reorderPages(orderedIds: string[]) {
    const byId = new Map(pages.value.map((p: StudioDocumentPage) => [p.id, p]))
    const next = orderedIds
      .map((id) => byId.get(id))
      .filter((p): p is StudioDocumentPage => !!p)
    if (next.length !== pages.value.length) return
    snapshot()
    pages.value = next
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

  return {
    addPage,
    updatePage,
    switchPage,
    switchPageKeepParams,
    removePage,
    movePage,
    reorderPages,
    setPageParam,
    setPageParams,
    clearPageParams,
  }
}
