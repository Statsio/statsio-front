import { computed, type ComputedRef, type Ref } from 'vue'
import type { PageParam, Section, StudioBlock, StudioDocumentPage } from '@/types/studio'
import { isPageZone, pageIdFromZone, scriptIdFromZone } from '@/types/studio'
import { desiredSearchPageParam, sameSearchPageParam } from '@/lib/studio-search'
import { desiredParamBlockPageParam, sameParamBlockPageParam } from '@/lib/studio-param'

/**
 * Valeurs initiales de `pageParams` pour une page : la `defaultValue` de chaque
 * paramètre déclaré qui en porte une. Une page sans paramètre → `{}` (comportement
 * historique inchangé).
 */
export function defaultParamsForPage(page: StudioDocumentPage | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  for (const p of page?.params ?? []) {
    if (p.name && p.defaultValue != null && p.defaultValue !== '') out[p.name] = p.defaultValue
  }
  return out
}

export function useStudioPageParams(deps: {
  pages: Ref<StudioDocumentPage[]>
  sections: Ref<Section[]>
  blocks: Ref<StudioBlock[]>
  currentPageId: Ref<string>
  pageParams: Ref<Record<string, string>>
  currentPage: ComputedRef<StudioDocumentPage | undefined>
  snapshot: () => void
  markDirty: () => void
}) {
  const { pages, sections, blocks, currentPageId, pageParams, currentPage, snapshot, markDirty } = deps

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

  // ─── Bloc recherche : paramètre point-barre auto-géré ────────────────────────
  // Un bloc recherche déclare toujours, de façon invisible, exactement un
  // `PageParam` (fan-out) sur sa propre page, dérivé de ses `searchColumns`.
  // Aucun réglage exposé — voir `desiredSearchPageParam`.

  /** Id de la page à laquelle appartient une zone (remonte sections + zones de script). */
  function pageIdOfZone(zoneId: string | undefined): string | undefined {
    if (!zoneId) return undefined
    if (isPageZone(zoneId)) return pageIdFromZone(zoneId) ?? undefined
    const scriptId = scriptIdFromZone(zoneId)
    if (scriptId) {
      const parent = blocks.value.find((b: StudioBlock) => b.id === scriptId)
      return parent ? pageIdOfZone(parent.zoneId) : undefined
    }
    const sectionId = zoneId.replace(/-\d+$/, '')
    const section = sections.value.find((s: Section) => s.id === sectionId)
    if (!section) return undefined
    return section.zoneId ? pageIdOfZone(section.zoneId) : (section.pageId ?? 'default')
  }

  function pageIdOfBlock(blockId: string): string | undefined {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    return block ? pageIdOfZone(block.zoneId) : undefined
  }

  /** Réconcilie le `PageParam` géré par un bloc recherche (add / update / remove). */
  function syncSearchPageParam(blockId: string) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block || block.type !== 'search') return
    const targetPageId = pageIdOfBlock(blockId)
    const ownedByBlock = (p: PageParam) => p.searchBlockId === blockId

    // Retire les déclarations de ce bloc restées sur d'autres pages.
    for (const page of pages.value) {
      if (!page.params?.length) continue
      const keep = page.params.filter((p) => !(ownedByBlock(p) && page.id !== targetPageId))
      if (keep.length !== page.params.length) page.params = keep.length ? keep : undefined
    }

    const page = targetPageId ? pages.value.find((p: StudioDocumentPage) => p.id === targetPageId) : undefined
    if (!page) return

    const existing = (page.params ?? []).find(ownedByBlock)
    const reserved = new Set<string>()
    for (const p of page.params ?? []) if (!ownedByBlock(p)) reserved.add(p.name)
    const desired = desiredSearchPageParam(block, { existingName: existing?.name, reserved })

    if (!desired) {
      if (existing) {
        const next = (page.params ?? []).filter((p) => !ownedByBlock(p))
        page.params = next.length ? next : undefined
      }
      return
    }

    // Sur une page pilotée par un bloc recherche : un seul param fan-out, le sien.
    // Purge les params fan-out legacy (déclarés sans propriétaire) ; conserve la
    // déclaration d'un bloc `param` mais lui retire le fan-out (recherche prioritaire).
    let params = (page.params ?? []).filter(
      (p) => ownedByBlock(p) || !(p.fanOut && !p.searchBlockId && !p.paramBlockId),
    )
    params = params.map((p) =>
      p.paramBlockId && p.fanOut ? { ...p, fanOut: undefined, slugColumn: undefined } : p,
    )

    if (!existing) {
      params = [...params.filter((p) => p.name !== desired.name), desired]
    } else if (!sameSearchPageParam(existing, desired)) {
      params = params.map((p) => (ownedByBlock(p) ? desired : p))
    }
    page.params = params
  }

  function syncAllSearchPageParams() {
    for (const b of blocks.value) if (b.type === 'search') syncSearchPageParam(b.id)
  }

  // ─── Bloc paramètre : `PageParam` visible auto-géré ──────────────────────────
  // Comme le bloc recherche, un bloc `param` déclare toujours exactement un
  // `PageParam` (fan-out) sur sa page — mais visible (contrôle pastilles / liste).
  // Aucun réglage « générer une page » : le fan-out est automatique.

  /** Réconcilie le `PageParam` géré par un bloc `param` (add / update / remove). */
  function syncParamBlockPageParam(blockId: string) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block || block.type !== 'param') return
    const targetPageId = pageIdOfBlock(blockId)
    const ownedByBlock = (p: PageParam) => p.paramBlockId === blockId

    // Retire les déclarations de ce bloc restées sur d'autres pages (déplacement).
    for (const page of pages.value) {
      if (!page.params?.length) continue
      const keep = page.params.filter((p) => !(ownedByBlock(p) && page.id !== targetPageId))
      if (keep.length !== page.params.length) page.params = keep.length ? keep : undefined
    }

    const page = targetPageId ? pages.value.find((p: StudioDocumentPage) => p.id === targetPageId) : undefined
    if (!page) return

    const existing = (page.params ?? []).find(ownedByBlock)
    const pageHasForeignFanOut = (page.params ?? []).some((p) => p.fanOut && p.searchBlockId)
    const desired = desiredParamBlockPageParam(block, { pageHasForeignFanOut })

    if (!desired) {
      if (existing) {
        const next = (page.params ?? []).filter((p) => !ownedByBlock(p))
        page.params = next.length ? next : undefined
      }
      return
    }

    let params = [...(page.params ?? [])]

    // Adoption d'une déclaration orpheline (ancien `watch` de l'inspecteur, ou
    // migration legacy `isTemplate`) : même nom, sans propriétaire.
    const orphanIdx = params.findIndex(
      (p) => !p.searchBlockId && !p.paramBlockId && p.name === desired.name,
    )
    if (!existing && orphanIdx >= 0) {
      params[orphanIdx] = { ...params[orphanIdx], ...desired }
    } else if (!existing) {
      params = [...params.filter((p) => p.name !== desired.name), desired]
    } else if (!sameParamBlockPageParam(existing, desired)) {
      params = params.map((p) => (ownedByBlock(p) ? { ...p, ...desired } : p))
    }

    // Renommage de `paramName` : supprime les déclarations possédées au mauvais nom.
    params = params.filter((p) => !(ownedByBlock(p) && p.name !== desired.name))
    if (!params.some(ownedByBlock)) params.push(desired)

    page.params = params
  }

  function syncAllParamBlockPageParams() {
    for (const b of blocks.value) if (b.type === 'param') syncParamBlockPageParam(b.id)
  }

  /** Réconcilie le `PageParam` auto-géré du bloc (recherche ou paramètre). */
  function syncAutoPageParam(blockId: string) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (block?.type === 'search') syncSearchPageParam(blockId)
    else if (block?.type === 'param') syncParamBlockPageParam(blockId)
  }

  return {
    currentPageParamDefs,
    hasActivePageFilters,
    seedCurrentPageParamDefaults,
    addPageParam,
    updatePageParam,
    removePageParam,
    pageIdOfZone,
    pageIdOfBlock,
    syncSearchPageParam,
    syncAllSearchPageParams,
    syncParamBlockPageParam,
    syncAllParamBlockPageParams,
    syncAutoPageParam,
  }
}
