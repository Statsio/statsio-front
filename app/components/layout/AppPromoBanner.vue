<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePrefsStore } from '@/stores/prefs'
import { getBrandFromPath } from '@/data/brands'
import { loadPromoTicker } from '@/composables/useHeaderMegaMenuData'
import { usePromoFlashRotation } from '@/composables/usePromoFlashRotation'
import { fetchPromoCategories } from '@/api/promo-categories'
import { isBlankInlineHtml, sanitizePromoTitleHtml } from '@/lib/inline-rich-text'
import type { PromoTickerItem } from '@/components/layout/brands/header-nav.types'
import type { CardPreview } from '@/types/catalog'
import type { PromoCategory, PromoTitleAlign } from '@/types/promo-category'
import { getStatsDataPalette } from '@/utils/statsDataVisuals'
import StatsDataMiniChart from '@/components/content/StatsDataMiniChart.vue'

const route = useRoute()
const { reducedMotion } = storeToRefs(usePrefsStore())

const brand = computed(() => getBrandFromPath(route.path))
// « Voir les tendances » ouvre la page Tendances (classement unifié) sur Statsio ;
// les sous-marques n'ont pas cette page → repli sur leur listing Articles (trié tendance).
const ctaHref = computed(() =>
  brand.value.id === 'statsio' ? '/tendances' : `${brand.value.contentBasePath}/articles`,
)

const { data } = useAsyncData(
  'promo-ticker',
  () => loadPromoTicker(brand.value.id, brand.value.contentBasePath),
  { watch: [() => brand.value.id], default: (): PromoTickerItem[] => [] },
)

const items = computed<PromoTickerItem[]>(() => data.value ?? [])

// Catégories de promotion (« flash ») avec lesquelles le ticker de tendances alterne.
const { data: flashCategoriesData } = useAsyncData('promo-flash-categories', fetchPromoCategories, {
  default: (): PromoCategory[] => [],
})
const flashCategories = computed<PromoCategory[]>(() => flashCategoriesData.value ?? [])
const { phase, currentCategory, currentInfo } = usePromoFlashRotation(flashCategories)

/** Ligne 1 = gros titre, ligne 2 = intermédiaire, ligne 3 = plus discrète. */
const TITLE_LINE_SIZE_CLASSES = [
  'text-[15px] sm:text-[17px] lg:text-[18px]',
  'text-[12px] sm:text-[13px] lg:text-[14px]',
  'text-[10px] sm:text-[10.5px] lg:text-[11px]',
]
function normalizeTitleAlign(align: PromoTitleAlign | null | undefined): PromoTitleAlign {
  return align === 'left' || align === 'center' || align === 'stagger' ? align : 'stagger'
}

const currentTitleLines = computed(() => {
  const category = currentCategory.value
  if (!category) return []
  return [
    {
      line: category.title_line_1,
      align: normalizeTitleAlign(category.title_line_1_align),
    },
    {
      line: category.title_line_2,
      align: normalizeTitleAlign(category.title_line_2_align),
    },
    {
      line: category.title_line_3,
      align: normalizeTitleAlign(category.title_line_3_align),
    },
  ]
    .map((entry, index) => ({ ...entry, sizeClass: TITLE_LINE_SIZE_CLASSES[index] }))
    .filter(({ line }) => !isBlankInlineHtml(line))
    .map(({ line, sizeClass, align }) => ({
      html: sanitizePromoTitleHtml(line),
      sizeClass,
      align,
      alignClass: align === 'center' ? 'self-center' : 'self-start',
    }))
})

const hasCenteredTitleLine = computed(() => currentTitleLines.value.some((line) => line.align === 'center'))

/**
 * Décalage « en quinconce » uniquement pour les lignes en mode `stagger` :
 * chaque ligne démarre au milieu de la précédente.
 *
 *   TITRE 1
 *       TITRE 2
 *           TITRE 3
 *
 * Les modes `left` / `center` gardent un offset 0 (le centrage passe par self-center).
 */
const titleLineEls = ref<(HTMLElement | null)[]>([])
const titleLineOffsets = ref<number[]>([])
/** Largeur totale du bloc titre pour que le flex réserve la place (surtout en quinconce). */
const titleBlockWidth = ref<number | null>(null)

function setTitleLineRef(el: Element | null, index: number) {
  titleLineEls.value[index] = el as HTMLElement | null
}

