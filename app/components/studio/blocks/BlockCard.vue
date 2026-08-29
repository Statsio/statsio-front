<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokens, useExpressionNumber } from '@/composables/useResolvedTokens'
import { formatNumber } from '@/lib/studio-expression'
import { isTextBlock, isEditorialBlock, isFormBlock } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'

/**
 * Enveloppe présentielle d'un bloc en lecture seule (page publiée, itération de
 * boucle) : décide de la carte / du titre selon la famille du bloc, et résout les
 * `{{jetons}}` du titre / de la description — variables ET expressions calculées.
 */
const props = defineProps<{
  block: StudioBlock
  /** Variables de boucle (`{{item}}`) — fusionnées avec `pageParams`. */
  scope?: Record<string, string>
  /** La section hôte est en thème sombre → carte + textes clairs. */
  dark?: boolean
  /** La section hôte porte déjà une carte → le bloc se rend sans carte ni padding. */
  flat?: boolean
  /** Résolution des jetons du titre : `true` (défaut) = endpoints publics ; `false` = Studio. */
  readonly?: boolean
}>()

const studio = useStudioStore()

const resolveOpts = {
  tokenMap: () => ({ ...studio.pageParams, ...props.scope }),
  datasetId: () => props.block.datasetId,
  readonly: () => props.readonly ?? true,
  docSlug: () => studio.content?.slug,
}

const { text: resolvedTitle } = useResolvedTokens({ raw: () => props.block.config.title, ...resolveOpts })
const { text: resolvedDescription } = useResolvedTokens({ raw: () => props.block.config.description, ...resolveOpts })

// Pastille de tendance calculée (line chart) — priorité sur le texte libre `trendLabel`.
const { value: trendNum } = useExpressionNumber({ expression: () => props.block.config.trendExpression, ...resolveOpts })
const trend = computed<{ text: string; down: boolean } | null>(() => {
  const c = props.block.config
  if (c.trendExpression) {
    if (trendNum.value === null) return null
    const down = c.trendDirection ? c.trendDirection === 'down' : trendNum.value < 0
    const sign = trendNum.value > 0 ? '+' : ''
    return { text: `${sign}${formatNumber(trendNum.value)}`, down }
  }
  if (c.trendLabel) return { text: c.trendLabel, down: c.trendDirection === 'down' }
  return null
})

const bare = computed(() => {
  const t = props.block.type
  return isTextBlock(t) || isEditorialBlock(t) || t === 'loop' || t === 'if' || t === 'param'
})

const wrapperClass = computed(() => {
  if (props.flat) return ''
  return props.dark
    ? 'rounded-[18px] border border-white/12 bg-white/[0.04] p-5'
    : 'rounded-[18px] bg-white p-5 shadow-[var(--studio-shadow-card)]'
})
</script>

<template>
  <!-- Texte / éditorial / script / paramètre : pas de carte -->
  <div v-if="bare" class="min-w-0">
    <slot />
  </div>

  <!-- Données / graphiques / KPI -->
  <div v-else class="min-w-0" :class="wrapperClass">
    <div
      v-if="block.config.title && !isFormBlock(block.type) && block.type !== 'kpi' && block.type !== 'search'"
      class="mb-3 flex items-start justify-between gap-3"
    >
      <div>
        <p class="text-sm font-bold" :class="dark ? 'text-white' : 'text-[var(--studio-ink)]'">{{ resolvedTitle }}</p>
        <p v-if="block.config.description" class="mt-1 text-xs" :class="dark ? 'text-white/60' : 'text-[var(--studio-muted)]'">
          {{ resolvedDescription }}
        </p>
      </div>
      <span
        v-if="block.type === 'line' && trend"
        class="mono shrink-0 whitespace-nowrap text-[11px] font-semibold"
        :class="trend.down ? 'text-red-500' : 'text-emerald-600'"
      >
        {{ trend.down ? '▼' : '▲' }} {{ trend.text }}
      </span>
    </div>
    <slot />
  </div>
</template>
