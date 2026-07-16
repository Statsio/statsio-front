<script setup lang="ts">
import { computed } from 'vue'
import type { SourceCapabilities, ChartType } from '@/api/data-sources'

const props = defineProps<{ capabilities: SourceCapabilities }>()

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  serie_temporelle: 'Séries temporelles',
  carte: 'Cartes',
  kpi: 'KPI',
  histogramme: 'Histogrammes',
  pivot: 'Pivot',
  jointure: 'Jointures',
}

const CHART_TYPE_ORDER: ChartType[] = ['serie_temporelle', 'carte', 'kpi', 'histogramme', 'pivot', 'jointure']

const orderedChartTypes = computed(() =>
  CHART_TYPE_ORDER.map((type) => ({
    type,
    label: CHART_TYPE_LABELS[type],
    compatible: props.capabilities.compatibleChartTypes.includes(type),
  })),
)

const scoreColor = computed(() => {
  const score = props.capabilities.compatibilityScore
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-500'
})

const formatRows = (n: number) => n.toLocaleString('fr-FR')
</script>

<template>
  <div class="rounded-xl border border-slate-200 p-3">
    <div class="flex items-center justify-between mb-3">
      <p class="text-xs font-semibold text-slate-600">Compatibilité Statsio</p>
      <p class="text-sm font-bold" :class="scoreColor">{{ capabilities.compatibilityScore }}%</p>
    </div>

    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
      <div v-for="item in orderedChartTypes" :key="item.type" class="flex items-center gap-1.5 text-xs">
        <span :class="item.compatible ? 'text-emerald-500' : 'text-slate-300'">
          {{ item.compatible ? '✓' : '✗' }}
        </span>
        <span :class="item.compatible ? 'text-slate-700' : 'text-slate-400'">{{ item.label }}</span>
      </div>
    </div>

    <p class="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
      <template v-if="capabilities.estimatedMaxRows != null">~{{ formatRows(capabilities.estimatedMaxRows) }} lignes estimées</template>
      <template v-else>Volume de données inconnu</template>
      <template v-if="capabilities.responseTimeMs != null"> · {{ capabilities.responseTimeMs }} ms</template>
    </p>
  </div>
</template>