async function recomputeTitleLineOffsets(retries = 0) {
  await nextTick()
  const lines = currentTitleLines.value
  const lineCount = lines.length
  if (!lineCount || phase.value !== 'flash') {
    titleLineOffsets.value = []
    titleBlockWidth.value = null
    return
  }

  // Transition out-in : le panneau flash n'est pas encore monté → réessai au frame suivant.
  const anyMounted = Array.from({ length: lineCount }, (_, index) => titleLineEls.value[index]).some(Boolean)
  if (!anyMounted) {
    if (retries < 30) {
      requestAnimationFrame(() => {
        void recomputeTitleLineOffsets(retries + 1)
      })
    }
    return
  }

  const widths = Array.from(
    { length: lineCount },
    (_, index) => titleLineEls.value[index]?.getBoundingClientRect().width ?? 0,
  )

  const containerWidth = titleLineEls.value[0]?.parentElement?.getBoundingClientRect().width ?? 0
  const offsets: number[] = []
  for (let index = 0; index < lineCount; index++) {
    const line = lines[index]!
    if (index === 0 || line.align !== 'stagger') {
      offsets[index] = 0
      continue
    }
    const prev = lines[index - 1]!
    const prevWidth = widths[index - 1]!
    if (prev.align === 'center') {
      // Ligne du dessus centrée dans le bloc → milieu = centre du bloc.
      const prevLeft = Math.max(0, (containerWidth - prevWidth) / 2)
      offsets[index] = prevLeft + prevWidth / 2
    } else {
      // left / stagger : milieu = début de la ligne du dessus + moitié de sa largeur.
      offsets[index] = (offsets[index - 1] ?? 0) + prevWidth / 2
    }
  }
  titleLineOffsets.value = offsets

  // Largeur réservée : max entre (fin de chaque ligne). En mode centré, on laisse
  // le conteneur prendre toute la place dispo (w-full) pour que self-center fonctionne.
  if (hasCenteredTitleLine.value) {
    titleBlockWidth.value = null
    return
  }

  let maxRight = 0
  for (let index = 0; index < lineCount; index++) {
    const right = (offsets[index] ?? 0) + widths[index]!
    if (right > maxRight) maxRight = right
  }
  titleBlockWidth.value = maxRight || null
}

watch([currentTitleLines, phase], () => {
  titleLineOffsets.value = []
  titleBlockWidth.value = null
  void recomputeTitleLineOffsets()
})

function onWindowResize() {
  recomputeTitleLineOffsets()
}

onMounted(() => {
  recomputeTitleLineOffsets()
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
})
/**
 * Piste du bandeau défilant. Sans animation on ne rend qu'une passe (scroll manuel) ;
 * avec animation on répète la liste 4× — la keyframe translate de -50 % (soit 2 passes)
 * et retombe donc exactement sur un contenu identique → boucle sans saut.
 */
const MARQUEE_COPIES = 4
const trackItems = computed(() => {
  const list = items.value
  if (!list.length) return []
  const copies = reducedMotion.value ? 1 : MARQUEE_COPIES
  const out: { item: PromoTickerItem; key: string; clone: boolean }[] = []
  for (let copy = 0; copy < copies; copy++) {
    list.forEach((item, index) => out.push({ item, key: `${copy}-${index}`, clone: copy > 0 }))
  }
  return out
})

const sparkMax = (values: number[]) => Math.max(...values, 1)

const paletteFor = (item: PromoTickerItem) => getStatsDataPalette(item.categories)

/** Camembert d'aperçu → dégradé conique compact (même rendu que les cartes de catalogue). */
const pieGradient = (preview: CardPreview, item: PromoTickerItem) => {
  const values = preview.series?.[0]?.values ?? []
  const total = values.reduce((sum, v) => sum + Math.abs(v), 0) || 1
  const colors = paletteFor(item)
  let acc = 0
  const stops = values.map((value, i) => {
    const from = (acc / total) * 100
    acc += Math.abs(value)
    const to = (acc / total) * 100
    return `${colors[i % colors.length]} ${from.toFixed(2)}% ${to.toFixed(2)}%`
  })
  return `conic-gradient(${stops.join(',')})`
}

const surveyLeadPct = (options: { pct: number; lead: boolean }[]) =>
  Math.round(options.find((o) => o.lead)?.pct ?? options[0]?.pct ?? 0)
</script>

