import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { StatsDataAnyQueryRequest } from '@/types/statsdata-query'
import type { StudioDataSource } from '@/types/studio-data-source'

export const studioDataSourcesKey: InjectionKey<Ref<StudioDataSource[]>> = Symbol('studioDataSources')

/** Sélection globale du studio (id de bloc, y compris imbriqués dans les layouts). */
export const studioSelectedBlockIdKey: InjectionKey<Ref<string | null>> = Symbol('studioSelectedBlockId')

/** Setter global de sélection (utilisé par les blocs imbriqués). */
export const studioSelectBlockKey: InjectionKey<(id: string | null) => void> = Symbol('studioSelectBlock')

/** Contexte widgets tableau / graphique en mode StatsData API (`POST .../query`). */
export type StudioStatsDataWidgetContext = {
  enabled: boolean
  documentId: string | null
  executeQuery: (body: StatsDataAnyQueryRequest) => Promise<Record<string, unknown>[]>
}

export const studioStatsDataWidgetKey: InjectionKey<ComputedRef<StudioStatsDataWidgetContext>> = Symbol(
  'studioStatsDataWidget',
)
