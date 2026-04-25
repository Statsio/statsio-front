import { inject, computed, type Ref, type ComputedRef } from 'vue'
import { studioPageFiltersKey } from '@/lib/studio-inject-keys'
import type { StatsDataAnyQueryRequest } from '@/types/statsdata-query'
import type { StatsDataQueryRequestV2, StatsDataQueryWhereConditionV2 } from '@/types/statsdata-query-v2'

/**
 * Résout les références @pageFilter.xxx dans une chaîne
 */
function resolvePageFilterRefs(value: string, filters: Record<string, string>): string {
  return value.replace(/@pageFilter\.(\w+)/g, (_, key) => {
    return filters[key] ?? ''
  })
}

/**
 * Composable pour utiliser les filtres de page dans les blocs
 */
export function usePageFilters() {
  const pageFilters = inject(studioPageFiltersKey, null)

  const hasFilters = computed(() => {
    if (!pageFilters) return false
    return Object.keys(pageFilters.value).length > 0
  })

  /**
   * Applique les filtres de page à une requête StatsData
   */
  function applyFiltersToQuery(query: StatsDataAnyQueryRequest | undefined): StatsDataAnyQueryRequest | undefined {
    console.log('applyFiltersToQuery called', { query, filters: pageFilters?.value })

    if (!query) {
      return query
    }

    const filters = pageFilters?.value ?? {}

    // Pour les requêtes v2
    if ((query as any).specVersion === 2) {
      const v2Query = query as StatsDataQueryRequestV2

      // Résoudre les @pageFilter dans les conditions WHERE existantes
      const resolvedWhere = (v2Query.where ?? []).map(condition => {
        if (condition.right.kind === 'literal') {
          return {
            ...condition,
            right: {
              ...condition.right,
              value: resolvePageFilterRefs(condition.right.value, filters),
            },
          }
        }
        return condition
      })

      // Ajouter les filtres de page comme conditions WHERE supplémentaires
      // Utiliser l'alias de la première source si disponible
      const firstAlias = v2Query.sources?.[0]?.alias ?? 's'
      const filterConditions = Object.entries(filters).map(([column, value]) => {
        // Si la colonne contient déjà un point (alias.field), l'utiliser tel quel
        // Sinon, ajouter l'alias de la première source
        const columnWithAlias = column.includes('.') ? column : `${firstAlias}.${column}`
        return {
          kind: 'eq' as const,
          left: { kind: 'column' as const, column: columnWithAlias },
          right: { kind: 'literal' as const, value },
        }
      })

      // Créer une copie sans groupBy et aggregations
      const { groupBy, aggregations, ...v2QueryWithoutAgg } = v2Query

      const result = {
        ...v2QueryWithoutAgg,
        where: [...resolvedWhere, ...filterConditions],
      }

      console.log('applyFiltersToQuery result', result)
      console.log('WHERE conditions:', JSON.stringify(result.where, null, 2))
      return result
    }

    // Pour les requêtes v1 (legacy)
    const v1Query = query as any
    const existingFilters = v1Query.filters || {}

    return {
      ...v1Query,
      filters: {
        ...existingFilters,
        ...filters,
      },
    }
  }

  /**
   * Filtre les lignes localement (pour les sources non-remote)
   */
  function filterLocalRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    if (!pageFilters || !hasFilters.value) {
      return rows
    }

    const filters = pageFilters.value

    return rows.filter(row => {
      return Object.entries(filters).every(([column, value]) => {
        return String(row[column]) === value
      })
    })
  }

  return {
    pageFilters: pageFilters || (computed(() => ({})) as Ref<Record<string, string>>),
    hasFilters,
    applyFiltersToQuery,
    filterLocalRows,
  }
}