<template>
  <section
    class="fixed inset-x-0 top-0 z-50 flex h-14 items-center overflow-hidden border-b border-slate-200 bg-white text-slate-900"
  >
    <div class="promo-flip-viewport mx-auto flex w-full max-w-[1800px] items-center px-4 sm:px-6 lg:px-10">
      <Transition :name="reducedMotion ? '' : 'promo-flip'" mode="out-in">
      <div v-if="phase === 'ticker'" key="ticker" class="flex w-full items-center gap-4">
        <span class="flex shrink-0 items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-rose-600">
          <span
            class="h-1.5 w-1.5 rounded-full bg-rose-500"
            :class="reducedMotion ? '' : 'animate-pulse'"
          ></span>
          <span class="hidden sm:inline">Tendances</span>
        </span>

        <span class="hidden h-4 w-px shrink-0 bg-slate-200 sm:block"></span>

        <span v-if="!items.length" class="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-slate-500">
          Le meilleur de Statsio, mis à jour en continu
        </span>

        <div
          v-if="items.length"
          class="promo-marquee relative min-w-0 flex-1"
          :class="reducedMotion ? 'promo-scroll overflow-x-auto' : 'overflow-hidden'"
        >
          <div class="promo-track flex w-max items-center" :class="{ 'promo-track--run': !reducedMotion }">
            <component
              :is="entry.item.href.startsWith('/') ? RouterLink : 'a'"
              v-for="entry in trackItems"
              :key="entry.key"
              :to="entry.item.href.startsWith('/') ? entry.item.href : undefined"
              :href="entry.item.href.startsWith('/') ? undefined : entry.item.href"
              :aria-hidden="entry.clone ? 'true' : undefined"
              :tabindex="entry.clone ? -1 : undefined"
              class="promo-item flex shrink-0 items-center gap-2.5 text-slate-900 transition hover:text-primary"
            >
              <span
                class="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.05em]"
                :style="{ color: entry.item.tagColor }"
              >
                {{ entry.item.tag }}
              </span>
              <span class="whitespace-nowrap text-[12.5px] font-bold">{{ entry.item.title }}</span>

              <template v-if="entry.item.kind === 'statsdata' && entry.item.preview">
                <span
                  v-if="entry.item.preview.kind === 'pie'"
                  class="block h-7 w-7 shrink-0 rounded-full"
                  :style="{ background: pieGradient(entry.item.preview, entry.item) }"
                ></span>
                <div v-else class="h-7 w-[104px] shrink-0">
                  <StatsDataMiniChart
                    :preview="entry.item.preview"
                    :palette="paletteFor(entry.item)"
                    :height="28"
                    spark
                  />
                </div>
              </template>

              <template v-else-if="entry.item.kind === 'statsdata' && entry.item.kpi">
                <span class="flex shrink-0 items-baseline gap-1">
                  <span class="font-mono text-[12px] font-bold text-slate-900">{{ entry.item.kpi }}</span>
                  <span class="font-mono text-[9px] font-semibold text-emerald-600">{{ entry.item.kpiLabel }}</span>
                </span>
                <span v-if="entry.item.sparkline?.length" class="flex h-3.5 shrink-0 items-end gap-[1.5px]">
                  <span
                    v-for="(value, index) in entry.item.sparkline"
                    :key="index"
                    class="w-[2.5px] rounded-t-sm"
                    :class="index >= (entry.item.sparkline?.length ?? 0) - 3 ? 'bg-primary' : 'bg-slate-200'"
                    :style="{ height: Math.max(15, Math.round((value / sparkMax(entry.item.sparkline ?? [])) * 100)) + '%' }"
                  ></span>
                </span>
              </template>

              <template v-if="entry.item.kind === 'survey' && entry.item.surveyOptions">
                <span class="flex shrink-0 items-center gap-2">
                  <span class="flex flex-col gap-[3px]">
                    <span
                      v-for="(o, i) in entry.item.surveyOptions"
                      :key="i"
                      class="h-[4px] w-14 overflow-hidden rounded-full bg-slate-200"
                    >
                      <span
                        class="block h-full rounded-full"
                        :style="{ width: Math.max(6, o.pct) + '%', background: o.color }"
                      ></span>
                    </span>
                  </span>
                  <span class="font-mono text-[10.5px] font-bold text-primary"
                    >{{ surveyLeadPct(entry.item.surveyOptions) }}%</span
                  >
                </span>
              </template>

              <template v-else-if="entry.item.kind === 'survey' && entry.item.percent != null">
                <span class="h-[5px] w-16 shrink-0 overflow-hidden rounded-full bg-slate-200">
                  <span
                    class="block h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-accent))]"
                    :style="{ width: Math.min(100, Math.max(0, entry.item.percent)) + '%' }"
                  ></span>
                </span>
                <span class="shrink-0 font-mono text-[10.5px] font-bold text-primary">{{ entry.item.percent }}%</span>
              </template>
            </component>
          </div>
        </div>

        <RouterLink
          :to="ctaHref"
          class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-3 py-1.5 text-[11.5px] font-extrabold text-white transition hover:opacity-90"
        >
          Voir les tendances →
        </RouterLink>
      </div>

      <div v-else key="flash" class="flex w-full items-center gap-2.5 sm:gap-5">
        <div
          class="promo-flash-title flex max-w-[42%] shrink-0 flex-col justify-center gap-0 overflow-hidden font-black tracking-tight text-slate-900 sm:max-w-[55%]"
          :class="hasCenteredTitleLine ? 'w-full items-stretch' : 'items-start'"
          :style="titleBlockWidth != null ? { width: `${titleBlockWidth}px` } : undefined"
        >
          <div
            v-for="(titleLine, index) in currentTitleLines"
            :key="index"
            :ref="(el) => setTitleLineRef(el as Element | null, index)"
            class="promo-flash-title-line whitespace-nowrap leading-[1.02]"
            :class="[titleLine.sizeClass, titleLine.alignClass]"
            :style="titleLine.align === 'stagger' ? { marginLeft: `${titleLineOffsets[index] ?? 0}px` } : undefined"
            v-html="titleLine.html"
          ></div>
        </div>

        <span class="h-6 w-px shrink-0 self-center bg-slate-200 sm:h-8" aria-hidden="true"></span>

        <Transition :name="reducedMotion ? '' : 'promo-flash'" mode="out-in">
          <div
            v-if="currentInfo"
            :key="`${currentCategory?.id}-${currentInfo.title}`"
            class="min-w-0 flex-1 truncate text-[12px] sm:text-[12.5px]"
          >
            <strong class="font-bold text-slate-900">{{ currentInfo.title }}</strong>
            <span v-if="currentInfo.description" class="ml-1.5 text-slate-600">{{ currentInfo.description }}</span>
          </div>
        </Transition>

        <a
          v-if="currentInfo?.cta_link && currentInfo?.cta_label"
          :href="currentInfo.cta_link"
          target="_blank"
          rel="noopener"
          class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-3 py-1.5 text-[11.5px] font-extrabold text-white transition hover:opacity-90"
        >
          {{ currentInfo.cta_label }} →
        </a>
      </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.promo-scroll {
  scrollbar-width: none;
}
.promo-scroll::-webkit-scrollbar {
  display: none;
}

