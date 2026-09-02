import { computed, inject, ref, watch, type ComputedRef, type Ref } from 'vue'
import { STUDIO_TOKEN_PATTERN } from '@/lib/studio-tokens'
import { STUDIO_EMBED_CONTEXT, type StudioEmbedContext } from '@/composables/studioEmbedContext'
import {
  isExpressionToken,
  parseExpression,
  evaluate,
  formatNumber,
  type AggregateRef,
} from '@/lib/studio-expression'
import { fetchScalarAggregate, fetchPublicScalarAggregate } from '@/api/studio'
import { blockSourceParams } from '@/composables/useBlockData'
import { makeColumnRef, parseColumnRef } from '@/lib/studio-columns'
import type { StudioBlock, BlockSource, BlockJoin } from '@/types/studio'

interface Options {
  /** Texte brut (peut contenir des `{{ }}`). */
  raw: () => string | undefined
  /** Variables disponibles : `pageParams` + scope de boucle. */
  tokenMap: () => Record<string, string>
  /** Bloc appelant — fournit les sources / jointures pour les agrégats `@<sourceId>`. */
  block?: () => StudioBlock | null
  /** Dataset du bloc appelant — utilisé quand une expression ne précise pas `@N` et qu'aucun bloc n'est fourni (ex. embed). */
  datasetId?: () => string | undefined
  /** Vue publiée → passe par les endpoints publics. */
  readonly?: () => boolean
  docSlug?: () => string | undefined
}

// Cache de session : les agrégats bougent peu, un rechargement de page suffit à vider.
const aggCache = new Map<string, Promise<number | null>>()

/** Vide le cache d'agrégats (tests, ou après une action qui change les données). */
export function clearAggregateCache(): void {
  aggCache.clear()
}

/** Clé de dépendance : dataset + sources + jointures du bloc appelant (pour les `watch`). */
function blockCtxKey(opts: { block?: () => StudioBlock | null; datasetId?: () => string | undefined }): string {
  const b = opts.block?.()
  return b
    ? `${b.datasetId ?? ''}|${JSON.stringify(b.sources ?? [])}|${b.primarySourceId ?? ''}|${JSON.stringify(b.joins ?? [])}`
    : (opts.datasetId?.() ?? '')
}

type AggregateContext = Pick<Options, 'block' | 'datasetId' | 'readonly' | 'docSlug'>

/**
 * Résout l'agrégat `ref` (issu de `{{ AVG(col@X) }}`) contre :
 * - une source du bloc appelant si `@X` correspond à un `BlockSource.id` (multi-sources
 *   → on envoie `sources`/`joins` pour que colonnes et filtres inter-sources se résolvent) ;
 * - sinon `@X` est traité comme un id de dataset brut (rétro-compat) ;
 * - sinon (pas de `@X`) la source primaire du bloc.
 */
function resolveAggregate(ref: AggregateRef, opts: AggregateContext): Promise<number | null> {
  if (ref.fn !== 'count' && !ref.column) return Promise.resolve(null)

  const block = opts.block?.()
  const sp = block ? blockSourceParams(block) : null
  const at = ref.datasetId
  const blockSource = at ? sp?.sources.find((s) => s.id === at) : undefined

  let urlDatasetId: string | undefined
  let column = ref.column === '*' ? (ref.filters[0]?.column ?? '') : ref.column
  let multi: { sources: BlockSource[]; primarySourceId: string; joins: BlockJoin[] } | undefined

  const filters = ref.filters.filter((f) => f.value !== '')

  if (blockSource && sp) {
    // `@X` = une source du bloc. Colonne qualifiée si source non primaire.
    column = makeColumnRef(column, at ?? null, sp.primarySourceId)
    urlDatasetId = sp.urlDatasetId
    const filterTouchesOther = filters.some((f) => {
      const { sourceId } = parseColumnRef(f.column)
      return sourceId && sourceId !== sp.primarySourceId && sp.sources.some((s) => s.id === sourceId)
    })
    if (sp.sources.length > 1 && (at !== sp.primarySourceId || filterTouchesOther)) {
      multi = { sources: sp.sources, primarySourceId: sp.primarySourceId, joins: sp.joins }
    }
  } else if (at) {
    // `@X` = id de dataset brut (rétro-compat) — requête directe sur ce dataset.
    urlDatasetId = at
  } else {
    urlDatasetId = sp?.urlDatasetId ?? opts.datasetId?.()
  }

  if (!urlDatasetId) return Promise.resolve(null)

  const readonly = opts.readonly?.() ?? false
  const docSlug = opts.docSlug?.()
  const cacheKey = `${readonly ? `pub:${docSlug}` : 'priv'}|${urlDatasetId}|${JSON.stringify(multi ?? null)}|${ref.key}`

  let hit = aggCache.get(cacheKey)
  if (!hit) {
    const params = { fn: ref.fn, column, filters, ...multi }
    hit = (readonly && docSlug
      ? fetchPublicScalarAggregate(docSlug, urlDatasetId, params)
      : fetchScalarAggregate(urlDatasetId, params)
    ).catch(() => null)
    aggCache.set(cacheKey, hit)
  }
  return hit
}

