<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchBlockData, fetchPublicBlockData } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import { blockSourceParams, resolveBlockFilterGroups } from '@/composables/useBlockData'
import { bareNames } from '@/lib/studio-search'
import { buildFanOutSegment, fanOutSlugKey } from '@/lib/statsdata-fanout'
import { isCalcRef, parseColumnRef } from '@/lib/studio-columns'
import { STUDIO_EMBED_CONTEXT, type StudioEmbedContext } from '@/composables/studioEmbedContext'
import type { BlockQueryResult, ResultPart, StudioBlock, StudioDocumentPage, PageParam } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const studio = useStudioStore()
const route  = useRoute()
const router = useRouter()

// Bloc de recherche réutilisé dans un article : navigation + requêtes ciblent
// le Statsdata source, pas l'article courant.
const embed = inject<StudioEmbedContext | null>(STUDIO_EMBED_CONTEXT, null)
const availablePages = computed<StudioDocumentPage[]>(() => embed?.pages ?? studio.pages)

// ─── Config ───────────────────────────────────────────────────────────────────

const fm = computed(() => props.block.fieldMapping)
const cfg = computed(() => props.block.config)

const sourceParams = computed(() => blockSourceParams(props.block))
/** Réfs qualifiées des colonnes d'identité (envoyées à l'API — résolues côté serveur). */
const searchRefs = computed(() => fm.value.searchColumns ?? [])
/** Réfs qualifiées des colonnes de recherche secondaires (« OU »). */
const searchAltRefs = computed(() => fm.value.searchAltColumns ?? [])
/** Noms nus des colonnes d'identité (pour indexer les lignes de résultat renvoyées par l'API). */
const searchCols = computed(() => bareNames(fm.value.searchColumns))
const titleParts = computed<ResultPart[]>(() => fm.value.resultTitleParts ?? [])
const descParts = computed<ResultPart[]>(() => fm.value.resultDescParts ?? [])
const titleSeparator = computed(() => cfg.value.resultTitleSeparator ?? ' ')
const placeholder = computed(() => cfg.value.searchPlaceholder || 'Rechercher…')

const isConfigured = computed(() => Boolean(sourceParams.value.urlDatasetId) && searchCols.value.length > 0)

const docSlug = computed(() => embed?.docSlug || String(route.params.slug ?? ''))

/** Page à laquelle appartient ce bloc (fan-out cible). */
const blockPage = computed<StudioDocumentPage | undefined>(() => {
  const pid = studio.pageIdOfBlock(props.block.id)
  return availablePages.value.find((p) => p.id === pid) ?? availablePages.value[0]
})
const fanParam = computed<PageParam | undefined>(() => {
  const params = blockPage.value?.params ?? []
  return params.find((p) => p.searchBlockId === props.block.id) ?? params.find((p) => p.fanOut && p.name)
})

// ─── State ────────────────────────────────────────────────────────────────────

interface SearchResult {
  key: string
  title: string
  subValues: { label: string; value: string }[]
  row: Record<string, unknown>
}

/** Colonnes de recherche + parties de titre/description effectives pour un groupe de résultats. */
interface SearchGroupCtx {
  searchCols: string[]
  titleParts: ResultPart[]
  descParts: ResultPart[]
}

const primaryGroupCtx = computed<SearchGroupCtx>(() => ({
  searchCols: searchCols.value,
  titleParts: titleParts.value,
  descParts: descParts.value,
}))

/**
 * Groupe d'une ligne de résultat : 0 = source principale, i>0 = i-ème source
 * additionnelle (`block.searchUnionGroups`, sans lien avec la principale — voir
 * `SearchUnionGroup`). Ces groupes n'ont pas de titre/description personnalisés :
 * toujours le repli automatique (1re colonne de recherche trouvée).
 */
function groupCtxFor(searchGroupIndex: number): SearchGroupCtx {
  if (!searchGroupIndex) return primaryGroupCtx.value
  const g = props.block.searchUnionGroups?.[searchGroupIndex - 1]
  return { searchCols: bareNames(g?.searchColumns), titleParts: [], descParts: [] }
}

