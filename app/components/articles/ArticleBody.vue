<script setup lang="ts">
import { computed } from 'vue'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import { useStudioStore } from '@/stores/studio'
import { isFormBlock, isTextBlock, scriptIdFromZone } from '@/types/studio'
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
      header: !isBlankInlineHtml(section.kicker) || !isBlankInlineHtml(section.title) || !isBlankInlineHtml(section.description),
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

const TITLED = new Set(['bar', 'line', 'pie', 'table', 'map', 'record', 'related', 'field-grid'])
function showsTitle(block: StudioBlock) {
  return !!block.config.title && TITLED.has(block.type)
}
function isBare(block: StudioBlock) {
  return isTextBlock(block.type) || block.type === 'sd-embed' || block.type === 'retenir' || block.type === 'image'
}

function headStyle(section: Section) {
  return {
    ...(section.headerLetterSpacing != null ? { '--sec-head-ls': `${section.headerLetterSpacing}em` } : {}),
    ...(section.headerLineHeight != null ? { '--sec-head-lh': String(section.headerLineHeight) } : {}),
  }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <section v-for="row in rows" :key="row.section.id" class="flex flex-col gap-5">
      <header
        v-if="row.header"
        :id="sectionAnchorId(row.section)"
        class="scroll-mt-40"
        :style="headStyle(row.section)"
      >
        <p
          v-if="!isBlankInlineHtml(row.section.kicker)"
          class="mono mb-1.5 text-[10px] font-extrabold uppercase text-[var(--color-primary)]"
          style="letter-spacing: var(--sec-head-ls, 0.1em); line-height: var(--sec-head-lh, 1.4)"
          v-html="sanitizeInlineHtml(row.section.kicker)"
        />
        <h2
          v-if="!isBlankInlineHtml(row.section.title)"
          class="text-[24px] font-extrabold text-[var(--studio-ink)] [text-wrap:balance]"
          style="line-height: var(--sec-head-lh, 1.2); letter-spacing: var(--sec-head-ls, -0.015em)"
          v-html="sanitizeInlineHtml(row.section.title)"
        />
        <p
          v-if="!isBlankInlineHtml(row.section.description)"
          class="mt-2 max-w-[64ch] text-[15px] text-[var(--studio-muted)] [text-wrap:pretty]"
          style="line-height: var(--sec-head-lh, 1.6); letter-spacing: var(--sec-head-ls, normal)"
          v-html="sanitizeInlineHtml(row.section.description)"
        />
      </header>

      <template v-for="block in row.blocks" :key="block.id">
        <div :id="`block-${block.id}`" class="scroll-mt-40">
          <BlockRenderer v-if="isBare(block)" :block="block" :readonly="true" />
          <div v-else class="rounded-[14px] border border-[var(--studio-line)] p-5">
            <p v-if="showsTitle(block)" class="mb-3.5 text-[13px] font-bold text-[var(--studio-ink)]">{{ block.config.title }}</p>
            <BlockRenderer :block="block" :readonly="true" />
          </div>
        </div>
      </template>
    </section>

    <div
      v-if="isEmpty"
      class="rounded-2xl border border-dashed border-[var(--studio-line)] bg-[var(--studio-wash)] py-16 text-center text-[13px] text-[var(--studio-faint)]"
    >
      Cet article ne contient aucun contenu pour le moment.
    </div>
  </div>
</template>