/** Substitution synchrone (variables seulement) — sans résolution d'expression. */
function substitutePlain(raw: string, map: Record<string, string>): string {
  return raw.replace(STUDIO_TOKEN_PATTERN, (match, key: string) => {
    if (isExpressionToken(key)) return match
    const direct = map[key]
    if (direct !== undefined) return direct
    return key.replace(/\w+/g, (name) => map[name] ?? name)
  })
}

/**
 * Résout les `{{ }}` d'un texte : variables (synchrone) + expressions calculées
 * (agrégats via l'API, arithmétique, format). Réactif ; `pending` pendant les
 * requêtes. Une seule passe → pas de boucle de substitution.
 */
export function useResolvedTokens(opts: Options): { text: Ref<string>; pending: Ref<boolean> } {
  const text = ref('')
  const pending = ref(false)

  // Bloc réutilisé dans un article (`sd-embed`) : agrégats `@N` et jetons `{{param}}`
  // se résolvent contre le Statsdata source, pas contre l'article courant.
  const embed = inject<StudioEmbedContext | null>(STUDIO_EMBED_CONTEXT, null)
  const effectiveOpts: Options = embed
    ? { ...opts, readonly: () => true, docSlug: () => embed.docSlug }
    : opts

  async function run() {
    const raw = opts.raw() ?? ''
    const map = embed ? { ...embed.params, ...opts.tokenMap() } : opts.tokenMap()

    if (!raw.includes('{{')) { text.value = raw; return }

    // 1. variables (immédiat)
    const base = substitutePlain(raw, map)
    text.value = base

    // 2. expressions
    const exprTokens: { match: string; key: string }[] = []
    base.replace(STUDIO_TOKEN_PATTERN, (match, key: string) => {
      if (isExpressionToken(key)) exprTokens.push({ match, key })
      return match
    })
    if (!exprTokens.length) return

    pending.value = true
    try {
      const parsed = exprTokens.map((t) => ({
        ...t,
        expr: parseExpression(t.key, (name) => map[name]),
      }))

      const refs = new Map<string, AggregateRef>()
      for (const p of parsed) for (const r of p.expr?.aggregates ?? []) refs.set(r.key, r)

      const values = new Map<string, number | null>()
      await Promise.all(
        [...refs.values()].map(async (r) => { values.set(r.key, await resolveAggregate(r, effectiveOpts)) }),
      )

      let out = base
      for (const p of parsed) {
        if (!p.expr) continue
        const n = evaluate(p.expr.node, values)
        const rendered = n === null ? '—' : formatNumber(n, p.expr.decimals)
        out = out.split(p.match).join(rendered)
      }
      text.value = out
    } finally {
      pending.value = false
    }
  }

  watch(
    () => `${opts.raw() ?? ''}|${JSON.stringify(opts.tokenMap())}|${blockCtxKey(opts)}|${embed ? `${embed.docSlug}:${JSON.stringify(embed.params)}` : ''}`,
    run,
    { immediate: true },
  )

  return { text, pending }
}

/**
 * Résout un lot d'agrégats (colonnes calculées de tableau, etc.) → `Map<key, valeur>`.
 * Réactif au lot fourni ; partage le cache de {@link useResolvedTokens}.
 */
export function useAggregateValues(
  opts: Omit<Options, 'raw' | 'tokenMap'> & { refs: () => AggregateRef[] },
): { values: Ref<Map<string, number | null>>; pending: Ref<boolean> } {
  const values = ref(new Map<string, number | null>())
  const pending = ref(false)

  watch(
    () => opts.refs().map((r) => r.key).join('|') + '|' + blockCtxKey(opts),
    async () => {
      const refs = opts.refs()
      if (!refs.length) { values.value = new Map(); return }
      pending.value = true
      try {
        const next = new Map<string, number | null>()
        await Promise.all(refs.map(async (r) => { next.set(r.key, await resolveAggregate(r, opts)) }))
        values.value = next
      } finally {
        pending.value = false
      }
    },
    { immediate: true },
  )

  return { values, pending }
}

/**
 * Résout une expression unique (ligne de référence de graphique, pastille de
 * tendance calculée…) en nombre. `null` tant que non résolu / si invalide.
 */
export function useExpressionNumber(
  opts: Omit<Options, 'raw'> & { expression: () => string | undefined },
): { value: Ref<number | null>; pending: Ref<boolean> } {
  const { text, pending } = useResolvedTokens({
    ...opts,
    raw: () => {
      const e = opts.expression()?.trim()
      return e ? `{{ ${e} }}` : ''
    },
  })
  const value = computed<number | null>(() => {
    if (!opts.expression()?.trim()) return null
    // `text` = nombre formaté FR ("2 382,50") → on reparse.
    const n = Number(text.value.replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(n) ? n : null
  })
  return { value, pending }
}

const LIST_SEP = '␞'

/** Comme {@link useResolvedTokens} mais pour une liste de chaînes (ex. items « À retenir »). */
export function useResolvedTokenList(
  opts: Omit<Options, 'raw'> & { items: () => string[] },
): { list: ComputedRef<string[]>; pending: Ref<boolean> } {
  const { text, pending } = useResolvedTokens({
    ...opts,
    raw: () => opts.items().join(LIST_SEP),
  })
  const list = computed(() => (opts.items().length ? text.value.split(LIST_SEP) : []))
  return { list, pending }
}
