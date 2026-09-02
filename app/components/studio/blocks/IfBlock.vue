<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { scriptZoneId, isPageZone } from '@/types/studio'
import { FILTER_OPERATORS } from '@/types/studio'
import type { StudioBlock, FilterOperator, IfBranch, Section } from '@/types/studio'
import { readIfBranches, isElseBranch, evaluateIf, matchingBranchIndex } from '@/lib/studio-if'
import BlockRenderer from './BlockRenderer.vue'
import BlockCard from './BlockCard.vue'
import CanvasZone from '@/components/studio/canvas/CanvasZone.vue'
import CanvasSectionZone from '@/components/studio/canvas/CanvasSectionZone.vue'
import StatsDataSection from '@/components/statsdata/detail/StatsDataSection.vue'

/**
 * Bloc « Condition » : rend le contenu de la première branche (`Si` / `Sinon si` /
 * `Sinon`) dont les clauses sont satisfaites par les paramètres de page courants.
 * Pendant du bloc `loop` dans la catégorie « Script ».
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()

const branches = computed(() => readIfBranches(props.block.config))
const tokenMap = computed(() => ({ ...studio.pageParams, ...props.scope }))
const activeIndex = computed(() => matchingBranchIndex(branches.value, tokenMap.value))

// Bloc posé au niveau page → chaque branche contient des sections, pas des blocs.
const pageLevel = computed(() => isPageZone(props.block.zoneId))

function zoneId(i: number) {
  return scriptZoneId(props.block.id, i)
}
function childrenOf(i: number): StudioBlock[] {
  return studio.blocksByZone[zoneId(i)] ?? []
}
function sectionsOf(i: number): Section[] {
  return studio.sectionsInZone(zoneId(i))
}

function opShort(op: FilterOperator): string {
  return FILTER_OPERATORS.find((o) => o.value === op)?.short ?? op
}
function branchLabel(branch: IfBranch, i: number): string {
  if (isElseBranch(branches.value, i)) return 'Sinon'
  const real = branch.conditions.filter((c) => c.param)
  const prefix = i === 0 ? 'Si ' : 'Sinon si '
  if (!real.length) return `${prefix}…`
  const joiner = branch.match === 'any' ? ' OU ' : ' ET '
  return prefix + real.map((c) => `{{${c.param}}} ${opShort(c.operator)} ${c.value || '∅'}`).join(joiner)
}
function branchPasses(branch: IfBranch, i: number): boolean {
  if (isElseBranch(branches.value, i)) return activeIndex.value === i
  return evaluateIf(branch.conditions, branch.match === 'any' ? 'any' : 'all', tokenMap.value)
}
</script>

<template>
  <!-- ══════════ ÉDITEUR ══════════ -->
  <div v-if="!readonly" class="flex flex-col gap-3">
    <div
      v-for="(branch, i) in branches"
      :key="i"
      class="flex flex-col gap-2 rounded-2xl bg-[var(--studio-wash)]/40 p-1"
    >
      <div class="flex items-center gap-2 rounded-xl bg-[var(--studio-wash)] px-3 py-2">
        <svg class="h-4 w-4 shrink-0 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <span class="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--studio-muted)]">
          <span class="font-mono">{{ branchLabel(branch, i) }}</span>
          <span
            class="ml-1 font-semibold"
            :class="branchPasses(branch, i) ? 'text-emerald-600' : 'text-[var(--studio-faint)]'"
          >— {{ branchPasses(branch, i) ? 'vraie' : 'fausse' }} actuellement</span>
        </span>
      </div>

      <div @click.stop>
        <CanvasSectionZone v-if="pageLevel" :zone-id="zoneId(i)" />
        <CanvasZone v-else :zone-id="zoneId(i)" :col-index="0" nested />
      </div>
    </div>
  </div>

  <!-- ══════════ LECTURE SEULE ══════════ -->
  <template v-else>
    <template v-if="activeIndex >= 0">
      <div v-if="pageLevel" class="flex flex-col gap-4">
        <StatsDataSection
          v-for="child in sectionsOf(activeIndex)"
          :key="child.id"
          :section="child"
          :scope="scope"
        />
      </div>
      <div v-else-if="childrenOf(activeIndex).length" class="flex flex-col gap-3 sm:gap-4">
        <BlockCard v-for="child in childrenOf(activeIndex)" :key="child.id" :block="child" :scope="scope">
          <BlockRenderer :block="child" :readonly="true" :scope="scope" />
        </BlockCard>
      </div>
    </template>
  </template>
</template>
