import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPublicStatsDataDocument, fetchPublicSearchRows, fetchPublicDistinctValues } from '@/api/studio'
import type { StatsDataDocument } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import type { PageParam, StudioBlock, StudioDocumentPage } from '@/types/studio'
import { fanOutSlugKey, resolveSegment } from '@/lib/statsdata-fanout'
import { slugify } from '@/lib/slug'

function queryToParams(q: import('vue-router').LocationQuery): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(q)) {
    if (typeof val === 'string') result[key] = val
  }
  return result
}

// Partagé par /statsdata/[slug] et /statsdata/[slug]/[segment] — même document.
// Le segment est soit un slug de page (onglet), soit une valeur de fan-out.
export function useStatsDataDetail() {
  const route = useRoute()
  const studio = useStudioStore()

  const docSlug = computed(() => String(route.params.slug ?? ''))
  const segment = computed(() => route.params.pageSlug as string | undefined)

  const doc = ref<StatsDataDocument | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const activePage = computed(() =>
    studio.pages.length ? resolveSegment(segment.value, studio.pages).page : null,
  )
  // La barre d'onglets montre toutes les pages du document.
  const allPages = computed(() => studio.pages)
  const publicPages = allPages
  const pageSections = computed(() => studio.currentPageSections)

  /**
   * Le segment d'URL fan-out ne porte qu'une valeur slugifiée. On retrouve la
   * ligne correspondante — via la barre de recherche qui alimente la page, sinon
   * via les valeurs distinctes de la colonne — pour résoudre tous les jetons.
   */
  async function hydrateFanOut(page: StudioDocumentPage, param: PageParam, seg: string) {
    const slugKey = fanOutSlugKey(param)
    const term = seg.replace(/-+/g, ' ')

    const searchBlock = studio.blocks.find(
      (b: StudioBlock) => b.type === 'search'
        && (!b.fieldMapping.targetPageId || b.fieldMapping.targetPageId === page.id),
    )

    const sources = searchBlock?.fieldMapping.searchSources?.length
      ? searchBlock.fieldMapping.searchSources
      : (searchBlock?.datasetId && searchBlock.fieldMapping.searchColumn
          ? [{ datasetId: searchBlock.datasetId, columns: [searchBlock.fieldMapping.searchColumn] }]
          : [])

    for (const source of sources) {
      if (!source.datasetId || !source.columns.length) continue
      try {
        const rows = await fetchPublicSearchRows(docSlug.value, source.datasetId, source.columns, term, 30)
        const match = rows.find((row) =>
          slugify(String(row[slugKey] ?? row[param.column ?? ''] ?? '')) === seg,
        )
        if (!match) continue
        const rowParams: Record<string, string> = {}
        for (const [col, val] of Object.entries(match)) {
          if (val !== null && val !== undefined && val !== '') rowParams[col] = String(val)
        }
        studio.setPageParams(rowParams)
        return
      } catch { /* best effort */ }
    }

    // Fan-out piloté par un bloc `param` (pas de ligne à hydrater) : on retrouve
    // la valeur exacte parmi les valeurs distinctes de la colonne.
    const col = param.column || slugKey
    if (param.datasetId && col) {
      try {
        const values = await fetchPublicDistinctValues(docSlug.value, param.datasetId, col)
        const exact = values.find((v) => slugify(v) === seg)
        if (exact) { studio.setPageParam(param.name, exact); return }
      } catch { /* best effort */ }
    }

    // Dernier recours : valeur dé-slugifiée.
    studio.setPageParam(param.name, term)
  }

  /** Applique la résolution du segment courant à l'état du store. */
  function applySegment() {
    if (!studio.pages.length) return
    const { page, fanOut } = resolveSegment(segment.value, studio.pages)
    if (!page) return

    const urlParams = queryToParams(route.query)

    if (fanOut) {
      studio.switchPageKeepParams(page.id)
      studio.setPageParam(fanOutSlugKey(fanOut.param), fanOut.segment.replace(/-+/g, ' '))
      for (const [k, v] of Object.entries(urlParams)) studio.setPageParam(k, v)
      void hydrateFanOut(page, fanOut.param, fanOut.segment)
      return
    }

    studio.switchPage(page.id)
    for (const [k, v] of Object.entries(urlParams)) studio.setPageParam(k, v)
  }

  watch(segment, () => applySegment())

  // Un paramètre d'URL (`?commune=…`) change sans changer de page : on propage.
  watch(() => route.query, (q: import('vue-router').LocationQuery) => {
    if (!studio.pages.length) return
    for (const [k, v] of Object.entries(q)) {
      if (typeof v === 'string') studio.setPageParam(k, v)
    }
  }, { deep: true })

  function resolveToken(str: string): string {
    return str.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, key) => {
      const direct = studio.pageParams[key]
      if (direct !== undefined) return direct
      // Repli : résout les noms de paramètres connus à l'intérieur d'une expression
      // (ex. {{ SUM(annee, code_postal) }} → SUM(2025, 75000)).
      return key.replace(/\w+/g, (name: string) => studio.pageParams[name] ?? name)
    })
  }

  onMounted(async () => {
    try {
      const data = await fetchPublicStatsDataDocument(docSlug.value)
      doc.value = data
      // onSelect d'un bloc recherche a pu poser des params avant ce montage
      // (navigation index.vue → [segment].vue) — on les préserve.
      const savedParams = { ...studio.pageParams }
      studio.initPage(
        { id: data.id, type: 'statsdata', title: data.title, status: data.status as 'draft' | 'published', slug: docSlug.value },
        data.sections, data.blocks, data.pages,
      )

      const { page, fanOut } = resolveSegment(segment.value, studio.pages)
      if (!page) return

      const urlParams = queryToParams(route.query)
      const hasSaved = Object.keys(savedParams).length > 0

      if (fanOut) {
        studio.switchPageKeepParams(page.id)
        studio.setPageParams({ ...savedParams, ...urlParams })
        studio.setPageParam(fanOutSlugKey(fanOut.param), fanOut.segment.replace(/-+/g, ' '))
        if (!hasSaved) void hydrateFanOut(page, fanOut.param, fanOut.segment)
        return
      }

      studio.switchPage(page.id)
      studio.setPageParams({ ...(hasSaved ? savedParams : {}), ...urlParams })
    } catch {
      error.value = 'Document introuvable ou non publié.'
    } finally {
      loading.value = false
    }
  })

  return {
    docSlug,
    /** @deprecated conservé pour compat — renvoie le segment d'URL brut. */
    pageSlug: segment,
    segment,
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