/* Espacement porté par l'item (et non un `gap` flex) pour que translateX(-50%) tombe
   pile sur une frontière de copie → boucle sans saccade. */
.promo-item {
  margin-inline-end: 2.75rem;
}

.promo-track--run {
  animation: promo-marquee 34s linear infinite;
}

.promo-marquee:hover .promo-track--run,
.promo-marquee:focus-within .promo-track--run {
  animation-play-state: paused;
}

@keyframes promo-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .promo-track--run {
    animation: none;
  }
}

.promo-flash-title :deep(strong) {
  font-weight: 800;
}

/* Contour lisible sur les titres stroke (contour derrière le fill). */
.promo-flash-title-line {
  paint-order: stroke fill;
}

.promo-flash-enter-active,
.promo-flash-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.promo-flash-enter-from,
.promo-flash-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Bascule ticker ⇄ flash : un panneau plein-largeur bascule comme une plaque
   articulée sur son bord bas (façon compteur à palettes / flip-clock). */
.promo-flip-viewport {
  perspective: 1000px;
}

.promo-flip-enter-active,
.promo-flip-leave-active {
  transition:
    transform 0.45s cubic-bezier(0.5, 0, 0.2, 1),
    opacity 0.3s ease;
  transform-origin: 50% 100%;
  backface-visibility: hidden;
}

.promo-flip-enter-from {
  transform: rotateX(-100deg);
  opacity: 0;
}

.promo-flip-leave-to {
  transform: rotateX(100deg);
  opacity: 0;
}
</style>
