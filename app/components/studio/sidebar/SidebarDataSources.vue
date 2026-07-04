<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { DatasetMeta, DatasetWithSchema } from '@/types/studio'
import type { DatasetPreview } from '@/api/studio'
import AddSourceModal from './AddSourceModal.vue'

const datasets = useStudioDatasetsStore()
const showModal = ref(false)
const searchQuery = ref('')
const expandedId = ref<string | null>(null)

// ─── Edit (rename) ────────────────────────────────────────────────────────────
const editingId = ref<string | null>(null)
const editingName = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

function startEdit(dataset: DatasetMeta, event: Event) {
  event.stopPropagation()
  editingId.value = dataset.id
  editingName.value = dataset.name
  setTimeout(() => editInputRef.value?.select(), 0)
}

async function commitEdit(dataset: DatasetMeta) {
  const name = editingName.value.trim()
  if (name && name !== dataset.name) {
    await datasets.renameDataset(dataset.id, name)
  }
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

// ─── Delete ───────────────────────────────────────────────────────────────────
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)
const deleteError = ref('')

function confirmDelete(dataset: DatasetMeta, event: Event) {
  event.stopPropagation()
  deleteError.value = ''
  deletingId.value = dataset.id
}

async function executeDelete(datasetId: string) {
  deleteLoading.value = true
  deleteError.value = ''
  try {
    await datasets.removeDataset(datasetId)
    if (expandedId.value === datasetId) expandedId.value = null
    deletingId.value = null
  } catch (e: unknown) {
    const axiosErr = e as { response?: { status?: number; data?: { message?: string } }; message?: string }
    const status = axiosErr?.response?.status
    const msg = axiosErr?.response?.data?.message ?? axiosErr?.message
    deleteError.value = msg ? `${status ? status + ' — ' : ''}${msg}` : 'Erreur inconnue'
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  if (!datasets.datasets.length) datasets.loadDatasets()
})

async function toggleDataset(dataset: DatasetMeta) {
  if (editingId.value === dataset.id) return
  if (expandedId.value === dataset.id) {
    expandedId.value = null
    return
  }
  expandedId.value = dataset.id
  await Promise.all([
    datasets.loadSchema(dataset.id),
    datasets.loadPreview(dataset.id),
  ])
}

function getSchema(id: string): DatasetWithSchema | undefined {
  return datasets.getSchema(id)
}

const filteredDatasets = () => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return datasets.datasets
  return datasets.datasets.filter((d: DatasetMeta) =>
    d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q),
  )
}

const typeColors: Record<string, string> = {
  string: 'bg-slate-100 text-slate-500',
  integer: 'bg-blue-50 text-blue-600',
  float: 'bg-cyan-50 text-cyan-600',
  boolean: 'bg-amber-50 text-amber-600',
  date: 'bg-green-50 text-green-700',
  datetime: 'bg-green-50 text-green-700',
}

const formatRows = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

