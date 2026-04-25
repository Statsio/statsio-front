import { watch, type Ref } from 'vue'
import { formatApiErrorDetail } from '@/lib/http-errors'
import type { StatsDataAnyQueryRequest } from '@/types/statsdata-query'
import type { StudioStatsDataWidgetContext } from '@/lib/studio-inject-keys'

export function useStudioWidgetQueryRunner(opts: {
  widgetCtx: Ref<StudioStatsDataWidgetContext>
  getQuery: () => StatsDataAnyQueryRequest
  enabled: () => boolean
  onDisabled: () => void
  onSuccess: (rows: Record<string, unknown>[], q: StatsDataAnyQueryRequest) => void
  onEmpty?: (q: StatsDataAnyQueryRequest) => void
  setLoading: (v: boolean) => void
  setError: (msg: string | null) => void
  errorMessage: string
  watchSources: () => unknown
}): { run: () => Promise<void> } {
  const run = async () => {
    opts.setError(null)
    if (!opts.widgetCtx.value.enabled || !opts.enabled()) {
      opts.onDisabled()
      return
    }

    const q = opts.getQuery()
    opts.setLoading(true)
    try {
      const rows = await opts.widgetCtx.value.executeQuery(q)
      if (!Array.isArray(rows) || rows.length === 0) {
        if (opts.onEmpty) opts.onEmpty(q)
        else opts.onSuccess([], q)
        return
      }
      opts.onSuccess(rows as Record<string, unknown>[], q)
    } catch (e) {
      opts.setError(formatApiErrorDetail(e, opts.errorMessage))
      opts.onDisabled()
    } finally {
      opts.setLoading(false)
    }
  }

  watch(
    () => opts.watchSources(),
    () => {
      void run()
    },
    { deep: true, immediate: true },
  )

  return { run }
}

