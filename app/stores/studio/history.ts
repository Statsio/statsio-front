import { computed, ref, type Ref } from 'vue'
import type { Section, StudioBlock, StudioDocumentPage } from '@/types/studio'

interface HistoryEntry {
  pages: StudioDocumentPage[]
  sections: Section[]
  blocks: StudioBlock[]
}

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val))
}

const MAX_HISTORY = 50

export function useStudioHistory(deps: {
  pages: Ref<StudioDocumentPage[]>
  sections: Ref<Section[]>
  blocks: Ref<StudioBlock[]>
  currentPageId: Ref<string>
  selectedBlockId: Ref<string | null>
  selectedSectionId: Ref<string | null>
  isSidebarRightOpen: Ref<boolean>
  markDirty: () => void
}) {
  const { pages, sections, blocks, currentPageId, selectedBlockId, selectedSectionId, isSidebarRightOpen, markDirty } = deps

  const past = ref<HistoryEntry[]>([])
  const future = ref<HistoryEntry[]>([])

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  // Batch : coalesce plusieurs mutations (ex. un run de l'assistant IA) en une
  // seule entrée d'historique → « Annuler ces changements » = un seul Ctrl+Z.
  let batchDepth = 0
  let batchSnapshotTaken = false

  function beginBatch() {
    batchDepth++
    batchSnapshotTaken = false
  }

  function endBatch() {
    batchDepth = Math.max(0, batchDepth - 1)
  }

  // Call BEFORE applying a mutation to save the current state
  function snapshot() {
    if (batchDepth > 0) {
      if (batchSnapshotTaken) return
      batchSnapshotTaken = true
    }
    past.value = [
      ...past.value.slice(-(MAX_HISTORY - 1)),
      { pages: deepClone(pages.value), sections: deepClone(sections.value), blocks: deepClone(blocks.value) },
    ]
    future.value = []
  }

  function undo() {
    const prev = past.value[past.value.length - 1]
    if (!prev) return
    future.value = [
      ...future.value,
      { pages: deepClone(pages.value), sections: deepClone(sections.value), blocks: deepClone(blocks.value) },
    ]
    past.value = past.value.slice(0, -1)
    pages.value = prev.pages
    sections.value = prev.sections
    blocks.value = prev.blocks
    if (!pages.value.find((p: StudioDocumentPage) => p.id === currentPageId.value)) {
      currentPageId.value = pages.value[0]?.id ?? 'default'
    }
    selectedBlockId.value = null
    selectedSectionId.value = null
    isSidebarRightOpen.value = false
    markDirty()
  }

  function redo() {
    const next = future.value[future.value.length - 1]
    if (!next) return
    past.value = [
      ...past.value.slice(-(MAX_HISTORY - 1)),
      { pages: deepClone(pages.value), sections: deepClone(sections.value), blocks: deepClone(blocks.value) },
    ]
    future.value = future.value.slice(0, -1)
    pages.value = next.pages
    sections.value = next.sections
    blocks.value = next.blocks
    if (!pages.value.find((p: StudioDocumentPage) => p.id === currentPageId.value)) {
      currentPageId.value = pages.value[0]?.id ?? 'default'
    }
    selectedBlockId.value = null
    selectedSectionId.value = null
    isSidebarRightOpen.value = false
    markDirty()
  }

  /** Réinitialise l'historique — appelé par `initPage` au chargement d'un document. */
  function resetHistory() {
    past.value = []
    future.value = []
  }

  /** Annule la dernière entrée empilée — utilisé par `importPayload` pour son rollback en cas d'erreur. */
  function dropLastSnapshot() {
    past.value = past.value.slice(0, -1)
  }

  return { canUndo, canRedo, beginBatch, endBatch, snapshot, undo, redo, resetHistory, dropLastSnapshot }
}
