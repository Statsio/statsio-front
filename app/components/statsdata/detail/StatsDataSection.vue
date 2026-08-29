<script setup lang="ts">
import { computed } from 'vue'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import BlockCard from '@/components/studio/blocks/BlockCard.vue'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokens } from '@/composables/useResolvedTokens'
import { SECTION_LAYOUT_DEFINITIONS } from '@/types/studio'
import type { Section, StudioBlock } from '@/types/studio'

const props = defineProps<{ section: Section }>()
const studio = useStudioStore()

const def = computed(() =>
  SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === props.section.layout) ?? SECTION_LAYOUT_DEFINITIONS[0]!,
)

const resolveOpts = {
  tokenMap: () => studio.pageParams,
  datasetId: () => undefined,
  readonly: () => true,
  docSlug: () => studio.content?.slug,
}
const { text: kicker } = useResolvedTokens({ raw: () => props.section.kicker, ...resolveOpts })
const { text: title } = useResolvedTokens({ raw: () => props.section.title, ...resolveOpts })
const { text: description } = useResolvedTokens({ raw: () => props.section.description, ...resolveOpts })

const hasHeader = computed(() => Boolean(props.section.kicker || props.section.title || props.section.description))
const theme = computed(() => props.section.theme ?? 'default')
const dark = computed(() => theme.value === 'dark')

// Une section « titrée » devient UNE carte : entête + blocs « nus » (maquette v2).
// Une section sans entête garde une carte PAR bloc (rangée de blocs autonomes).
const carded = computed(() => hasHeader.value || theme.value !== 'default')

function blocksInZone(colIdx: number): StudioBlock[] {
  return studio.blocksByZone[`${props.section.id}-${colIdx}`] ?? []
}
/** Une grille de KPI (≥ 2 blocs `kpi` dans la même zone) se dispose en colonnes. */
function isKpiGrid(blocks: StudioBlock[]): boolean {
  return blocks.length >= 2 && blocks.every((b) => b.type === 'kpi')
}
</script>

<template>
  <section
    :id="section.anchorId || undefined"
    class="sd-sec scroll-mt-40"
    :class="{
      'sd-sec--card': carded && theme === 'default',
      'sd-sec--accent': theme === 'accent',
      'sd-sec--dark': dark,
    }"
  >
    <div v-if="hasHeader" class="sd-sec__head">
      <p v-if="section.kicker" class="sd-sec__kicker">{{ kicker }}</p>
      <h2 v-if="section.title" class="sd-sec__title">{{ title }}</h2>
      <p v-if="section.description" class="sd-sec__desc">{{ description }}</p>
    </div>

    <div
      class="section-grid gap-4"
      :style="{ '--cols': def.gridCols.map((n: number) => `${n}fr`).join(' ') }"
    >
      <div
        v-for="(_, colIdx) in def.gridCols"
        :key="colIdx"
        class="min-w-0"
        :class="isKpiGrid(blocksInZone(colIdx))
          ? 'grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4'
          : 'flex flex-col gap-4'"
      >
        <template v-for="block in blocksInZone(colIdx)" :key="block.id">
          <div data-block-anim class="min-w-0">
            <BlockCard :block="block" :dark="dark" :flat="carded">
              <BlockRenderer :block="block" :readonly="true" />
            </BlockCard>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
}
@media (min-width: 768px) {
  .section-grid {
    grid-template-columns: var(--cols);
  }
}
</style>