const query       = ref('')
const results     = ref<SearchResult[]>([])
const isLoading   = ref(false)
const isOpen      = ref(false)
const searchError = ref('')
const inputRef    = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// ─── Dropdown positioning ─────────────────────────────────────────────────────

const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })

function updateDropdownPosition() {
  const el = inputRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  dropdownStyle.value = {
    top:   `${rect.bottom + 4}px`,
    left:  `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

// ─── Résolution des valeurs d'une ligne ──────────────────────────────────────

function cellValue(row: Record<string, unknown>, ref: string, columnMap?: Record<string, string>): string {
  const mapped = columnMap?.[ref]
  if (mapped != null && row[mapped] != null) return String(row[mapped])
  if (row[ref] != null) return String(row[ref])
  const bare = parseColumnRef(ref).name
  return row[bare] != null ? String(row[bare]) : ''
}

function partLabel(part: ResultPart): string {
  return part.label || (isCalcRef(part.ref) ? 'Valeur' : parseColumnRef(part.ref).name)
}

function buildTitle(row: Record<string, unknown>, columnMap?: Record<string, string>, group: SearchGroupCtx = primaryGroupCtx.value): string {
  if (!group.titleParts.length) {
    // Repli : 1re colonne recherchée qui contient la requête, sinon la 1re.
    const q = query.value.toLowerCase()
    const hit = group.searchCols.find((c) => String(row[c] ?? '').toLowerCase().includes(q))
    return String(row[hit ?? group.searchCols[0] ?? ''] ?? '')
  }
  return group.titleParts
    .map((p) => `${p.prefix ?? ''}${cellValue(row, p.ref, columnMap)}${p.suffix ?? ''}`)
    .join(titleSeparator.value)
    .trim()
}

function buildSubValues(row: Record<string, unknown>, columnMap?: Record<string, string>, group: SearchGroupCtx = primaryGroupCtx.value) {
  if (group.descParts.length) {
    return group.descParts
      .map((p) => ({ label: partLabel(p), value: cellValue(row, p.ref, columnMap) }))
      .filter((s) => s.value !== '')
  }
  // Repli : colonnes recherchées non utilisées dans le titre.
  const titleCols = new Set(group.titleParts.map((p) => parseColumnRef(p.ref).name))
  return group.searchCols
    .filter((c) => !titleCols.has(c) && row[c] != null && row[c] !== '')
    .map((c) => ({ label: c, value: String(row[c]) }))
}

// ─── Search logic ─────────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSearch(q: string) {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (q.length < 2) {
    results.value = []
    searchError.value = ''
    isOpen.value = false
    isLoading.value = false
    return
  }
  isLoading.value = true
  isOpen.value = true
  debounceTimer = setTimeout(() => doSearch(q), 250)
}

async function doSearch(q: string) {
  searchError.value = ''
  const sp = sourceParams.value
  if (!sp.urlDatasetId) return
  const calcColumns = fm.value.calcColumns?.length ? fm.value.calcColumns : undefined
  const filters = resolveBlockFilterGroups(props.block, 'primary', studio.pageParams)
  // Sources additionnelles sans lien avec la principale (pas de jointure possible) :
  // interrogées séparément côté API puis empilées sous les résultats principaux.
  const unionGroups = (props.block.searchUnionGroups ?? []).filter((g) => g.source.datasetId && g.searchColumns.length)
  const params = {
    sources: sp.sources,
    primarySourceId: sp.primarySourceId,
    joins: sp.joins,
    searchQ: q,
    searchColumns: searchRefs.value,
    searchAltColumns: searchAltRefs.value,
    unionGroups: unionGroups.length ? unionGroups : undefined,
    calcColumns,
    filterGroups: filters.groups.length ? filters.groups : undefined,
    filtersMatch: filters.match,
    limit: 30,
  }
  try {
    const querySlug = embed?.docSlug ?? studio.content?.slug
    const res: BlockQueryResult = (props.readonly && querySlug)
      ? await fetchPublicBlockData(querySlug, sp.urlDatasetId, params)
      : await fetchBlockData(sp.urlDatasetId, params)

    const seen = new Set<string>()
    const out: SearchResult[] = []
    for (const raw of res.rows) {
      // `__search_group` (0 = principale, i>0 = i-ème source additionnelle) tague
      // l'origine d'une ligne empilée côté API — jamais un vrai champ de données.
      const { __search_group: searchGroupIndex, ...row } = raw as Record<string, unknown> & { __search_group?: number }
      const group = groupCtxFor(typeof searchGroupIndex === 'number' ? searchGroupIndex : 0)
      const title = buildTitle(row, res.columnMap, group)
      if (!title) continue
      // Dédoublonnage sur l'identité complète (colonnes recherchées du groupe) —
      // deux résultats peuvent partager le même titre (ex. deux communes « Grigny »).
      const identity = group.searchCols.map((c) => String(row[c] ?? '')).join(' | ')
      const dedupeKey = `${title} | ${identity}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      out.push({ key: dedupeKey, title, subValues: buildSubValues(row, res.columnMap, group), row })
    }
    results.value = out
  } catch (e: unknown) {
    results.value = []
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    searchError.value = msg ?? 'La recherche a échoué. Réessayez dans quelques instants.'
  } finally {
    isLoading.value = false
  }
}

