<script setup lang="ts">
import { computed } from 'vue'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock, StudioDocumentPage } from '@/types/studio'

const props = defineProps<{
  page: StudioDocumentPage
  accentColor?: string | null
}>()

const studio = useStudioStore()

// The search block (usually on the source page, e.g. "Vue nationale") whose
// targetPageId points to this template page — it's the one that feeds it.
const linkedSearchBlock = computed<StudioBlock | undefined>(() =>
  studio.blocks.find((b: StudioBlock) => b.type === 'search' && b.fieldMapping.targetPageId === props.page.id),
)

const currentValue = computed(() => {
  const block = linkedSearchBlock.value
  if (!block) return ''
  const titleCol = block.fieldMapping.resultTitleColumn
  if (!titleCol) return ''
  const title = studio.pageParams[titleCol]
  if (!title) return ''
  const descCol = block.fieldMapping.resultDescColumns?.[0]
  const desc = descCol ? studio.pageParams[descCol] : ''
  return desc ? `${title} (${desc})` : title
})

function clearSelection() {
  studio.setPageParams({})
}
</script>

<template>
  <div
    v-if="linkedSearchBlock"
    class="rounded-2xl border px-[22px] py-5"
    :style="{
      borderColor: `color-mix(in srgb, ${accentColor || 'var(--color-primary)'} 25%, transparent)`,
      backgroundColor: `color-mix(in srgb, ${accentColor || 'var(--color-primary)'} 4%, white)`,
    }"
  >
    <p class="mb-2.5 text-[11px] font-bold uppercase tracking-[0.04em]" :style="{ color: accentColor || 'var(--color-primary)' }">
      Paramètre de la vue<template v-if="page.paramName"> · Rechercher {{ page.paramName }}</template>
    </p>

    <div
      v-if="currentValue"
      class="flex items-center gap-2.5 rounded-xl border-[1.5px] bg-white px-4 py-3.5"
      :style="{ borderColor: `color-mix(in srgb, ${accentColor || 'var(--color-primary)'} 35%, transparent)` }"
    >
      <span class="opacity-40">⌕</span>
      <span class="flex-1 text-[14.5px] font-semibold text-[#18181f]">{{ currentValue }}</span>
      <button type="button" class="text-xs text-[#18181f]/40 transition-colors hover:text-[#18181f]/70" @click="clearSelection">✕</button>
    </div>

    <BlockRenderer v-else :block="linkedSearchBlock" :readonly="true" />
  </div>
</template>
