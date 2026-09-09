<script setup lang="ts">
import { computed } from 'vue'
import { usePlatformStats } from '@/composables/usePlatformStats'
import { formatCompactNumber } from '@/utils/number'
import { plural } from '@/utils/plural'

definePageMeta({ layout: 'studio', middleware: ['guest'], ssr: false, title: 'Connexion', robots: 'noindex,nofollow' })

const { stats, ready } = usePlatformStats()

const fallbackSignals = [
  { label: 'datasets', value: 'Datasets ouverts', detail: 'sources vérifiées et actualisées' },
  { label: 'contenus', value: 'Analyses en continu', detail: 'articles, StatsData et sondages' },
]

const trustSignals = computed(() => {
  if (!ready.value) return fallbackSignals
  const s = stats.value
  return [
    {
      label: 'datasets',
      value: `${formatCompactNumber(s.datasets)} ${plural('dataset', s.datasets)}`,
      detail: `${formatCompactNumber(s.statsdata)} StatsData en ligne`,
    },
    {
      label: 'contenus',
      value: `${formatCompactNumber(s.publishedTotal)} ${plural('contenu', s.publishedTotal)} ${plural('publié', s.publishedTotal, 'publiés')}`,
      detail: `par ${formatCompactNumber(s.contributors)} ${plural('contributeur', s.contributors)}`,
    },
  ]
})
</script>

<template>
  <AuthShell :signals="trustSignals">
    <LoginFormCard />
  </AuthShell>
</template>
