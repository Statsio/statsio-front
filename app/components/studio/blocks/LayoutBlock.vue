<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { SECTION_LAYOUT_DEFINITIONS, scriptZoneId } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'
import BlockRenderer from './BlockRenderer.vue'
import BlockCard from './BlockCard.vue'
import CanvasZone from '@/components/studio/canvas/CanvasZone.vue'

/**
 * Bloc « Disposition » : grille de colonnes dans laquelle on glisse d'autres blocs
 * (ex-agencement en colonnes des sections, désormais un bloc parmi les autres).
 * Pendant de `LoopBlock`/`IfBlock` — mêmes zones imbriquées (`scriptZoneId`), mais
 * une par colonne plutôt qu'une par itération/branche.
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()

const def = computed(
  () => SECTION_LAYOUT_DEFINITIONS.find((d) => d.type === props.block.config.layoutType) ?? SECTION_LAYOUT_DEFINITIONS[1]!,
)

const zoneIds = computed(() =>
  Array.from({ length: def.value.cols }, (_, i) => scriptZoneId(props.block.id, i)),
)

function blocksInZone(zoneId: string): StudioBlock[] {
  return studio.blocksByZone[zoneId] ?? []
}
</script>

<template>
  <!-- ══════════ ÉDITEUR ══════════ -->
  <div
    v-if="!readonly"
    class="grid items-start gap-4"
    :style="{ gridTemplateColumns: def.gridCols.map((s: number) => `${s}fr`).join(' ') }"
    @click.stop
  >
    <CanvasZone v-for="(zoneId, i) in zoneIds" :key="zoneId" :zone-id="zoneId" :col-index="i" nested />
  </div>

  <!-- ══════════ LECTURE SEULE (publié / aperçu) ══════════ -->
  <div
    v-else
    class="grid items-start gap-4"
    :style="{ gridTemplateColumns: def.gridCols.map((s: number) => `${s}fr`).join(' ') }"
  >
    <div v-for="zoneId in zoneIds" :key="zoneId" class="flex min-w-0 flex-col gap-4">
      <BlockCard v-for="child in blocksInZone(zoneId)" :key="child.id" :block="child" :scope="scope">
        <BlockRenderer :block="child" :readonly="true" :scope="scope" />
      </BlockCard>
    </div>
  </div>
</template>
