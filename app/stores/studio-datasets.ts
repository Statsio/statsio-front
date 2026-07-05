import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { fetchDatasets, fetchDatasetSchema, fetchDatasetPreview, deleteDataset } from '@/api/studio'
import type { DatasetMeta, DatasetWithSchema } from '@/types/studio'
import type { DatasetPreview } from '@/api/studio'

const POLL_INTERVAL_MS = 3000

export const useStudioDatasetsStore = defineStore('studio-datasets', () => {
  const datasets = ref<DatasetMeta[]>([])
  const schemas = ref<Map<string, DatasetWithSchema>>(new Map())
  const previews = ref<Map<string, DatasetPreview>>(new Map())
  const previewErrors = ref<Map<string, string>>(new Map())
  const isLoading = ref(false)
  const loadingSchemas = ref<Set<string>>(new Set())
  const loadingPreviews = ref<Set<string>>(new Set())

  let pollTimer: ReturnType<typeof setTimeout> | null = null

  const hasPending = computed(() =>
    datasets.value.some((d: DatasetMeta) => d.status === 'pending'),
  )

  const readyDatasets = computed(() =>
    datasets.value.filter((d: DatasetMeta) => d.status === 'ready'),
  )

  async function loadDatasets() {
    if (isLoading.value) return
    isLoading.value = true
    try {
      const previous = new Map(datasets.value.map((d) => [d.id, d.status]))
      datasets.value = await fetchDatasets()

      // Invalidate schema/preview cache for datasets that just became ready
      for (const d of datasets.value) {
        if (previous.get(d.id) === 'pending' && d.status === 'ready') {
          schemas.value.delete(d.id)
          previews.value.delete(d.id)
          previewErrors.value.delete(d.id)
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  function stopPolling() {
    if (pollTimer !== null) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  }

  function scheduleNextPoll() {
    stopPolling()
    pollTimer = setTimeout(async () => {
      await loadDatasets()
      if (hasPending.value) scheduleNextPoll()
    }, POLL_INTERVAL_MS)
  }

  watch(hasPending, (pending) => {
    if (pending) scheduleNextPoll()
    else stopPolling()
  })

  async function loadSchema(datasetId: string): Promise<DatasetWithSchema | null> {
    if (schemas.value.has(datasetId)) {
      return schemas.value.get(datasetId)!
    }

    if (loadingSchemas.value.has(datasetId)) return null

    loadingSchemas.value.add(datasetId)
    try {
      const schema = await fetchDatasetSchema(datasetId)
      schemas.value.set(datasetId, schema)
      return schema
    } catch {
      return null
    } finally {
      loadingSchemas.value.delete(datasetId)
    }
  }

  function getSchema(datasetId: string): DatasetWithSchema | undefined {
    return schemas.value.get(datasetId)
  }

  function isLoadingSchema(datasetId: string): boolean {
    return loadingSchemas.value.has(datasetId)
  }

  async function loadPreview(datasetId: string): Promise<DatasetPreview | null> {
    if (previews.value.has(datasetId)) {
      return previews.value.get(datasetId)!
    }
    if (loadingPreviews.value.has(datasetId)) return null
    loadingPreviews.value.add(datasetId)
    previewErrors.value.delete(datasetId)
    try {
      const preview = await fetchDatasetPreview(datasetId)
      previews.value.set(datasetId, preview)
      return preview
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      previewErrors.value.set(datasetId, msg)
      return null
    } finally {
      loadingPreviews.value.delete(datasetId)
    }
  }

  function getPreview(datasetId: string): DatasetPreview | undefined {
    return previews.value.get(datasetId)
  }

  function getPreviewError(datasetId: string): string | undefined {
    return previewErrors.value.get(datasetId)
  }

  function isLoadingPreview(datasetId: string): boolean {
    return loadingPreviews.value.has(datasetId)
  }

  async function removeDataset(datasetId: string): Promise<void> {
    await deleteDataset(datasetId)
    datasets.value = datasets.value.filter((d: DatasetMeta) => d.id !== datasetId)
    schemas.value.delete(datasetId)
    previews.value.delete(datasetId)
    previewErrors.value.delete(datasetId)
  }

  return {
    datasets,
    readyDatasets,
    hasPending,
    isLoading,
    loadDatasets,
    loadSchema,
    getSchema,
    isLoadingSchema,
    loadPreview,
    getPreview,
    getPreviewError,
    isLoadingPreview,
    removeDataset,
  }
})

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string }
    const msg = axiosErr?.response?.data?.message ?? axiosErr?.message
    const status = axiosErr?.response?.status
    if (msg) return status ? `${status} — ${msg}` : msg
  }
  return 'Erreur inconnue'
}
