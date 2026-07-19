import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DatasetMeta, DatasetWithSchema } from '@/types/studio'

vi.mock('@/api/studio', () => ({
  fetchDatasets: vi.fn(),
  fetchDatasetSchema: vi.fn(),
  fetchDatasetPreview: vi.fn(),
  deleteDataset: vi.fn(),
}))

import { deleteDataset, fetchDatasetPreview, fetchDatasetSchema, fetchDatasets } from '@/api/studio'
import { useStudioDatasetsStore } from './studio-datasets'

const dataset = (overrides: Partial<DatasetMeta> = {}): DatasetMeta => ({
  id: 'ds-1',
  name: 'Ventes 2026',
  rowCount: 100,
  status: 'ready',
  ...overrides,
})

describe('useStudioDatasetsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('loadDatasets', () => {
    it('populates datasets from the API', async () => {
      vi.mocked(fetchDatasets).mockResolvedValue([dataset()])
      const store = useStudioDatasetsStore()

      await store.loadDatasets()

      expect(store.datasets).toEqual([dataset()])
      expect(store.isLoading).toBe(false)
    })

    it('does not run concurrently', async () => {
      let resolveFetch!: (value: DatasetMeta[]) => void
      vi.mocked(fetchDatasets).mockReturnValue(new Promise((resolve) => { resolveFetch = resolve }))
      const store = useStudioDatasetsStore()

      const first = store.loadDatasets()
      const second = store.loadDatasets()
      resolveFetch([dataset()])
      await Promise.all([first, second])

      expect(fetchDatasets).toHaveBeenCalledTimes(1)
    })

    it('resets isLoading even when the request fails', async () => {
      vi.mocked(fetchDatasets).mockRejectedValue(new Error('network error'))
      const store = useStudioDatasetsStore()

      await expect(store.loadDatasets()).rejects.toThrow('network error')

      expect(store.isLoading).toBe(false)
    })

    it('invalidates the cached schema/preview of a dataset that just became ready', async () => {
      vi.mocked(fetchDatasets).mockResolvedValueOnce([dataset({ status: 'pending' })])
      const store = useStudioDatasetsStore()
      await store.loadDatasets()

      vi.mocked(fetchDatasetSchema).mockResolvedValue({ ...dataset({ status: 'pending' }), columns: [] })
      await store.loadSchema('ds-1')
      expect(store.getSchema('ds-1')).toBeDefined()

      vi.mocked(fetchDatasets).mockResolvedValueOnce([dataset({ status: 'ready' })])
      await store.loadDatasets()

      expect(store.getSchema('ds-1')).toBeUndefined()
    })
  })

  describe('polling', () => {
    it('polls again while a dataset is pending, and stops once none are', async () => {
      vi.useFakeTimers()
      vi.mocked(fetchDatasets)
        .mockResolvedValueOnce([dataset({ status: 'pending' })])
        .mockResolvedValueOnce([dataset({ status: 'ready' })])
      const store = useStudioDatasetsStore()

      await store.loadDatasets()
      expect(store.hasPending).toBe(true)

      await vi.advanceTimersByTimeAsync(3000)

      expect(fetchDatasets).toHaveBeenCalledTimes(2)
      expect(store.hasPending).toBe(false)

      await vi.advanceTimersByTimeAsync(10_000)
      expect(fetchDatasets).toHaveBeenCalledTimes(2)
    })
  })

  describe('loadSchema', () => {
    it('fetches and caches the schema', async () => {
      const schema: DatasetWithSchema = { ...dataset(), columns: [{ name: 'a', type: 'string', nullable: false }] }
      vi.mocked(fetchDatasetSchema).mockResolvedValue(schema)
      const store = useStudioDatasetsStore()

      const result = await store.loadSchema('ds-1')

      expect(result).toEqual(schema)
      expect(fetchDatasetSchema).toHaveBeenCalledTimes(1)

      await store.loadSchema('ds-1')
      expect(fetchDatasetSchema).toHaveBeenCalledTimes(1)
    })

    it('returns null and clears the loading flag when the request fails', async () => {
      vi.mocked(fetchDatasetSchema).mockRejectedValue(new Error('boom'))
      const store = useStudioDatasetsStore()

      const result = await store.loadSchema('ds-1')

      expect(result).toBeNull()
      expect(store.isLoadingSchema('ds-1')).toBe(false)
    })

    it('guards against concurrent loads of the same dataset', async () => {
      let resolveFetch!: (value: DatasetWithSchema) => void
      vi.mocked(fetchDatasetSchema).mockReturnValue(new Promise((resolve) => { resolveFetch = resolve }))
      const store = useStudioDatasetsStore()

      const first = store.loadSchema('ds-1')
      const second = store.loadSchema('ds-1')
      expect(await second).toBeNull()

      resolveFetch({ ...dataset(), columns: [] })
      await first

      expect(fetchDatasetSchema).toHaveBeenCalledTimes(1)
    })
  })

  describe('loadPreview', () => {
    it('fetches and caches the preview', async () => {
      vi.mocked(fetchDatasetPreview).mockResolvedValue({ columns: ['a'], rows: [[1]], total: 1 })
      const store = useStudioDatasetsStore()

      const preview = await store.loadPreview('ds-1')

      expect(preview).toEqual({ columns: ['a'], rows: [[1]], total: 1 })
      expect(store.getPreview('ds-1')).toEqual(preview)
    })

    it('extracts a friendly message from an axios-shaped error', async () => {
      vi.mocked(fetchDatasetPreview).mockRejectedValue({ response: { status: 422, data: { message: 'Colonne invalide' } } })
      const store = useStudioDatasetsStore()

      const preview = await store.loadPreview('ds-1')

      expect(preview).toBeNull()
      expect(store.getPreviewError('ds-1')).toBe('422 — Colonne invalide')
    })

    it('falls back to a generic message for an unrecognized error shape', async () => {
      vi.mocked(fetchDatasetPreview).mockRejectedValue('not an error object')
      const store = useStudioDatasetsStore()

      await store.loadPreview('ds-1')

      expect(store.getPreviewError('ds-1')).toBe('Erreur inconnue')
    })
  })

  describe('removeDataset', () => {
    it('deletes remotely and clears every local cache entry', async () => {
      vi.mocked(fetchDatasets).mockResolvedValue([dataset()])
      vi.mocked(fetchDatasetSchema).mockResolvedValue({ ...dataset(), columns: [] })
      vi.mocked(deleteDataset).mockResolvedValue(undefined)
      const store = useStudioDatasetsStore()
      await store.loadDatasets()
      await store.loadSchema('ds-1')

      await store.removeDataset('ds-1')

      expect(deleteDataset).toHaveBeenCalledWith('ds-1')
      expect(store.datasets).toEqual([])
      expect(store.getSchema('ds-1')).toBeUndefined()
    })
  })
})