watch(query, (q: string) => {
  if (!isConfigured.value) return
  updateDropdownPosition()
  scheduleSearch(q)
})

watch(searchCols, () => {
  query.value = ''
  results.value = []
  isOpen.value = false
})

// ─── Select a result ─────────────────────────────────────────────────────────

function onSelect(result: SearchResult) {
  query.value = result.title
  isOpen.value = false

  // Toutes les colonnes de la ligne choisie (résolvent les jetons `{{col}}`).
  const rowParams: Record<string, string> = {}
  for (const [col, val] of Object.entries(result.row)) {
    if (val !== null && val !== undefined && val !== '') rowParams[col] = String(val)
  }

  const param = fanParam.value
  const seg = param ? buildFanOutSegment(param, result.row) : ''

  // Recherche embarquée dans un article : on quitte l'article pour le Statsdata source.
  if (embed && docSlug.value) {
    if (seg) router.push(`/statsdata/${docSlug.value}/${seg}`)
    else router.push(`/statsdata/${docSlug.value}`)
    return
  }

  // Rendu public : URL indexable /statsdata/{slug}/{segment}.
  if (props.readonly && docSlug.value && seg) {
    studio.setPageParams({ ...studio.pageParams, ...rowParams })
    router.push(`/statsdata/${docSlug.value}/${seg}`)
    return
  }

  // Éditeur (aperçu) ou pas de fan-out : on filtre la page courante.
  studio.setPageParams({ ...studio.pageParams, ...rowParams })
}

// ─── Option déjà sélectionnée (choisie, ou déduite des pageParams/URL) ───────

/** Une valeur pour chaque colonne d'identité est déjà posée dans les pageParams. */
const isSelected = computed(() =>
  isConfigured.value && searchCols.value.every((c) => {
    const v = studio.pageParams[c]
    return v != null && v !== ''
  }),
)

/** Même construction que les résultats de la liste — à partir des pageParams. */
const selectedTitle = computed(() => (isSelected.value ? buildTitle(studio.pageParams) : ''))

function clearSelection() {
  const param = fanParam.value
  const currentSeg = param ? buildFanOutSegment(param, studio.pageParams) : ''
  const onFanOutUrl = Boolean(docSlug.value) && String(route.params.pageSlug ?? '') === currentSeg && currentSeg !== ''

  const next = { ...studio.pageParams }
  for (const c of searchCols.value) delete next[c]
  for (const p of titleParts.value) delete next[parseColumnRef(p.ref).name]
  for (const p of descParts.value) delete next[parseColumnRef(p.ref).name]
  if (param) {
    delete next[param.name]
    delete next[fanOutSlugKey(param)]
  }
  studio.setPageParams(next)
  query.value = ''
  results.value = []
  isOpen.value = false

  if (onFanOutUrl) router.push(`/statsdata/${docSlug.value}`)
}

function onFocus() {
  if (!isConfigured.value) return
  updateDropdownPosition()
  if (query.value.length >= 2) isOpen.value = true
}

function handleOutsideClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
  window.addEventListener('scroll', updateDropdownPosition, true)
  window.addEventListener('resize', updateDropdownPosition)
})
onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  document.removeEventListener('mousedown', handleOutsideClick)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})
</script>

<template>
  <div>
    <!-- Not configured -->
    <div v-if="!isConfigured" class="flex flex-col items-center justify-center gap-2 py-6 text-[var(--studio-faint)]">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <span class="text-xs">Choisissez une source et des colonnes de recherche →</span>
    </div>

    <!-- Option sélectionnée : on masque le champ de recherche -->
    <div
      v-else-if="isSelected"
      class="flex items-center gap-2.5 rounded-xl border border-[var(--studio-line-strong)] bg-[color-mix(in_srgb,var(--studio-ink)_5%,transparent)] py-3.5 pl-4 pr-4"
    >
      <svg class="w-4 h-4 shrink-0 text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <p class="min-w-0 flex-1 truncate text-sm text-[var(--studio-ink)]">{{ selectedTitle }}</p>
      <button
        type="button"
        class="shrink-0 text-[11px] font-semibold text-[var(--color-primary)] hover:underline"
        @click="clearSelection"
      >
        Changer
      </button>
    </div>

    <!-- Search UI -->
    <div v-else ref="containerRef" class="relative w-full">
      <div
        class="flex cursor-text items-center gap-2.5 rounded-xl border border-[var(--studio-line-strong)] bg-[color-mix(in_srgb,var(--studio-ink)_5%,transparent)] py-3.5 pl-4 pr-4 transition-colors focus-within:ring-2 focus-within:ring-[var(--color-primary)]/25"
        @click="inputRef?.focus()"
      >
        <svg
          class="w-4 h-4 shrink-0 text-[var(--studio-faint)] pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          :placeholder="placeholder"
          class="min-w-0 flex-1 bg-transparent text-sm text-[var(--studio-ink)] placeholder-[var(--studio-faint)] outline-none"
          @focus="onFocus"
        />
        <svg
          v-if="isLoading"
          class="w-4 h-4 shrink-0 text-[var(--studio-faint)] animate-spin"
          fill="none" viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <p v-if="query.length > 0 && query.length < 2" class="mt-1 text-[11px] text-[var(--studio-faint)] pl-1">
        Tapez au moins 2 caractères…
      </p>

      <!-- Dropdown via Teleport -->
      <Teleport to="body">
        <div
          v-if="isOpen && results.length > 0"
          class="fixed z-[9999] bg-white border border-[var(--studio-line)] rounded-xl shadow-xl max-h-64 overflow-y-auto"
          :style="dropdownStyle"
        >
          <button
            v-for="result in results"
            :key="result.key"
            type="button"
            class="w-full text-left px-4 py-2.5 hover:bg-[var(--studio-note)] transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-[var(--studio-line)] last:border-0"
            @mousedown.prevent="onSelect(result)"
          >
            <p class="text-sm font-medium text-[var(--studio-ink)]">{{ result.title }}</p>
            <div v-if="result.subValues.length > 0" class="flex flex-wrap gap-2 mt-0.5">
              <span
                v-for="sub in result.subValues"
                :key="sub.label"
                class="text-[11px] text-[var(--studio-faint)]"
              >
                <span class="font-medium text-[var(--studio-muted)]">{{ sub.label }}</span> {{ sub.value }}
              </span>
            </div>
          </button>
        </div>

        <div
          v-else-if="isOpen && !isLoading && searchError && query.length >= 2"
          class="fixed z-[9999] bg-white border border-[var(--studio-line)] rounded-xl shadow-sm px-4 py-3 text-sm text-red-500"
          :style="dropdownStyle"
        >
          {{ searchError }}
        </div>

        <div
          v-else-if="isOpen && !isLoading && query.length >= 2"
          class="fixed z-[9999] bg-white border border-[var(--studio-line)] rounded-xl shadow-sm px-4 py-3 text-sm text-[var(--studio-faint)]"
          :style="dropdownStyle"
        >
          Aucun résultat pour « {{ query }} »
        </div>
      </Teleport>
    </div>
  </div>
</template>
