<script setup lang="ts">
import { computed } from 'vue'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import BlockCard from '@/components/studio/blocks/BlockCard.vue'
import { useStudioStore } from '@/stores/studio'
import { useResolvedTokens } from '@/composables/useResolvedTokens'
import { sectionAnchorId } from '@/lib/slug'
import { sanitizeInlineHtml, isBlankInlineHtml } from '@/lib/inline-rich-text'
import type { Section, StudioBlock } from '@/types/studio'

/** `scope` : variable(s) de boucle courantes (`{{item}}`…) — posées par un conteneur `loop` ancêtre. */
const props = defineProps<{ section: Section; scope?: Record<string, string> }>()
const studio = useStudioStore()

const resolveOpts = {
  tokenMap: () => ({ ...studio.pageParams, ...props.scope }),
  datasetId: () => undefined,
  readonly: () => true,
  docSlug: () => studio.content?.slug,
}
const { text: kicker } = useResolvedTokens({ raw: () => props.section.kicker, ...resolveOpts })
const { text: title } = useResolvedTokens({ raw: () => props.section.title, ...resolveOpts })
const { text: description } = useResolvedTokens({ raw: () => props.section.description, ...resolveOpts })

const kickerHtml = computed(() => sanitizeInlineHtml(kicker.value))
const titleHtml = computed(() => sanitizeInlineHtml(title.value))
const descriptionHtml = computed(() => sanitizeInlineHtml(description.value))

const headStyle = computed(() => ({
  ...(props.section.headerLetterSpacing != null ? { '--sec-head-ls': `${props.section.headerLetterSpacing}em` } : {}),
  ...(props.section.headerLineHeight != null ? { '--sec-head-lh': String(props.section.headerLineHeight) } : {}),
}))

const hasKicker = computed(() => !isBlankInlineHtml(props.section.kicker))
const hasTitle = computed(() => !isBlankInlineHtml(props.section.title))
const hasDescription = computed(() => !isBlankInlineHtml(props.section.description))
const hasHeader = computed(() => hasKicker.value || hasTitle.value || hasDescription.value)
// Ancre `#id` générée depuis le titre de la section (sommaire + lien direct).
const anchorId = computed(() => sectionAnchorId(props.section))
const theme = computed(() => props.section.theme ?? 'default')
const dark = computed(() => theme.value === 'dark')

// Toute section est UNE carte : entête (optionnel) + blocs « nus » à l'intérieur.
// Rendu identique à l'éditeur (Studio), avec ou sans entête.
const carded = computed(() => true)

const blocks = computed<StudioBlock[]>(() => studio.blocksByZone[`${props.section.id}-0`] ?? [])
/** Une grille de KPI (≥ 2 blocs `kpi` dans la même zone) se dispose en colonnes. */
function isKpiGrid(blocks: StudioBlock[]): boolean {
  return blocks.length >= 2 && blocks.every((b) => b.type === 'kpi')
}
</script>

<template>
  <section
    :id="anchorId"
    class="sd-sec scroll-mt-40"
    :class="{
      'sd-sec--card': carded && theme === 'default',
      'sd-sec--accent': theme === 'accent',
      'sd-sec--dark': dark,
    }"
  >
    <div v-if="hasHeader" class="sd-sec__head" :style="headStyle">
      <p v-if="hasKicker" class="sd-sec__kicker" v-html="kickerHtml" />
      <h2 v-if="hasTitle" class="sd-sec__title" v-html="titleHtml" />
      <p v-if="hasDescription" class="sd-sec__desc" v-html="descriptionHtml" />
    </div>

    <div
      class="min-w-0"
      :class="isKpiGrid(blocks)
        ? 'grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4'
        : 'flex flex-col gap-4'"
    >
      <template v-for="block in blocks" :key="block.id">
        <div data-block-anim class="min-w-0">
          <BlockCard :block="block" :dark="dark" :flat="carded" :scope="scope">
            <BlockRenderer :block="block" :readonly="true" :scope="scope" />
          </BlockCard>
        </div>
      </template>
    </div>
  </section>
</template>
