import type { Ref } from 'vue'
import type { BlockFilter, BlockJoin, FieldMapping, FilterGroup, StudioBlock } from '@/types/studio'

export function useStudioBlockFilters(deps: {
  blocks: Ref<StudioBlock[]>
  syncAutoPageParam: (blockId: string) => void
  snapshot: () => void
  markDirty: () => void
}) {
  const { blocks, syncAutoPageParam, snapshot, markDirty } = deps

  function updateBlockFieldMapping(blockId: string, mapping: Partial<FieldMapping>) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.fieldMapping = { ...block.fieldMapping, ...mapping }
    syncAutoPageParam(blockId)
    markDirty()
  }

  function updateBlockFilters(blockId: string, filters: BlockFilter[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.filters = filters
    markDirty()
  }

  function updateBlockComparisonFilters(blockId: string, filters: BlockFilter[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.comparisonFilters = filters
    markDirty()
  }

  function updateBlockFilterGroups(blockId: string, groups: FilterGroup[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.filterGroups = groups
    markDirty()
  }

  function updateBlockFiltersMatch(blockId: string, match: 'all' | 'any') {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.filtersMatch = match
    markDirty()
  }

  function updateBlockComparisonFilterGroups(blockId: string, groups: FilterGroup[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.comparisonFilterGroups = groups
    markDirty()
  }

  function updateBlockComparisonFiltersMatch(blockId: string, match: 'all' | 'any') {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.comparisonFiltersMatch = match
    markDirty()
  }

  function updateBlockJoins(blockId: string, joins: BlockJoin[]) {
    snapshot()
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block) return
    block.joins = joins
    syncAutoPageParam(blockId)
    markDirty()
  }

  return {
    updateBlockFieldMapping,
    updateBlockFilters,
    updateBlockComparisonFilters,
    updateBlockFilterGroups,
    updateBlockFiltersMatch,
    updateBlockComparisonFilterGroups,
    updateBlockComparisonFiltersMatch,
    updateBlockJoins,
  }
}
