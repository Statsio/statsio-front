import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPublicStatsDataDocument, fetchPublicSearchRows } from '@/api/studio'
import type { StatsDataDocument } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock, StudioDocumentPage } from '@/types/studio'

function queryToParams(q: import('vue-router').LocationQuery): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(q)) {
    if (typeof val === 'string') result[key] = val
  }
  return result
}

// Shared by both /statsdata/[slug] and /statsdata/[slug]/[pageSlug] — same document, different default active page.
export function useStatsDataDetail() {
  const route = useRoute()
  const studio = useStudioStore()

  const docSlug = computed(() => String(route.params.slug ?? ''))
  const pageSlug = computed(() => route.params.pageSlug as string | undefined)

  const doc = ref<StatsDataDocument | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const activePage = computed(() => {
    if (!studio.pages.length) return null
    if (pageSlug.value) {
      const match = studio.pages.find(
        (p: StudioDocumentPage) => p.slug === pageSlug.value || p.id === pageSlug.value,
      )
      if (match) return match
    }
    return studio.pages.find((p: StudioDocumentPage) => !p.isTemplate) ?? studio.pages[0] ?? null
  })

  const publicPages = computed(() => studio.pages.filter((p: StudioDocumentPage) => !p.isTemplate))
  // Unfiltered — the tab bar shows every page, including drill-down/template ones
  // (e.g. "Vue communale"), matching the mockup rather than hiding them.
  const allPages = computed(() => studio.pages)
  const pageSections = computed(() => studio.currentPageSections)

  // Direct URL access only carries the columns configured as "Paramètres URL" (e.g. code_commune).
  // SearchBlock's onSelect normally stores every row column (e.g. nom_commune) in memory, but that
  // memory doesn't exist on a fresh load — so we re-fetch the matching row from whichever search
  // block feeds this page and merge its columns into pageParams to resolve the rest of the tokens.
  async function hydrateRowParams(targetPageId: string, urlParams: Record<string, string>) {
    if (!Object.keys(urlParams).length) return

    const searchBlock = studio.blocks.find(
      (b: StudioBlock) => b.type === 'search' && b.fieldMapping.targetPageId === targetPageId,
    )
    if (!searchBlock) return

    const urlParamCols = searchBlock.fieldMapping.urlParams ?? []
    const mapping = searchBlock.fieldMapping.urlParamMapping ?? {}
    if (!urlParamCols.length || !urlParamCols.every((c) => urlParams[c])) return

    const sources = searchBlock.fieldMapping.searchSources?.length
      ? searchBlock.fieldMapping.searchSources
      : (searchBlock.datasetId && searchBlock.fieldMapping.searchColumn
          ? [{ datasetId: searchBlock.datasetId, columns: [searchBlock.fieldMapping.searchColumn] }]
          : [])

    const searchValue = urlParams[urlParamCols[0]!]!

    for (const source of sources) {
      if (!source.datasetId || !source.columns.length) continue
      const joins = (searchBlock.fieldMapping.searchJoins ?? [])
        .filter((j) => j.sourceDatasetId === source.datasetId)
        .map((j) => ({ datasetId: j.datasetId, leftColumn: j.leftColumn, rightColumn: j.rightColumn, columns: j.columns, type: j.type }))

      try {
        const rows = await fetchPublicSearchRows(docSlug.value, source.datasetId, source.columns, searchValue, 30, joins)
        const match = rows.find((row) =>
          urlParamCols.every((key) => String(row[mapping[key] ?? key] ?? '') === urlParams[key]),
        )
        if (!match) continue
        const rowParams: Record<string, string> = {}
        for (const [col, val] of Object.entries(match)) {
          if (val !== null && val !== undefined && val !== '') rowParams[col] = String(val)
        }
        studio.setPageParams({ ...rowParams, ...urlParams })
        return
      } catch {
        // best effort — direct navigation still works with the raw URL params
      }
    }
  }

  // When pageSlug URL param changes, switch the active page
  watch(pageSlug, (slug: string | undefined) => {
    if (!studio.pages.length) return
    const target = slug
      ? (studio.pages.find((p: StudioDocumentPage) => p.slug === slug || p.id === slug) ?? studio.pages.find((p: StudioDocumentPage) => !p.isTemplate) ?? studio.pages[0])
      : (studio.pages.find((p: StudioDocumentPage) => !p.isTemplate) ?? studio.pages[0])
    if (!target) return

    const urlParams = queryToParams(route.query)
    const hasMemoryParams = Object.keys(studio.pageParams).length > 0

    // Same-session URL navigation: params were already set by onSelect → preserve them
    if (target.isTemplate && hasMemoryParams) {
      studio.switchPageKeepParams(target.id)
      for (const [k, v] of Object.entries(urlParams)) studio.setPageParam(k, v)
      return
    }

    // Template page reached with no params (tab click, direct URL) — stay on it and
    // show it "empty": the linked search block's own parameter bar lets the visitor pick
    // a value right there, instead of silently bouncing back to the default page.

    // Normal navigation: full reset + restore URL params
    studio.switchPage(target.id)
    studio.setPageParams(urlParams)
    void hydrateRowParams(target.id, urlParams)
  })

  // When only query changes (same template page, new result selected via URL)
  watch(() => route.query, (q: import('vue-router').LocationQuery) => {
    if (!studio.pages.length) return
    const currentPage = studio.pages.find((p: StudioDocumentPage) => p.id === studio.currentPageId)
    if (!currentPage?.isTemplate) return
    for (const [k, v] of Object.entries(q)) {
      if (typeof v === 'string') studio.setPageParam(k, v)
    }
  }, { deep: true })

  function resolveToken(str: string): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const direct = studio.pageParams[key]
      if (direct !== undefined) return direct
      // Fallback: resolve known pageParams names within the expression text
      // e.g. {{SUM(annee, code_postal)}} → SUM(2025, 75000)
      return key.replace(/\w+/g, (name: string) => studio.pageParams[name] ?? name)
    })
  }

  onMounted(async () => {
    try {
      const data = await fetchPublicStatsDataDocument(docSlug.value)
      doc.value = data
      // Save params that may have been set by SearchBlock's onSelect before initPage clears them
      // (e.g. when navigating from index.vue → [pageSlug].vue)
      const savedParams = { ...studio.pageParams }
      studio.initPage(
        { id: data.id, type: 'statsdata', title: data.title, status: data.status as 'draft' | 'published', slug: docSlug.value },
        data.sections, data.blocks, data.pages,
      )
      const target = pageSlug.value
        ? (studio.pages.find((p: StudioDocumentPage) => p.slug === pageSlug.value || p.id === pageSlug.value) ?? studio.pages.find((p: StudioDocumentPage) => !p.isTemplate) ?? studio.pages[0])
        : (studio.pages.find((p: StudioDocumentPage) => !p.isTemplate) ?? studio.pages[0])
      if (target) {
        const urlParams = queryToParams(route.query)
        const hasSavedParams = Object.keys(savedParams).length > 0
        if (target.isTemplate && hasSavedParams) {
          studio.switchPageKeepParams(target.id)
          studio.setPageParams({ ...savedParams, ...urlParams })
        } else {
          studio.switchPage(target.id)
          studio.setPageParams(urlParams)
          void hydrateRowParams(target.id, urlParams)
        }
      }
    } catch {
      error.value = 'Document introuvable ou non publié.'
    } finally {
      loading.value = false
    }
  })

  return {
    docSlug,
    pageSlug,
    doc,
    loading,
    error,
    activePage,
    publicPages,
    allPages,
    pageSections,
    resolveToken,
  }
}
