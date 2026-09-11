<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowsPointingOutIcon, CodeBracketIcon } from '@heroicons/vue/24/outline'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokens, useExpressionNumber } from '@/composables/useResolvedTokens'
import { formatNumber } from '@/lib/studio-expression'
import {
  isTextBlock,
  isEditorialBlock,
  isFormBlock,
  BLOCK_META,
  IFRAME_EMBED_BLOCK_TYPES,
} from '@/types/studio'
import type { BlockType, StudioBlock } from '@/types/studio'
import AppModal from '@/components/ui/AppModal.vue'
import BlockRenderer from './BlockRenderer.vue'
import StatsDataEmbedModal from '@/components/statsdata/detail/StatsDataEmbedModal.vue'

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
const route = useRoute()

/** Pas de boutons d'action dans une iframe d'intégration (évite la récursion). */
const isEmbedRoute = computed(() => route.path.startsWith('/embed/'))

const resolveOpts = {
  tokenMap: () => ({ ...studio.pageParams, ...props.scope }),
  block: () => props.block,
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
  return isTextBlock(t) || isEditorialBlock(t) || t === 'loop' || t === 'if' || t === 'layout' || t === 'param'
})

const wrapperClass = computed(() => {
  if (props.flat) return ''
  return props.dark
    ? 'rounded-[18px] border border-white/12 bg-white/[0.04] p-5'
    : 'rounded-[18px] bg-white p-5 shadow-[var(--studio-shadow-card)]'
})

/** Graphiques / tableaux : bouton d'agrandissement en lecture seule (page publique / aperçu). */
const EXPANDABLE_TYPES: BlockType[] = ['bar', 'line', 'pie', 'table']
const canExpand = computed(
  () => props.readonly !== false && !isEmbedRoute.value && EXPANDABLE_TYPES.includes(props.block.type),
)

/** Graphiques / tableaux / KPI / carte : code iframe d'intégration. */
const canEmbed = computed(
  () =>
    props.readonly !== false
    && !isEmbedRoute.value
    && IFRAME_EMBED_BLOCK_TYPES.includes(props.block.type)
    && Boolean(studio.content?.slug)
    && studio.content?.embed_enabled !== false,
)

const hasActions = computed(() => canExpand.value || canEmbed.value)

const hasTitle = computed(
  () => Boolean(props.block.config.title) && !isFormBlock(props.block.type) && props.block.type !== 'kpi' && props.block.type !== 'search',
)

const expandOpen = ref(false)
const embedOpen = ref(false)

const modalTitle = computed(
  () => resolvedTitle.value?.trim() || BLOCK_META[props.block.type]?.label || 'Aperçu',
)

const expandBtnClass = computed(() =>
  props.dark
    ? 'text-white/50 hover:bg-white/10 hover:text-white'
    : 'text-[var(--studio-faint)] hover:bg-[var(--studio-note)] hover:text-[var(--studio-ink)]',
)

function iframeHeight(type: BlockType): number {
  switch (type) {
    case 'kpi': return 220
    case 'pie': return 420
    case 'map': return 520
    case 'table': return 560
    default: return 480
  }
}

const embedUrl = computed(() => {
  const origin = import.meta.client ? window.location.origin : ''
  const slug = studio.content?.slug ?? ''
  return `${origin}/embed/statsdata/${slug}/blocks/${props.block.id}`
})

const embedSnippet = computed(() => {
  const title = (modalTitle.value || 'StatsData').replace(/"/g, '&quot;')
  const h = iframeHeight(props.block.type)
  return `<iframe src="${embedUrl.value}" width="100%" height="${h}" style="border:1px solid #e5e5e5;border-radius:12px" loading="lazy" title="${title}"></iframe>`
})

const embedPreviewHeight = computed(() => Math.min(iframeHeight(props.block.type), 360))
</script>

<template>
  <!-- Texte / éditorial / script / paramètre : pas de carte -->
  <div v-if="bare" class="min-w-0">
    <slot />
  </div>

  <!-- Données / graphiques / KPI -->
  <div v-else class="relative min-w-0" :class="wrapperClass">
    <div
      v-if="hasTitle"
      class="mb-3 flex items-start justify-between gap-3"
    >
      <div class="min-w-0">
        <p class="text-sm font-bold" :class="dark ? 'text-white' : 'text-[var(--studio-ink)]'">
          {{ resolvedTitle }}
        </p>
        <p
          v-if="block.config.description"
          class="mt-1 text-xs"
          :class="dark ? 'text-white/60' : 'text-[var(--studio-muted)]'"
        >
          {{ resolvedDescription }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1.5">
        <span
          v-if="block.type === 'line' && trend"
          class="mono mr-1 whitespace-nowrap text-[11px] font-semibold"
          :class="trend.down ? 'text-red-500' : 'text-emerald-600'"
        >
          {{ trend.down ? '▼' : '▲' }} {{ trend.text }}
        </span>
        <button
          v-if="canExpand"
          type="button"
          class="rounded-lg p-1.5 transition"
          :class="expandBtnClass"
          aria-label="Agrandir"
          title="Agrandir"
          @click="expandOpen = true"
        >
          <ArrowsPointingOutIcon class="h-4 w-4" />
        </button>
        <button
          v-if="canEmbed"
          type="button"
          class="rounded-lg p-1.5 transition"
          :class="expandBtnClass"
          aria-label="Intégrer (iframe)"
          title="Intégrer (iframe)"
          @click="embedOpen = true"
        >
          <CodeBracketIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Sans titre (ex. KPI) : boutons flottants en haut à droite -->
    <div
      v-else-if="hasActions"
      class="absolute right-0 top-0 z-10 flex items-center gap-1"
    >
      <button
        v-if="canExpand"
        type="button"
        class="rounded-lg p-1.5 transition"
        :class="expandBtnClass"
        aria-label="Agrandir"
        title="Agrandir"
        @click="expandOpen = true"
      >
        <ArrowsPointingOutIcon class="h-4 w-4" />
      </button>
      <button
        v-if="canEmbed"
        type="button"
        class="rounded-lg p-1.5 transition"
        :class="expandBtnClass"
        aria-label="Intégrer (iframe)"
        title="Intégrer (iframe)"
        @click="embedOpen = true"
      >
        <CodeBracketIcon class="h-4 w-4" />
      </button>
    </div>

    <slot />

    <AppModal v-model:open="expandOpen" :title="modalTitle" size="xl">
      <BlockRenderer
        :block="block"
        :readonly="readonly ?? true"
        :scope="scope"
        expanded
      />
    </AppModal>

    <StatsDataEmbedModal
      v-model:open="embedOpen"
      title="Intégrer ce bloc"
      :snippet="embedSnippet"
      :preview-url="embedUrl"
      :preview-height="embedPreviewHeight"
    />
  </div>
</template>
