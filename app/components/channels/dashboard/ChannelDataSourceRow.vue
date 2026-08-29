<script setup lang="ts">
import { computed } from 'vue'
import { formatCompactNumber } from '@/lib/format'
import type { ChannelDataSource } from '@/api/channels'

const props = defineProps<{ source: ChannelDataSource }>()

const typeLabel = computed(() => {
  if (props.source.sourceKind === 'api') return 'API'
  return (props.source.type ?? 'src').toUpperCase()
})

const statusMeta = computed(() => {
  switch (props.source.status) {
    case 'ready':
      return { dot: 'bg-emerald-500', text: 'text-slate-500' }
    case 'failed':
      return { dot: 'bg-rose-500', text: 'text-rose-600' }
    default:
      return { dot: 'bg-amber-500', text: 'text-slate-500' }
  }
})

const syncLabel = computed(() => {
  if (props.source.status === 'failed') return 'Échec de la dernière synchro'
  const iso = props.source.lastRefreshedAt
  if (!iso) return 'Jamais synchronisée'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'hier' : `il y a ${days} j`
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 px-6 py-3.5 first:border-t-0">
    <span
      class="flex h-8 min-w-[42px] items-center justify-center rounded-lg bg-slate-100 px-2 font-mono text-[10.5px] font-semibold text-slate-500"
    >
      {{ typeLabel }}
    </span>

    <span class="min-w-[180px] flex-1">
      <span class="block text-[13.5px] font-bold text-slate-950">{{ source.name }}</span>
      <span v-if="source.origin" class="mt-0.5 block truncate font-mono text-[10.5px] text-slate-400">
        {{ source.origin }}
      </span>
    </span>

    <span class="min-w-[70px] text-right font-mono text-[11.5px] text-slate-500">
      {{ formatCompactNumber(source.rowCount) }} lignes
    </span>

    <span class="flex min-w-[130px] items-center gap-2 text-[11.5px]" :class="statusMeta.text">
      <span class="h-[7px] w-[7px] shrink-0 rounded-full" :class="statusMeta.dot" />
      {{ syncLabel }}
    </span>

    <span class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
      {{ source.usedByCount }} {{ source.usedByCount > 1 ? 'contenus' : 'contenu' }}
    </span>
  </div>
</template>
