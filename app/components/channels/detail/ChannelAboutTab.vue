<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelEntry } from '@/data/channels'
import { formatCompactNumber } from '@/lib/format'

const props = defineProps<{
  channel: ChannelEntry
  categoryLabels: string[]
  createdAtLabel: string | null
  articlesCount: number
  statsDataCount: number
  surveysCount: number
}>()

const rows = computed(() => {
  const list: { label: string; value: string }[] = []
  if (props.categoryLabels.length) list.push({ label: 'Catégorie', value: props.categoryLabels.join(', ') })
  if (props.createdAtLabel) list.push({ label: 'Chaîne créée le', value: props.createdAtLabel })
  if (props.channel.country) list.push({ label: 'Pays', value: props.channel.country })
  list.push({ label: 'Abonnés', value: formatCompactNumber(props.channel.followers) })
  if (props.channel.viewCount) list.push({ label: 'Vues cumulées', value: formatCompactNumber(props.channel.viewCount) })
  list.push({ label: 'Articles publiés', value: String(props.articlesCount) })
  list.push({ label: 'StatsData publiés', value: String(props.statsDataCount) })
  list.push({ label: 'Sondages publiés', value: String(props.surveysCount) })
  return list
})
</script>

<template>
  <div class="grid gap-5 py-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
    <div class="rounded-[18px] border-[1.5px] border-slate-200/80 bg-white px-7 py-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
      <h2 class="mb-3.5 text-[16px] font-extrabold tracking-[-0.01em] text-slate-950">À propos de {{ channel.name }}</h2>
      <p class="text-[14px] leading-[1.7] text-slate-600 text-pretty">
        {{ channel.longDescription || channel.description || 'Aucune description renseignée pour cette chaîne.' }}
      </p>
    </div>

    <div
      class="flex flex-col gap-3.5 rounded-[18px] border-[1.5px] border-slate-200/80 bg-white px-6 py-5 shadow-[0_1px_3px_rgba(20,20,30,0.06)]"
    >
      <div v-for="row in rows" :key="row.label" class="flex justify-between gap-3">
        <span class="text-[13px] text-slate-500">{{ row.label }}</span>
        <span class="text-right text-[13px] font-bold text-slate-950">{{ row.value }}</span>
      </div>
    </div>
  </div>
</template>
