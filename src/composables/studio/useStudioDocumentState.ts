import { computed, nextTick, ref, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import {
  cloneBlock,
  createEmptyBlock,
  type StudioBlock,
  type StudioBlockType,
  type StudioDocumentKind,
  type StudioDocumentSettings,
} from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import type { StatsDataDocumentDto } from '@/types/statsdata-document-api'

export type SourcesFeedback = { kind: 'success' | 'error'; text: string }

export function useStudioDocumentState(route: RouteLocationNormalizedLoaded, documentKind: Ref<StudioDocumentKind>) {
  const isCreate = computed(() => route.name === 'studio-statsdata-create')
  const isStatsDataRemote = computed(() => documentKind.value === 'statsdata')

  const title = ref('Sans titre')
  const blocks = ref<StudioBlock[]>([])
  const dataSources = ref<StudioDataSource[]>([])
  const settings = ref<StudioDocumentSettings>({ subtitle: '', visibility: 'private' })

  const isDirty = ref(false)
  const suppressDirty = ref(false)
  /** Ignore les touch() déclenchés par sync API / chargement des sources */
  const suppressDataSourcesDirty = ref(0)

  const loadState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const loadError = ref<string | null>(null)
  const saving = ref(false)
  const deleting = ref(false)
  const documentSlug = ref('')
  const pendingRouteBootstrap = ref<StatsDataDocumentDto | null>(null)

  const sourcesFeedback = ref<SourcesFeedback | null>(null)
  const sourcesBusy = ref(false)

  const statsDataDocumentId = computed(() => {
    if (!isStatsDataRemote.value || isCreate.value) return null
    const id = String(route.params.id ?? '')
    return id || null
  })

  const touch = () => {
    if (!suppressDirty.value) isDirty.value = true
  }

  const applyFromDto = (doc: StatsDataDocumentDto, options?: { skipDataSources?: boolean }) => {
    title.value = doc.title || 'Sans titre'
    settings.value = { subtitle: doc.subtitle ?? '', visibility: doc.visibility }
    blocks.value = Array.isArray(doc.blocks) ? [...doc.blocks] : []
    if (!options?.skipDataSources) dataSources.value = Array.isArray(doc.dataSources) ? [...doc.dataSources] : []
    documentSlug.value = doc.slug
  }

  watch(title, touch, { flush: 'post' })
  watch(settings, touch, { deep: true, flush: 'post' })
  watch(blocks, touch, { deep: true, flush: 'post' })
  watch(
    dataSources,
    () => {
      if (suppressDataSourcesDirty.value > 0) return
      touch()
    },
    { deep: true, flush: 'post' },
  )

  const addBlock = (type: StudioBlockType) => {
    blocks.value = [...blocks.value, createEmptyBlock(type)]
  }

  const mapBlocksDeep = (list: StudioBlock[], fn: (b: StudioBlock) => StudioBlock): StudioBlock[] => {
    return list.map((b) => {
      const next = fn(b)
      if ((next.type === 'layout_2col' || next.type === 'layout_3col') && Array.isArray(next.columns)) {
        const cols = next.columns.map((col) => mapBlocksDeep(col, fn))
        return { ...next, columns: cols }
      }
      return next
    })
  }

  const filterBlocksDeep = (list: StudioBlock[], pred: (b: StudioBlock) => boolean): StudioBlock[] => {
    return list
      .filter(pred)
      .map((b) => {
        if ((b.type === 'layout_2col' || b.type === 'layout_3col') && Array.isArray(b.columns)) {
          const cols = b.columns.map((col) => filterBlocksDeep(col, pred))
          return { ...b, columns: cols }
        }
        return b
      })
  }

  const duplicateBlockDeep = (list: StudioBlock[], id: string): { blocks: StudioBlock[]; duplicated: boolean } => {
    let duplicated = false

    const walk = (arr: StudioBlock[]): StudioBlock[] => {
      const out: StudioBlock[] = []
      for (const b of arr) {
        out.push(b)
        if (b.id === id) {
          out.push(cloneBlock(b))
          duplicated = true
          continue
        }
        if ((b.type === 'layout_2col' || b.type === 'layout_3col') && Array.isArray(b.columns)) {
          const cols = b.columns.map((col) => walk(col))
          out[out.length - 1] = { ...b, columns: cols }
        }
      }
      return out
    }

    return { blocks: walk(list), duplicated }
  }

  const removeBlock = (id: string) => {
    blocks.value = filterBlocksDeep(blocks.value, (b) => b.id !== id)
  }

  const duplicateBlock = (id: string) => {
    const res = duplicateBlockDeep(blocks.value, id)
    if (!res.duplicated) return
    blocks.value = res.blocks
  }

  const updateBlock = (next: StudioBlock) => {
    blocks.value = mapBlocksDeep(blocks.value, (b) => (b.id === next.id ? next : b))
  }

  const updateDataSource = (next: StudioDataSource) => {
    dataSources.value = dataSources.value.map((s) => (s.id === next.id ? next : s))
  }

  const resetLocalArticleLike = async () => {
    suppressDirty.value = true
    isDirty.value = false
    if (isCreate.value) {
      title.value = documentKind.value === 'article' ? 'Nouvel article' : 'Nouvelle StatsData'
      blocks.value = []
      dataSources.value = []
      settings.value = { subtitle: '', visibility: 'private' }
    } else {
      title.value =
        documentKind.value === 'article'
          ? `Article ${String(route.params.id)}`
          : `StatsData ${String(route.params.id)}`
      blocks.value = []
      dataSources.value = []
      settings.value = { subtitle: 'Brouillon local', visibility: 'team' }
    }
    documentSlug.value = ''
    await nextTick()
    suppressDirty.value = false
  }

  return {
    isCreate,
    isStatsDataRemote,
    statsDataDocumentId,
    title,
    blocks,
    dataSources,
    settings,
    isDirty,
    suppressDirty,
    suppressDataSourcesDirty,
    loadState,
    loadError,
    saving,
    deleting,
    documentSlug,
    pendingRouteBootstrap,
    sourcesFeedback,
    sourcesBusy,
    touch,
    applyFromDto,
    addBlock,
    removeBlock,
    duplicateBlock,
    updateBlock,
    updateDataSource,
    resetLocalArticleLike,
  }
}

