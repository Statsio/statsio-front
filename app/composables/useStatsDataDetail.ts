import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPublicStatsDataDocument, fetchPublicBlockData, fetchPublicDistinctValues } from '@/api/studio'
import type { StatsDataDocument } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import type { PageParam, StudioBlock, StudioDocumentPage } from '@/types/studio'
import { buildFanOutSegment, fanOutSegmentKeys, fanOutSlugKey, resolveSegments } from '@/lib/statsdata-fanout'
import { blockSourceParams } from '@/composables/useBlockData'
import { fanOutColumnsForSource, isUnionBlock, pageParamsFromUnionRow } from '@/lib/studio-search'
import { primarySourceId } from '@/lib/studio-columns'
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
  /** Segment unique : slug de page (onglet) ou valeur fan-out courte. */
  const segment = computed(() => route.params.pageSlug as string | undefined)
  /** Valeur fan-out scoped : `/statsdata/{slug}/{pageSlug}/{fanOut}`. */
  const fanOutSegment = computed(() => route.params.fanOut as string | undefined)

  const doc = ref<StatsDataDocument | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  /**
   * État d'hydratation d'une page fan-out atteinte par valeur :
   *  - `null` : la page courante n'est pas une valeur de fan-out ;
   *  - `true` : le segment d'URL correspond à une vraie ligne / valeur distincte ;
   *  - `false` : aucune correspondance — on n'a qu'un repli dé-slugifié (page « mince »).
   * Sert à sortir de l'index les valeurs de fan-out sans contenu réel.
   */
  const fanOutHydrated = ref<boolean | null>(null)

  const activePage = computed(() =>
    studio.pages.length
      ? resolveSegments(segment.value, fanOutSegment.value, studio.pages).page
      : null,
  )
  // La barre d'onglets montre toutes les pages du document.
  const allPages = computed(() => studio.pages)
  const publicPages = allPages
  const pageSections = computed(() => studio.currentPageSections)
  /** Flux de premier niveau de la page (sections racine + blocs `loop`/`if` de page) — point d'entrée du rendu. */
  const canvasItems = computed(() => studio.currentPageCanvasItems)

  /**
   * Le segment d'URL fan-out ne porte qu'une valeur slugifiée. On retrouve la
   * ligne correspondante — via la barre de recherche qui alimente la page, sinon
   * via les valeurs distinctes de la colonne — pour résoudre tous les jetons.
   */
  async function hydrateFanOut(page: StudioDocumentPage, param: PageParam, seg: string) {
    fanOutHydrated.value = false
    const slugKey = fanOutSlugKey(param)
    const keys = fanOutSegmentKeys(param)
    const term = seg.replace(/-+/g, ' ')

    // Bloc recherche qui alimente cette page (sinon le premier du document).
    const searchBlock =
      studio.blocks.find((b: StudioBlock) => b.type === 'search' && studio.pageIdOfBlock(b.id) === page.id) ??
      studio.blocks.find((b: StudioBlock) => b.type === 'search')

    const searchRefs = searchBlock?.fieldMapping.searchColumns ?? []
    if (searchBlock && searchRefs.length) {
      const sp = blockSourceParams(searchBlock)
      if (sp.urlDatasetId) {
        try {
          const res = await fetchPublicBlockData(docSlug.value, sp.urlDatasetId, {
            sources: sp.sources,
            primarySourceId: sp.primarySourceId,
            joins: sp.joins,
            searchQ: term,
            searchColumns: searchRefs,
            limit: 30,
          })
          const match = res.rows.find((row) => {
            if (isUnionBlock(searchBlock)) {
              const sourceId = String(row.__source_id ?? primarySourceId(searchBlock) ?? '')
              if (!sourceId) return false
              const cols = fanOutColumnsForSource(searchBlock, sourceId, row)
              if (!cols.length) return false
              return buildFanOutSegment({ ...param, columns: cols }, row) === seg
            }
            return buildFanOutSegment(param, row) === seg
          })
          if (match) {
            const sourceId = String(match.__source_id ?? primarySourceId(searchBlock) ?? '')
            const rowParams = (isUnionBlock(searchBlock) && sourceId)
              ? pageParamsFromUnionRow(searchBlock, sourceId, match)
              : Object.fromEntries(
                  Object.entries(match)
                    .filter(([k, val]) => !k.startsWith('__') && val !== null && val !== undefined && val !== '')
                    .map(([k, val]) => [k, String(val)]),
                )
            studio.setPageParams(rowParams)
            fanOutHydrated.value = true
            return
          }
        } catch { /* best effort */ }
      }
    }

    // Fan-out piloté par un bloc `param` (pas de ligne à hydrater) : on retrouve
    // la valeur exacte parmi les valeurs distinctes de la colonne.
    const col = param.column || slugKey
    if (keys.length === 1 && param.datasetId && col) {
      try {
        const values = await fetchPublicDistinctValues(docSlug.value, param.datasetId, col)
        const exact = values.find((v) => slugify(v) === seg)
        if (exact) { studio.setPageParam(param.name, exact); fanOutHydrated.value = true; return }
      } catch { /* best effort */ }
    }

    // Dernier recours : valeur dé-slugifiée.
    studio.setPageParam(param.name, term)
  }

  /** Applique la résolution du segment courant à l'état du store. */
  function applySegment() {
    if (!studio.pages.length) return
    const { page, fanOut } = resolveSegments(segment.value, fanOutSegment.value, studio.pages)
    if (!page) return

    const urlParams = queryToParams(route.query)

    if (fanOut) {
      studio.switchPageKeepParams(page.id)
      const deslug = fanOut.segment.replace(/-+/g, ' ')
      studio.setPageParam(fanOut.param.name, deslug)
      studio.setPageParam(fanOutSlugKey(fanOut.param), deslug)
      for (const [k, v] of Object.entries(urlParams)) studio.setPageParam(k, v)
      void hydrateFanOut(page, fanOut.param, fanOut.segment)
      return
    }

    fanOutHydrated.value = null
    studio.switchPage(page.id)
    for (const [k, v] of Object.entries(urlParams)) studio.setPageParam(k, v)
  }

  watch([segment, fanOutSegment], () => applySegment())

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
        {
          id: data.id,
          type: 'statsdata',
          title: data.title,
          status: data.status as 'draft' | 'published',
          slug: docSlug.value,
          download_enabled: data.download_enabled !== false,
          embed_enabled: data.embed_enabled !== false,
        },
        data.sections, data.blocks, data.pages,
      )

      const { page, fanOut } = resolveSegments(segment.value, fanOutSegment.value, studio.pages)
      if (!page) return

      const urlParams = queryToParams(route.query)
      const hasSaved = Object.keys(savedParams).length > 0

      if (fanOut) {
        studio.switchPageKeepParams(page.id)
        studio.setPageParams({ ...savedParams, ...urlParams })
        const deslug = fanOut.segment.replace(/-+/g, ' ')
        studio.setPageParam(fanOut.param.name, deslug)
        studio.setPageParam(fanOutSlugKey(fanOut.param), deslug)
        if (hasSaved) fanOutHydrated.value = true
        else void hydrateFanOut(page, fanOut.param, fanOut.segment)
        return
      }

      fanOutHydrated.value = null
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
    fanOutHydrated,
    activePage,
    publicPages,
    allPages,
    pageSections,
    canvasItems,
    resolveToken,
  }
}
