<script setup lang="ts">
import { computed } from 'vue'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import { useStudioStore } from '@/stores/studio'
import { SECTION_LAYOUT_DEFINITIONS, isFormBlock, isTextBlock, scriptIdFromZone } from '@/types/studio'
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
    const def = SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === section.layout) ?? SECTION_LAYOUT_DEFINITIONS[0]!
    const blocks: StudioBlock[] = []
    for (let col = 0; col < def.cols; col++) {
      for (const b of studio.blocksByZone[`${section.id}-${col}`] ?? []) {
        if (!isFormBlock(b.type)) blocks.push(b)
      }
    }
    out.push({
      section,
      header: Boolean(section.kicker || section.title || section.description),
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
</script>

<template>
  <div class="flex flex-col gap-8">
    <section v-for="row in rows" :key="row.section.id" class="flex flex-col gap-5">
      <header
        v-if="row.header"
        :id="row.section.anchorId || undefined"
        class="scroll-mt-44"
      >
        <p
          v-if="row.section.kicker"
          class="mono mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-primary)]"
        >{{ row.section.kicker }}</p>
        <h2
          v-if="row.section.title"
          class="text-[24px] font-extrabold leading-[1.2] tracking-[-0.015em] text-[var(--studio-ink)] [text-wrap:balance]"
        >{{ row.section.title }}</h2>
        <p
          v-if="row.section.description"
          class="mt-2 max-w-[64ch] text-[15px] leading-[1.6] text-[var(--studio-muted)] [text-wrap:pretty]"
        >{{ row.section.description }}</p>
      </header>

      <template v-for="block in row.blocks" :key="block.id">
        <div :id="`block-${block.id}`" class="scroll-mt-44">
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
