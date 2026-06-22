import { ref, computed, onMounted } from 'vue'
import { fetchTvAudiences } from '@/api/tv-audiences'
import { TNT_CHANNELS } from '@/data/tnt-channels'
import type { AudienceApiResponse, AudienceSortKey, ChannelYearData, Top50Category, Top50Record } from '@/types/tv-audiences'
import type { TntChannel } from '@/data/tnt-channels'

const DEFAULT_CHANNELS = ['tf1', 'france2', 'm6', 'france3', 'arte', 'canalplus']

// Chart color per channel (distinct hex values)
export const CHANNEL_CHART_COLORS: Record<string, string> = {
  tf1:         '#0052cc',
  france2:     '#d7263d',
  france3:     '#2463eb',
  canalplus:   '#0f172a',
  france5:     '#e63946',
  m6:          '#64748b',
  arte:        '#f97316',
  c8:          '#9333ea',
  w9:          '#0ea5e9',
  tmc:         '#06b6d4',
  tfx:         '#f59e0b',
  nrj12:       '#dc2626',
  lcp:         '#4f46e5',
  france4:     '#16a34a',
  bfmtv:       '#1d4ed8',
  cnews:       '#7c3aed',
  cstar:       '#db2777',
  gulli:       '#d97706',
  franceinfo:  '#0891b2',
}

export type YearDataWithChannel = ChannelYearData & { channel: TntChannel }

export function useTvAudiences() {
  const apiData    = ref<AudienceApiResponse | null>(null)
  const isLoading  = ref(false)
  const error      = ref<string | null>(null)

  const selectedYear      = ref<number>(2024)
  const visibleChannels   = ref<string[]>([...DEFAULT_CHANNELS])
  const sortKey           = ref<AudienceSortKey>('pda')
  const top50Category     = ref<Top50Category>('all')

  onMounted(async () => {
    isLoading.value = true
    error.value = null
    try {
      apiData.value = await fetchTvAudiences()
      // Set selectedYear to the most recent year available
      if (apiData.value.years.length > 0) {
        selectedYear.value = apiData.value.years[apiData.value.years.length - 1]!
      }
    } catch {
      error.value = 'Impossible de charger les données d\'audiences.'
    } finally {
      isLoading.value = false
    }
  })

  const years = computed<number[]>(() => apiData.value?.years ?? [])

  const yearData = computed<YearDataWithChannel[]>(() => {
    if (!apiData.value) return []
    const channelMap = new Map(TNT_CHANNELS.map((c) => [c.id, c]))

    return apiData.value.channelYearData
      .filter((d) => d.year === selectedYear.value)
      .map((d) => {
        const channel = channelMap.get(d.channelId)
        if (!channel) return null
        return { ...d, channel }
      })
      .filter((d): d is YearDataWithChannel => d !== null)
  })

  const sortedYearData = computed<YearDataWithChannel[]>(() => {
    return [...yearData.value].sort((a, b) => {
      if (sortKey.value === 'millions') {
        return (b.millions ?? 0) - (a.millions ?? 0)
      }
      return b.pda - a.pda
    })
  })

  const chartDatasets = computed(() => {
    if (!apiData.value) return []
    const allYears = apiData.value.years

    return TNT_CHANNELS
      .filter((c) => visibleChannels.value.includes(c.id))
      .map((channel) => {
        const data = allYears.map((year) => {
          const entry = apiData.value!.channelYearData.find(
            (d) => d.channelId === channel.id && d.year === year,
          )
          return entry?.pda ?? null
        })

        const color = CHANNEL_CHART_COLORS[channel.id] ?? '#94a3b8'
        return {
          label: channel.displayName,
          data,
          borderColor: color,
          backgroundColor: color + '20',
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
        }
      })
  })

  const filteredTop50 = computed<Top50Record[]>(() => {
    if (!apiData.value) return []
    if (top50Category.value === 'all') return apiData.value.top50
    return apiData.value.top50.filter((r) => r.category === top50Category.value)
  })

  const maxPda = computed(() =>
    yearData.value.reduce((max, d) => Math.max(max, d.pda), 0),
  )

  function toggleChannel(channelId: string) {
    if (visibleChannels.value.includes(channelId)) {
      if (visibleChannels.value.length > 1) {
        visibleChannels.value = visibleChannels.value.filter((id) => id !== channelId)
      }
    } else {
      visibleChannels.value = [...visibleChannels.value, channelId]
    }
  }

  return {
    apiData,
    isLoading,
    error,
    years,
    selectedYear,
    visibleChannels,
    sortKey,
    top50Category,
    yearData,
    sortedYearData,
    chartDatasets,
    filteredTop50,
    maxPda,
    toggleChannel,
  }
}
