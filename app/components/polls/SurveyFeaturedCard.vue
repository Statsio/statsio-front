<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import { publicContentPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { surveyCardMeta } from '@/lib/survey-card'

const props = defineProps<{
  item: CatalogItem
}>()

const basePath = useContentBasePath()
const to = computed(() => publicContentPath('survey', props.item.slug, basePath.value))
const meta = computed(() => surveyCardMeta(props.item))

const stats = computed(() => {
  const it = props.item
  const rows: { label: string; value: string }[] = [
    { label: 'Participation', value: meta.value.participationLabel },
    { label: it.survey_kind === 'petition' ? 'Objectif' : 'Clôture', value: it.survey_kind === 'petition' ? (meta.value.goalLabel.replace('objectif ', '') || '—') : meta.value.timeLabel },
  ]
  if (meta.value.options[0]) rows.push({ label: 'Réponse en tête', value: `${meta.value.options[0].pct} %` })
  return rows
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="mb-[22px] grid gap-8 overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#18181f,#2c2440)] px-8 py-8 text-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center"
  >
    <span class="block min-w-0">
      <span class="mb-4 flex flex-wrap items-center gap-2.5">
        <span class="rounded-[5px] bg-[#c4b5fd] px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.1em] text-slate-950">
          À LA UNE · {{ meta.kind.label.toUpperCase() }}
        </span>
        <span class="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.08em]" :style="{ color: meta.status.closed ? 'rgba(255,255,255,0.6)' : '#6ee7b7' }">
          <span class="h-1.5 w-1.5 rounded-full" :style="{ background: meta.status.closed ? 'rgba(255,255,255,0.4)' : '#34d399' }" />
          {{ meta.statusLabel }}<template v-if="!meta.status.closed"> · {{ meta.status.label.toUpperCase() }}</template>
        </span>
      </span>
      <span class="block text-[1.7rem] font-extrabold leading-[1.16] tracking-[-0.025em] text-pretty lg:text-[29px]">{{ item.title }}</span>
      <span v-if="item.description" class="mt-3 block max-w-[50ch] text-[14.5px] leading-[1.6] text-white/70">{{ item.description }}</span>
      <span class="mt-5 flex flex-wrap gap-6">
        <span v-for="s in stats" :key="s.label" class="block">
          <span class="block text-[9px] font-extrabold uppercase tracking-[0.08em] text-white/50">{{ s.label }}</span>
          <span class="mt-1 block font-mono text-[15px] font-semibold">{{ s.value }}</span>
        </span>
      </span>
      <span class="mt-6 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-[22px] py-3 text-[13px] font-extrabold tracking-[0.03em] text-white">
        {{ item.survey_kind === 'petition' ? 'SIGNER LA PÉTITION' : 'PARTICIPER' }} →
      </span>
    </span>

    <span class="block min-w-0 rounded-2xl border border-white/15 bg-white/5 p-5">
      <span class="mb-3.5 block text-[10px] font-extrabold uppercase tracking-[0.09em] text-white/55">
        {{ item.survey_kind === 'petition' ? 'Progression' : 'Résultats en direct' }}
      </span>
      <span v-if="meta.options.length" class="flex flex-col gap-2.5">
        <span v-for="o in meta.options" :key="o.label" class="relative block overflow-hidden rounded-[11px] border-[1.5px] border-white/15 bg-white/5 px-3.5 py-3">
          <span class="absolute inset-y-0 left-0 opacity-40" :style="{ width: `${o.pct}%`, background: o.color }" />
          <span class="relative flex items-center gap-2.5">
            <span class="min-w-0 flex-1 truncate text-[13.5px] font-bold">{{ o.label }}</span>
            <span class="font-mono text-[12.5px] font-semibold text-white/85">{{ o.pct }} %</span>
          </span>
        </span>
      </span>
      <span v-else-if="meta.goalPct !== null" class="block">
        <span class="block h-2.5 overflow-hidden rounded-full bg-white/10">
          <span class="block h-full rounded-full" :style="{ width: `${meta.goalPct}%`, background: 'linear-gradient(90deg,#e11d48,#8b5cf6)' }" />
        </span>
        <span class="mt-2 block font-mono text-[11px] text-white/60">{{ meta.goalPct }} % · {{ meta.goalLabel }}</span>
      </span>
      <span v-else class="block text-[13px] text-white/60">{{ meta.participationLabel }} collectée{{ (item.responses_count ?? 0) > 1 ? 's' : '' }}</span>
      <span class="mt-3.5 block font-mono text-[10.5px] text-white/55">Une participation par compte · résultats publics</span>
    </span>
  </NuxtLink>
</template>
