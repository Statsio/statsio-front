<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import { useStudioStore } from '@/stores/studio'
import { SECTION_LAYOUT_DEFINITIONS, isTextBlock, isEditorialBlock, isFormBlock } from '@/types/studio'
import type { Section, StudioBlock } from '@/types/studio'

const props = defineProps<{
  sections: Section[]
  resolveToken: (str: string) => string
  isTemplate?: boolean
}>()

const studio = useStudioStore()

const hasPageParams = computed(() => Object.keys(studio.pageParams).length > 0)
const lockedSections = computed(() => props.sections.filter((s) => s.locked))
const regularSections = computed(() => props.sections.filter((s) => !s.locked))
const visibleSections = computed(() => {
  if (!props.isTemplate) {
    return props.sections
  }
  return [...lockedSections.value, ...(hasPageParams.value ? regularSections.value : [])]
})

function sectionDef(layout: string) {
  return SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === layout) ?? SECTION_LAYOUT_DEFINITIONS[0]!
}

function blocksInZone(sectionId: string, colIdx: number): StudioBlock[] {
  return studio.blocksByZone[`${sectionId}-${colIdx}`] ?? []
}

// Re-plays the scroll-reveal animation whenever the visible section list changes
// (initial load or switching between exploration pages/tabs).
watch(() => visibleSections.value, async () => {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  await nextTick()
  try {
    const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ])
    gsap.registerPlugin(ScrollTrigger)
    const els = document.querySelectorAll<HTMLElement>('[data-block-anim]')
    els.forEach((el) => {
      gsap.from(el, {
        y: 28,
        opacity: 0,
        duration: 0.65,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      })
    })
    requestAnimationFrame(() => ScrollTrigger.refresh())
  } catch { /* GSAP unavailable — content stays visible */ }
}, { immediate: true, deep: true })
</script>

<template>
  <template v-if="visibleSections.length > 0">
    <div
      v-for="section in visibleSections"
      :key="section.id"
      class="section-grid min-w-0 gap-3 sm:gap-4"
      :style="{ '--cols': sectionDef(section.layout).gridCols.map((n: number) => `${n}fr`).join(' ') }"
    >
      <div
        v-for="(_, colIdx) in sectionDef(section.layout).gridCols"
        :key="colIdx"
        class="flex min-w-0 flex-col gap-3 sm:gap-4"
      >
        <template v-for="block in blocksInZone(section.id, colIdx)" :key="block.id">
          <!-- Text blocks (heading, paragraph, quote, callout): no card wrapper -->
          <div v-if="isTextBlock(block.type)" data-block-anim class="min-w-0">
            <BlockRenderer :block="block" :readonly="true" />
          </div>

          <!-- Editorial blocks (image, video, button, link-card, retenir): no outer card -->
          <div v-else-if="isEditorialBlock(block.type)" data-block-anim class="min-w-0">
            <BlockRenderer :block="block" :readonly="true" />
          </div>

          <!-- KPI blocks: white bordered tile (KpiBlock itself draws the trend accent bar) -->
          <div v-else-if="block.type === 'kpi'" data-block-anim class="min-w-0 overflow-hidden rounded-2xl border border-[#18181f]/[0.08] bg-white">
            <BlockRenderer :block="block" :readonly="true" />
          </div>

          <!-- Data / chart blocks: white card with optional title header -->
          <div v-else data-block-anim class="min-w-0 overflow-hidden rounded-2xl border border-[#18181f]/[0.08] bg-white">
            <div v-if="block.config.title && !isFormBlock(block.type)" class="flex items-start justify-between gap-3 px-5 pt-5" :class="block.config.description ? 'pb-1' : ''">
              <div>
                <p class="text-sm font-bold text-[#18181f]">{{ resolveToken(block.config.title) }}</p>
                <p v-if="block.config.description" class="mt-1 text-xs text-[#18181f]/55">{{ resolveToken(block.config.description) }}</p>
              </div>
              <span
                v-if="block.type === 'line' && block.config.trendLabel"
                class="mono shrink-0 whitespace-nowrap text-[11px] font-semibold"
                :class="block.config.trendDirection === 'down' ? 'text-red-500' : 'text-emerald-600'"
              >
                {{ block.config.trendDirection === 'down' ? '▼' : '▲' }} {{ block.config.trendLabel }}
              </span>
            </div>
            <BlockRenderer :block="block" :readonly="true" />
          </div>
        </template>
      </div>
    </div>
  </template>

  <div v-else class="rounded-2xl border border-dashed border-[#18181f]/15 bg-[#18181f]/[0.02] py-20 text-center text-[#18181f]/40">
    <svg class="mx-auto mb-3 h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
    </svg>
    <p class="text-sm">Aucun contenu sur cette page.</p>
  </div>
</template>

<style scoped>
.section-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  /* Each column keeps its own natural height — without this, CSS Grid's default
     stretch makes every card in a row as tall as the tallest sibling column,
     which breaks blocks that center their content vertically (e.g. SearchBlock). */
  align-items: start;
}
@media (min-width: 640px) {
  .section-grid {
    grid-template-columns: var(--cols);
  }
}
</style>
