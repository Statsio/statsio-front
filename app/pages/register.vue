<script setup lang="ts">
import { computed } from 'vue'
import { usePlatformStats } from '@/composables/usePlatformStats'
import { formatCompactNumber } from '@/utils/number'
import { plural } from '@/utils/plural'

definePageMeta({ layout: 'studio', middleware: ['guest'], ssr: false, title: 'Inscription', robots: 'noindex,nofollow' })

const { stats, ready } = usePlatformStats()

const fallbackSignals = [
  { label: 'datasets', value: 'Datasets ouverts', detail: 'prêts à explorer' },
  { label: 'contributeurs', value: 'Une communauté active', detail: 'partagent déjà leurs analyses' },
]

const registerSignals = computed(() => {
  if (!ready.value) return fallbackSignals
  const s = stats.value
  return [
    {
      label: 'datasets',
      value: `${formatCompactNumber(s.datasets)} ${plural('dataset', s.datasets)}`,
      detail: `${formatCompactNumber(s.statsdata)} StatsData en ligne`,
    },
    {
      label: 'contributeurs',
      value: `${formatCompactNumber(s.contributors)} ${plural('contributeur', s.contributors)}`,
      detail: `${plural('partage', s.contributors, 'partagent')} déjà ${plural('son analyse', s.contributors, 'leurs analyses')}`,
    },
  ]
})
</script>

<template>
  <AuthShell
    :signals="registerSignals"
    title="Rejoignez celles et ceux qui décryptent les données."
    description="Ouvrez votre compte pour explorer les datasets, suivre vos sujets et partager vos propres analyses."
  >
    <RegisterFormCard />
  </AuthShell>
</template>
