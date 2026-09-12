import type { Ref } from 'vue'
import type { Section, StudioBlock } from '@/types/studio'
import { scriptIdFromZone, scriptZoneId, scriptZoneBranch, isContainerBlock } from '@/types/studio'
import { readIfBranches, withAddedBranch, withRemovedBranch } from '@/lib/studio-if'
import { sectionDescendantsOf } from '@/lib/studio-tree'

export function useStudioIfBranches(deps: {
  blocks: Ref<StudioBlock[]>
  sections: Ref<Section[]>
  loopChildIds: (scriptBlockId: string) => string[]
  snapshot: () => void
  markDirty: () => void
}) {
  const { blocks, sections, loopChildIds, snapshot, markDirty } = deps

  /**
   * Réindexe les zones de branche d'un bloc `if` : `remap(i)` renvoie le nouvel
   * index de la branche `i`, ou `null` pour la supprimer (ses blocs + descendants
   * de script sont retirés). Ne touche pas `block.config`.
   */
  function reindexIfBranches(blockId: string, remap: (branch: number) => number | null) {
    const toRemove = new Set<string>()
    const sectionsToRemove = new Set<string>()
    for (const b of blocks.value) {
      if (scriptIdFromZone(b.zoneId) !== blockId) continue
      if (remap(scriptZoneBranch(b.zoneId)) === null) {
        toRemove.add(b.id)
        if (isContainerBlock(b.type)) loopChildIds(b.id).forEach((id) => toRemove.add(id))
      }
    }
    // Sections nichées dans les branches (bloc `if` de page qui conditionne des sections).
    for (const s of sections.value) {
      if (!s.zoneId || scriptIdFromZone(s.zoneId) !== blockId) continue
      if (remap(scriptZoneBranch(s.zoneId)) === null) {
        const d = sectionDescendantsOf(s.id, blocks.value, sections.value)
        sectionsToRemove.add(s.id)
        d.blocks.forEach((id) => toRemove.add(id))
        d.sections.forEach((id) => sectionsToRemove.add(id))
      }
    }
    if (toRemove.size) blocks.value = blocks.value.filter((b: StudioBlock) => !toRemove.has(b.id))
    if (sectionsToRemove.size) sections.value = sections.value.filter((s: Section) => !sectionsToRemove.has(s.id))
    for (const b of blocks.value) {
      if (scriptIdFromZone(b.zoneId) !== blockId) continue
      const next = remap(scriptZoneBranch(b.zoneId))
      if (next !== null) b.zoneId = scriptZoneId(blockId, next)
    }
    for (const s of sections.value) {
      if (!s.zoneId || scriptIdFromZone(s.zoneId) !== blockId) continue
      const next = remap(scriptZoneBranch(s.zoneId))
      if (next !== null) s.zoneId = scriptZoneId(blockId, next)
    }
  }

  function addIfBranch(blockId: string, kind: 'elsif' | 'else') {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block || block.type !== 'if') return
    const edit = withAddedBranch(readIfBranches(block.config), kind)
    if (!edit) return
    snapshot()
    reindexIfBranches(blockId, edit.remap)
    block.config = { ...block.config, ifBranches: edit.branches }
    markDirty()
  }

  function removeIfBranch(blockId: string, branchIndex: number) {
    const block = blocks.value.find((b: StudioBlock) => b.id === blockId)
    if (!block || block.type !== 'if') return
    const edit = withRemovedBranch(readIfBranches(block.config), branchIndex)
    if (!edit) return
    snapshot()
    reindexIfBranches(blockId, edit.remap)
    block.config = { ...block.config, ifBranches: edit.branches }
    markDirty()
  }

  return { addIfBranch, removeIfBranch }
}
