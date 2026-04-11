import { computed, nextTick, ref, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import {
  cloneBlock,
  createEmptyBlock,
  type StudioBlock,
  type StudioDocumentKind,
  type StudioDocumentSettings,
} from '@/types/studio-document'

const demoBlocksById: Record<string, StudioBlock[]> = {
  'inflation-par-ville-en-france': [
    createEmptyBlock('text_heading'),
    createEmptyBlock('text_paragraph'),
    createEmptyBlock('chart'),
  ],
}

function seedBlocksForRoute(route: RouteLocationNormalizedLoaded): StudioBlock[] {
  const id = String(route.params.id ?? '')
  if (route.name === 'studio-statsdata-edit' && demoBlocksById[id]) {
    return demoBlocksById[id].map((b) => cloneBlock(b))
  }
  return []
}

export function useStudioDocument(
  route: RouteLocationNormalizedLoaded,
  documentKind: Ref<StudioDocumentKind>,
) {
  const isCreate = computed(() => route.name === 'studio-statsdata-create')

  const title = ref('Sans titre')
  const blocks = ref<StudioBlock[]>([])
  const settings = ref<StudioDocumentSettings>({
    subtitle: '',
    visibility: 'private',
  })
  const isDirty = ref(false)
  const suppressDirty = ref(false)

  const touch = () => {
    if (!suppressDirty.value) {
      isDirty.value = true
    }
  }

  const resetFromRoute = async () => {
    suppressDirty.value = true
    isDirty.value = false
    if (isCreate.value) {
      title.value = documentKind.value === 'article' ? 'Nouvel article' : 'Nouvelle StatsData'
      blocks.value = []
      settings.value = { subtitle: '', visibility: 'private' }
    } else {
      title.value =
        documentKind.value === 'article'
          ? `Article ${String(route.params.id)}`
          : `StatsData ${String(route.params.id)}`
      blocks.value = seedBlocksForRoute(route)
      settings.value = { subtitle: 'Brouillon local', visibility: 'team' }
    }
    await nextTick()
    suppressDirty.value = false
  }

  watch(
    () => [route.fullPath, documentKind.value] as const,
    () => {
      void resetFromRoute()
    },
    { immediate: true },
  )

  watch(title, touch, { flush: 'post' })
  watch(settings, touch, { deep: true, flush: 'post' })
  watch(blocks, touch, { deep: true, flush: 'post' })

  const addBlock = (type: StudioBlockType) => {
    blocks.value = [...blocks.value, createEmptyBlock(type)]
  }

  const removeBlock = (id: string) => {
    blocks.value = blocks.value.filter((b) => b.id !== id)
  }

  const duplicateBlock = (id: string) => {
    const index = blocks.value.findIndex((b) => b.id === id)
    if (index === -1) return
    const copy = cloneBlock(blocks.value[index]!)
    const next = [...blocks.value]
    next.splice(index + 1, 0, copy)
    blocks.value = next
  }

  const updateBlock = (next: StudioBlock) => {
    blocks.value = blocks.value.map((b) => (b.id === next.id ? next : b))
  }

  return {
    isCreate,
    title,
    blocks,
    settings,
    isDirty,
    addBlock,
    removeBlock,
    duplicateBlock,
    updateBlock,
  }
}
