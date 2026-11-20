import { computed, watch } from 'vue'
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
import { useViewerDocRefresh } from '@/composables/useViewerDocRefresh'
import { isHttpError } from '@/lib/http'

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

  /**
   * État d'hydratation d'une page fan-out atteinte par valeur :
   *  - `null` : la page courante n'est pas une valeur de fan-out ;
   *  - `true` : le segment d'URL correspond à une vraie ligne / valeur distincte ;
   *  - `false` : aucune correspondance — on n'a qu'un repli dé-slugifié (page « mince »).
   * Sert à sortir de l'index les valeurs de fan-out sans contenu réel.
   */
  const fanOutHydrated = useState<boolean | null>(`statsdata-fanout-${docSlug.value}`, () => null)

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
            if (sourceId) rowParams.__source_id = sourceId
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
      // Navigation in-app depuis un bloc recherche : la ligne exacte est déjà
      // posée dans les pageParams — on ne l'écrase pas par un repli dé-slugifié.
      if (paramsMatchSegment(fanOut.param, fanOut.segment)) {
        const slugKey = fanOutSlugKey(fanOut.param)
        const exact = studio.pageParams[slugKey]
        if (exact && !studio.pageParams[fanOut.param.name]) studio.setPageParam(fanOut.param.name, exact)
        for (const [k, v] of Object.entries(urlParams)) studio.setPageParam(k, v)
        fanOutHydrated.value = true
        return
      }
      const deslug = fanOut.segment.replace(/-+/g, ' ')
      studio.setPageParam(fanOut.param.name, deslug)
      studio.setPageParam(fanOutSlugKey(fanOut.param), deslug)
      for (const [k, v] of Object.entries(urlParams)) studio.setPageParam(k, v)
      void hydrateFanOut(page, fanOut.param, fanOut.segment)
      return
    }

    fanOutHydrated.value = null
    // Même page (ex. réinitialisation d'un bloc recherche) : on garde les autres
    // paramètres en cours ; sinon (changement d'onglet) on repart des défauts.
    if (studio.currentPageId === page.id) studio.switchPageKeepParams(page.id)
    else studio.switchPage(page.id)
    for (const [k, v] of Object.entries(urlParams)) studio.setPageParam(k, v)
  }

  /** Les pageParams courants produisent-ils déjà ce segment fan-out ? */
  function paramsMatchSegment(param: PageParam, seg: string): boolean {
    const params = studio.pageParams
    if (buildFanOutSegment(param, params) === seg) return true
    const sourceId = params.__source_id
    if (!sourceId) return false
    return studio.blocks.some((b: StudioBlock) => {
      if (b.type !== 'search' || !isUnionBlock(b)) return false
      const cols = fanOutColumnsForSource(b, sourceId, params)
      return cols.length > 0 && buildFanOutSegment({ ...param, columns: cols }, params) === seg
    })
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

  // Capturé au setup : après un `await`, le contexte Nuxt n'est plus disponible.
  const requestEvent = import.meta.server ? useRequestEvent() : undefined

  /** Charge le document et applique le segment d'URL au store (serveur ou client). */
  async function loadDocument(): Promise<StatsDataDocument | null> {
    let data: StatsDataDocument
    try {
      data = await fetchPublicStatsDataDocument(docSlug.value)
    } catch (e) {
      // Vrai 404 HTTP pour les robots plutôt qu'une page vide en 200.
      if (requestEvent && isHttpError(e) && e.response?.status === 404) {
        setResponseStatus(requestEvent, 404)
      }
      throw e
    }
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
    if (!page) return data

    const urlParams = queryToParams(route.query)
    const hasSaved = Object.keys(savedParams).length > 0

    if (fanOut) {
      studio.switchPageKeepParams(page.id)
      studio.setPageParams({ ...savedParams, ...urlParams })
      const deslug = fanOut.segment.replace(/-+/g, ' ')
      studio.setPageParam(fanOut.param.name, deslug)
      studio.setPageParam(fanOutSlugKey(fanOut.param), deslug)
      if (hasSaved) fanOutHydrated.value = true
      // Côté serveur on attend la vraie valeur : elle entre dans le <title> / la description.
      else if (import.meta.server) await hydrateFanOut(page, fanOut.param, fanOut.segment)
      else void hydrateFanOut(page, fanOut.param, fanOut.segment)
      return data
    }

    fanOutHydrated.value = null
    studio.switchPage(page.id)
    studio.setPageParams({ ...(hasSaved ? savedParams : {}), ...urlParams })
    return data
  }

  // Document chargé côté serveur pour que Google reçoive titre, description, h1
  // et contenu (sinon la page sort vide et passe pour un doublon de l'accueil).
  // `useAsyncData` fait attendre le rendu serveur ; au chargement initial, le
  // client reprend le document du payload et le store Pinia hydraté (pas de refetch).
  const { data: asyncDoc, status, error: asyncError } = useAsyncData(
    `statsdata-doc-${docSlug.value}`,
    loadDocument,
  )
  const doc = computed(() => asyncDoc.value ?? null)
  const loading = computed(() => status.value === 'idle' || status.value === 'pending')
  const error = computed(() => (asyncError.value ? 'Document introuvable ou non publié.' : null))

  useViewerDocRefresh(asyncDoc, () => fetchPublicStatsDataDocument(docSlug.value))

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