type SourceStatus = DatasetMeta['status']
const statusConfig: Record<SourceStatus, { label: string; dot: string; badge: string }> = {
  ready:    { label: 'Prêt',         dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700' },
  pending:  { label: 'Traitement…',  dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-50 text-amber-700' },
  failed:   { label: 'Erreur',       dot: 'bg-red-400',     badge: 'bg-red-50 text-red-600' },
}
</script>

<template>
  <div class="flex flex-col h-full">

    <!-- Search + refresh -->
    <div class="px-3 pt-3 pb-2 border-b border-slate-100 sticky top-0 bg-white z-10">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Rechercher une source…"
          class="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
        />
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
          title="Rafraîchir"
          @click="datasets.loadDatasets()"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Source list -->
    <div class="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">

      <!-- Loading -->
      <div v-if="datasets.isLoading" class="flex items-center justify-center py-8 gap-2 text-sm text-slate-400">
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Chargement…
      </div>

      <!-- Empty -->
      <div
        v-else-if="!filteredDatasets().length"
        class="flex flex-col items-center justify-center py-10 text-center text-slate-400"
      >
        <svg class="w-9 h-9 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
        <p class="text-sm font-medium text-slate-500">
          {{ searchQuery ? 'Aucun résultat' : 'Aucune source disponible' }}
        </p>
        <p v-if="!searchQuery" class="text-xs mt-1">Ajoutez votre première source ci-dessous</p>
      </div>

      <!-- Dataset cards -->
      <div
        v-for="dataset in filteredDatasets()"
        :key="dataset.id"
        class="rounded-xl border bg-white overflow-hidden transition-colors"
        :class="deletingId === dataset.id ? 'border-red-200' : 'border-slate-200'"
      >
        <!-- Delete confirmation overlay -->
        <div v-if="deletingId === dataset.id" class="px-3 py-2.5 bg-red-50 flex flex-col gap-1.5">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p class="text-xs text-red-700 font-medium flex-1">
              {{ dataset.isOwner === false ? 'Retirer cette source de vos sources ?' : 'Supprimer cette source ?' }}
            </p>
            <button
              class="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded transition-colors"
              @click="deletingId = null; deleteError = ''"
            >Non</button>
            <button
              class="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
              :disabled="deleteLoading"
              @click="executeDelete(dataset.id)"
            >
              <svg v-if="deleteLoading" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ dataset.isOwner === false ? 'Retirer' : 'Supprimer' }}
            </button>
          </div>
          <p v-if="deleteError" class="text-[11px] text-red-600 pl-6">{{ deleteError }}</p>
        </div>

        <!-- Header row -->
        <div
          v-else
          class="group flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
          @click="toggleDataset(dataset)"
        >
          <!-- Icon -->
          <span class="shrink-0 w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </span>

          <!-- Name (editable inline) -->
          <div class="flex-1 min-w-0" @click.stop>
            <input
              v-if="editingId === dataset.id"
              ref="editInputRef"
              v-model="editingName"
              type="text"
              class="w-full text-sm font-semibold text-slate-800 bg-white border border-[var(--color-primary)] rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              @blur="commitEdit(dataset)"
              @keydown.enter="commitEdit(dataset)"
              @keydown.escape="cancelEdit"
              @click.stop
            />
            <p v-else class="text-sm font-semibold text-slate-800 truncate">{{ dataset.name }}</p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="statusConfig[dataset.status].dot" />
              <span class="text-[10px] text-slate-400">
                {{ statusConfig[dataset.status].label }}
                <template v-if="dataset.status === 'ready'"> · {{ formatRows(dataset.rowCount) }} lignes</template>
              </span>
            </div>
          </div>

          <!-- Action buttons (visible on hover) -->
          <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              v-if="dataset.isOwner !== false"
              class="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Renommer"
              @click="startEdit(dataset, $event)"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
            </button>
            <button
              class="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              :title="dataset.isOwner === false ? 'Retirer de mes sources' : 'Supprimer'"
              @click="confirmDelete(dataset, $event)"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>

          <!-- Chevron -->
          <svg
            class="w-4 h-4 text-slate-300 shrink-0 transition-transform"
            :class="expandedId === dataset.id ? 'rotate-180' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
          </svg>
        </div>

        <!-- Schema panel (expanded) -->
        <div v-if="expandedId === dataset.id && deletingId !== dataset.id" class="border-t border-slate-100 bg-slate-50 px-3 py-2">
          <div v-if="datasets.isLoadingSchema(dataset.id)" class="text-xs text-slate-400 py-2 text-center">
            Chargement du schéma…
          </div>
          <template v-else-if="getSchema(dataset.id)">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Colonnes</p>
            <div class="flex flex-col gap-1">
              <div
                v-for="col in getSchema(dataset.id)!.columns.slice(0, 8)"
                :key="col.name"
                class="flex items-center gap-2"
              >
                <span class="font-mono text-[11px] text-slate-600 truncate flex-1">{{ col.name }}</span>
                <span
                  class="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0"
                  :class="typeColors[col.type] ?? 'bg-slate-100 text-slate-400'"
                >{{ col.type }}</span>
              </div>
              <p v-if="(getSchema(dataset.id)?.columns.length ?? 0) > 8" class="text-[10px] text-slate-400 mt-1">
                +{{ getSchema(dataset.id)!.columns.length - 8 }} colonnes supplémentaires
              </p>
            </div>

            <!-- Preview rows -->
            <div v-if="datasets.getPreview(dataset.id)" class="mt-3">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Aperçu
                <span class="font-normal normal-case">({{ datasets.getPreview(dataset.id)!.rows.length }} lignes)</span>
              </p>
              <div class="overflow-x-auto overflow-y-auto max-h-40 rounded-lg border border-slate-200 bg-white">
                <table class="w-full text-[11px] border-collapse">
                  <thead>
                    <tr>
                      <th
                        v-for="col in datasets.getPreview(dataset.id)!.columns"
                        :key="col"
                        class="px-2 py-1.5 text-left font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap"
                      >{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, ri) in datasets.getPreview(dataset.id)!.rows"
                      :key="ri"
                      class="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td
                        v-for="(cell, ci) in row"
                        :key="ci"
                        class="px-2 py-1.5 text-slate-700 font-mono truncate max-w-[120px]"
                        :title="cell != null ? String(cell) : ''"
                      >{{ cell != null ? cell : '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-if="datasets.getPreview(dataset.id)!.total > datasets.getPreview(dataset.id)!.rows.length" class="text-[10px] text-slate-400 mt-1">
                +{{ datasets.getPreview(dataset.id)!.total - datasets.getPreview(dataset.id)!.rows.length }} lignes supplémentaires
              </p>
            </div>
            <div v-else-if="datasets.isLoadingPreview(dataset.id)" class="text-xs text-slate-400 py-2 text-center">
              Chargement de l'aperçu…
            </div>
            <div v-else-if="datasets.getPreviewError(dataset.id)" class="mt-3">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Aperçu</p>
              <p class="text-[11px] text-slate-400 italic">Aperçu indisponible — {{ datasets.getPreviewError(dataset.id) }}</p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Add source button (sticky bottom) -->
    <div class="px-3 py-3 border-t border-slate-100 shrink-0 bg-white">
      <button
        class="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-primary)]/40 bg-purple-50/60 py-2.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-purple-50 hover:border-[var(--color-primary)]/70 transition-all"
        @click="showModal = true"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Ajouter une source
      </button>
    </div>
  </div>

  <!-- Modal -->
  <AddSourceModal v-if="showModal" @close="showModal = false" />
</template>
