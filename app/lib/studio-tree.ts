import type { Section, StudioBlock } from '@/types/studio'
import { isContainerBlock, scriptIdFromZone } from '@/types/studio'

/**
 * Traversée générique blocs↔sections utilisée pour calculer les descendants
 * d'un bloc conteneur (`loop`/`if`/`layout`) ou d'une section : blocs de ses
 * zones de script + colonnes, sections nichées, et récursivement leurs propres
 * descendants. Ne dépend d'aucun store — testable en isolation.
 */
type DescendantsSeed = { kind: 'block'; id: string } | { kind: 'section'; id: string }

export function collectDescendants(
  seed: DescendantsSeed,
  blocks: StudioBlock[],
  sections: Section[],
): { blocks: Set<string>; sections: Set<string> } {
  const outBlocks = new Set<string>()
  const outSections = new Set<string>()
  const blockStack: string[] = seed.kind === 'block' ? [seed.id] : []
  const sectionStack: string[] = seed.kind === 'section' ? [seed.id] : []

  while (blockStack.length || sectionStack.length) {
    if (blockStack.length) {
      const bid = blockStack.pop()!
      for (const b of blocks) {
        if (scriptIdFromZone(b.zoneId) === bid && !outBlocks.has(b.id)) {
          outBlocks.add(b.id)
          if (isContainerBlock(b.type)) blockStack.push(b.id)
        }
      }
      for (const s of sections) {
        if (s.zoneId && scriptIdFromZone(s.zoneId) === bid && !outSections.has(s.id)) {
          outSections.add(s.id)
          sectionStack.push(s.id)
        }
      }
    } else {
      const sid = sectionStack.pop()!
      for (const b of blocks) {
        if (b.zoneId.startsWith(`${sid}-`) && !outBlocks.has(b.id)) {
          outBlocks.add(b.id)
          if (isContainerBlock(b.type)) blockStack.push(b.id)
        }
      }
    }
  }

  return { blocks: outBlocks, sections: outSections }
}

/** Descendants d'un bloc conteneur — blocs et sections nichées (zones de script + colonnes). */
export function scriptDescendantsOf(
  blockId: string,
  blocks: StudioBlock[],
  sections: Section[],
): { blocks: Set<string>; sections: Set<string> } {
  return collectDescendants({ kind: 'block', id: blockId }, blocks, sections)
}

/** Descendants d'une section — blocs de ses colonnes + sous-sections/blocs récursifs. */
export function sectionDescendantsOf(
  sectionId: string,
  blocks: StudioBlock[],
  sections: Section[],
): { blocks: Set<string>; sections: Set<string> } {
  return collectDescendants({ kind: 'section', id: sectionId }, blocks, sections)
}
