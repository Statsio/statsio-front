<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchDatasetSchema, fetchDatasetPreview, type DatasetPreview } from '@/api/studio'
import { refreshDataSource } from '@/api/data-sources'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { DatasetMeta, DatasetWithSchema } from '@/types/studio'
import AppModal from '@/components/ui/AppModal.vue'

const props = defineProps<{ dataset: DatasetMeta }>()
const emit = defineEmits<{ close: [] }>()
const datasets = useStudioDatasetsStore()

const PREVIEW_LIMIT = 100

const loading = ref(true)
const error = ref('')
const schema = ref<DatasetWithSchema | null>(null)
const preview = ref<DatasetPreview | null>(null)

// ─── Actualisation immédiate (source API) ─────────────────────────────────────
const refreshing = ref(false)
const refreshMessage = ref('')
const lastRefreshedAt = ref(props.dataset.lastRefreshedAt)
const nextRefreshAt = ref(props.dataset.nextRefreshAt)

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

async function handleRefreshNow() {
  if (!props.dataset.dataSourceId) return
  refreshing.value = true
  refreshMessage.value = ''
  try {
    const updated = await refreshDataSource(props.dataset.dataSourceId)
    lastRefreshedAt.value = updated.lastRefreshedAt
    nextRefreshAt.value = updated.nextRefreshAt
    refreshMessage.value = 'Actualisation lancée — traitement en cours'
    await datasets.loadDatasets()
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    refreshMessage.value = msg ?? "Impossible d'actualiser cette source."
  } finally {
    refreshing.value = false
  }
}

const typeColors: Record<string, string> = {
  string: 'bg-slate-100 text-slate-500',
  integer: 'bg-blue-50 text-blue-600',
  float: 'bg-cyan-50 text-cyan-600',
  boolean: 'bg-amber-50 text-amber-600',
  date: 'bg-green-50 text-green-700',
  datetime: 'bg-green-50 text-green-700',
}

const formatRows = (n: number) => n.toLocaleString('fr-FR')

onMounted(async () => {
  try {
    const [schemaRes, previewRes] = await Promise.all([
      fetchDatasetSchema(props.dataset.id),
      fetchDatasetPreview(props.dataset.id, PREVIEW_LIMIT),
    ])
    schema.value = schemaRes
    preview.value = previewRes
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    error.value = msg ?? 'Impossible de charger les données de cette source.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppModal :open="true" :title="dataset.name" size="xl" @close="emit('close')">
    <div v-if="loading" class="flex items-center justify-center py-16 gap-2 text-sm text-slate-400">
      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Chargement des données…
    </div>

    <p v-else-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</p>

    <div v-else class="flex flex-col gap-6">
      <p class="text-xs text-slate-400">
        {{ formatRows(dataset.rowCount) }} lignes · {{ schema?.columns.length ?? 0 }} colonnes
      </p>

      <!-- Refresh (API sources only) -->
      <div v-if="dataset.sourceKind === 'api'" class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <button
          type="button"
          class="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
          :class="refreshing
            ? 'border-slate-200 text-slate-400 cursor-wait'
            : 'border-blue-200 text-blue-600 hover:bg-blue-50'"
          :disabled="refreshing"
          @click="handleRefreshNow"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': refreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Actualiser maintenant
        </button>
        <div class="text-[11px] text-slate-500 leading-tight">
          <p>Dernière actualisation : {{ formatDateTime(lastRefreshedAt) }}</p>
          <p v-if="dataset.refreshFrequency && dataset.refreshFrequency !== 'none'">
            Prochaine actualisation : {{ formatDateTime(nextRefreshAt) }}
          </p>
        </div>
      </div>
      <p v-if="refreshMessage" class="text-xs text-slate-500 -mt-3">{{ refreshMessage }}</p>

      <!-- Columns -->
      <div>
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Colonnes</p>
        <div class="rounded-xl border border-slate-200 overflow-hidden">
          <table class="w-full text-xs">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 py-2 text-left font-semibold text-slate-500">Nom</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-500">Type</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-500">Nullable</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="col in schema?.columns ?? []"
                :key="col.name"
                class="border-t border-slate-100"
              >
                <td class="px-3 py-1.5 font-mono text-slate-700">{{ col.name }}</td>
                <td class="px-3 py-1.5">
                  <span
                    class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                    :class="typeColors[col.type] ?? 'bg-slate-100 text-slate-400'"
                  >{{ col.type }}</span>
                </td>
                <td class="px-3 py-1.5 text-slate-400">{{ col.nullable ? 'Oui' : 'Non' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Data preview -->
      <div>
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Données
          <span v-if="preview" class="font-normal normal-case">
            ({{ preview.rows.length }} sur {{ formatRows(preview.total) }} lignes)
          </span>
        </p>
        <div v-if="preview && preview.rows.length" class="overflow-auto max-h-[50vh] rounded-xl border border-slate-200">
          <table class="w-full text-xs border-collapse">
            <thead class="sticky top-0 bg-slate-50">
              <tr>
                <th
                  v-for="col in preview.columns"
                  :key="col"
                  class="px-3 py-2 text-left font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap"
                >{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, ri) in preview.rows"
                :key="ri"
                class="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td
                  v-for="(cell, ci) in row"
                  :key="ci"
                  class="px-3 py-1.5 text-slate-700 font-mono whitespace-nowrap"
                  :title="cell != null ? String(cell) : ''"
                >{{ cell != null ? cell : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-xs text-slate-400 italic">Aucune donnée disponible.</p>
      </div>
    </div>
  </AppModal>
</template>
