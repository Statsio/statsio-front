<script setup lang="ts">
import { computed } from 'vue'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import { useStudioStore } from '@/stores/studio'
import { isFormBlock, scriptIdFromZone } from '@/types/studio'
import { sectionAnchorId } from '@/lib/slug'
import { sanitizeInlineHtml, isBlankInlineHtml } from '@/lib/inline-rich-text'
import type { Section, StudioBlock } from '@/types/studio'

const studio = useStudioStore()

interface Row {
  section: Section
  header: boolean
  blocks: StudioBlock[]
}

/** Sections de la page courante, avec leurs blocs de premier niveau ordonnés. */
const rows = computed<Row[]>(() => {
  const out: Row[] = []
  for (const section of studio.currentPageSections) {
    const blocks: StudioBlock[] = []
    for (const b of studio.blocksByZone[`${section.id}-0`] ?? []) {
      if (!isFormBlock(b.type)) blocks.push(b)
    }
    out.push({
      section,
      header:
        !isBlankInlineHtml(section.kicker) ||
        !isBlankInlineHtml(section.title) ||
        !isBlankInlineHtml(section.description),
      blocks,
    })
  }

  // Repli : blocs « à plat » d'articles historiques non rattachés à une zone de section.
  const seen = new Set(out.flatMap((r) => r.blocks.map((b) => b.id)))
  const orphans = studio.blocks.filter(
    (b) => !seen.has(b.id) && !scriptIdFromZone(b.zoneId) && !isFormBlock(b.type),
  )
  if (orphans.length) {
    out.push({ section: { id: '__orphans__', layout: '1-col' }, header: false, blocks: orphans })
  }

  return out
})

const isEmpty = computed(() => rows.value.every((r) => !r.header && r.blocks.length === 0))

type FlowItem =
  | { kind: 'block'; block: StudioBlock }
  | { kind: 'links'; key: string; blocks: StudioBlock[] }

/** Regroupe les cartes de lien consécutives (« Pour aller plus loin »). */
function flowOf(blocks: StudioBlock[]): FlowItem[] {
  const out: FlowItem[] = []
  let bucket: StudioBlock[] | null = null
  const flush = () => {
    if (!bucket?.length) return
    out.push({ kind: 'links', key: bucket.map((b) => b.id).join('-'), blocks: bucket })
    bucket = null
  }
  for (const block of blocks) {
    if (block.type === 'link-card') {
      bucket = bucket ?? []
      bucket.push(block)
    } else {
      flush()
      out.push({ kind: 'block', block })
    }
  }
  flush()
  return out
}

function headStyle(section: Section) {
  return {
    ...(section.headerLetterSpacing != null
      ? { '--sec-head-ls': `${section.headerLetterSpacing}em` }
      : {}),
    ...(section.headerLineHeight != null
      ? { '--sec-head-lh': String(section.headerLineHeight) }
      : {}),
  }
}
</script>

<template>
  <div id="article" class="art-flow">
    <section v-for="row in rows" :key="row.section.id" class="art-sec">
      <header
        v-if="row.header"
        :id="sectionAnchorId(row.section)"
        class="art-sec__head"
        :style="headStyle(row.section)"
      >
        <p
          v-if="!isBlankInlineHtml(row.section.kicker)"
          class="art-sec__kicker"
          v-html="sanitizeInlineHtml(row.section.kicker)"
        />
        <h2
          v-if="!isBlankInlineHtml(row.section.title)"
          class="art-sec__title"
          v-html="sanitizeInlineHtml(row.section.title)"
        />
        <p
          v-if="!isBlankInlineHtml(row.section.description)"
          class="art-sec__desc"
          v-html="sanitizeInlineHtml(row.section.description)"
        />
      </header>

      <template v-for="item in flowOf(row.blocks)" :key="item.kind === 'links' ? item.key : item.block.id">
        <div v-if="item.kind === 'links'" class="art-links-wrap">
          <p v-if="item.blocks.length > 1" class="art-links__lbl">Pour aller plus loin</p>
          <div class="art-links">
            <div v-for="block in item.blocks" :id="`block-${block.id}`" :key="block.id" class="art-block">
              <BlockRenderer :block="block" :readonly="true" />
            </div>
          </div>
        </div>
        <div v-else :id="`block-${item.block.id}`" class="art-block">
          <BlockRenderer :block="item.block" :readonly="true" />
        </div>
      </template>
    </section>

    <div v-if="isEmpty" class="art-empty">
      Cet article ne contient aucun contenu pour le moment.
    </div>
  </div>
</template>
