<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, reactive, onMounted } from 'vue'
import { getErrorMessage } from '@/lib/http-errors'
import {
  adminListSourceProvenances,
  adminCreateSourceProvenance,
  adminUpdateSourceProvenance,
  adminDeleteSourceProvenance,
  type AdminSourceProvenance,
} from '@/api/admin'

const provenances = ref<AdminSourceProvenance[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// ---- Create form ----
const showCreate = ref(false)
const createForm = reactive({ name: '' })
const creating = ref(false)

async function create() {
  if (!createForm.name.trim()) return
  creating.value = true
  error.value = null
  try {
    const provenance = await adminCreateSourceProvenance({ name: createForm.name.trim() })
    provenances.value.push({ ...provenance, data_sources_count: 0 })
    createForm.name = ''
    showCreate.value = false
  } catch (e) {
    error.value = getErrorMessage(e, 'Erreur lors de la création.')
  } finally {
    creating.value = false
  }
}

// ---- Inline edit ----
const editingId = ref<number | null>(null)
const editForm = reactive({ name: '' })
const saving = ref(false)

function startEdit(provenance: AdminSourceProvenance) {
  editingId.value = provenance.id
  editForm.name = provenance.name
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(provenance: AdminSourceProvenance) {
  saving.value = true
  error.value = null
  try {
    const updated = await adminUpdateSourceProvenance(provenance.id, { name: editForm.name.trim() })
    const idx = provenances.value.findIndex((p: AdminSourceProvenance) => p.id === provenance.id)
    if (idx !== -1) provenances.value[idx] = { ...updated, data_sources_count: provenance.data_sources_count }
    editingId.value = null
  } catch (e) {
    error.value = getErrorMessage(e, 'Erreur lors de la mise à jour.')
  } finally {
    saving.value = false
  }
}

async function remove(provenance: AdminSourceProvenance) {
  if (!confirm(`Supprimer la provenance "${provenance.name}" ?`)) return
  error.value = null
  try {
    await adminDeleteSourceProvenance(provenance.id)
    provenances.value = provenances.value.filter((p: AdminSourceProvenance) => p.id !== provenance.id)
  } catch (e) {
    error.value = getErrorMessage(e, 'Erreur lors de la suppression.')
  }
}

onMounted(async () => {
  try {
    provenances.value = await adminListSourceProvenances()
  } catch {
    error.value = 'Impossible de charger les provenances.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Provenances des sources</h1>
        <p class="text-sm text-slate-500">{{ provenances.length }} provenance{{ provenances.length > 1 ? 's' : '' }}</p>
      </div>
      <button
        class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        @click="showCreate = !showCreate"
      >
        + Nouvelle provenance
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showCreate" class="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 class="mb-4 text-sm font-semibold text-slate-900">Nouvelle provenance</h2>
      <div class="flex flex-wrap gap-3">
        <input
          v-model="createForm.name"
          placeholder="Nom (ex: Eurostat)"
          class="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 min-w-48"
          @keydown.enter="create"
        />
        <button
          class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          :disabled="creating || !createForm.name.trim()"
          @click="create"
        >
          {{ creating ? 'Création…' : 'Créer' }}
        </button>
        <button class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" @click="showCreate = false">
          Annuler
        </button>
      </div>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{{ error }}</p>

    <div v-if="loading" class="py-20 text-center text-slate-400">Chargement…</div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-100">
          <tr class="text-left">
            <th class="px-5 py-3 font-semibold text-slate-600">Provenance</th>
            <th class="px-5 py-3 font-semibold text-slate-600">Sources</th>
            <th class="px-5 py-3 font-semibold text-slate-600 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="provenance in provenances" :key="provenance.id" class="border-b border-slate-50 last:border-0 hover:bg-slate-50">
            <td class="px-5 py-3">
              <template v-if="editingId === provenance.id">
                <input
                  v-model="editForm.name"
                  class="rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-slate-400 w-48"
                  @keydown.enter="saveEdit(provenance)"
                  @keydown.escape="cancelEdit"
                />
              </template>
              <template v-else>
                <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {{ provenance.name }}
                </span>
              </template>
            </td>
            <td class="px-5 py-3 text-slate-500">{{ provenance.data_sources_count ?? 0 }}</td>
            <td class="px-5 py-3 text-right">
              <template v-if="editingId === provenance.id">
                <button
                  class="mr-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                  :disabled="saving"
                  @click="saveEdit(provenance)"
                >
                  {{ saving ? '…' : 'Enregistrer' }}
                </button>
                <button class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50" @click="cancelEdit">
                  Annuler
                </button>
              </template>
              <template v-else>
                <button class="mr-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50" @click="startEdit(provenance)">
                  Modifier
                </button>
                <button
                  class="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                  :disabled="(provenance.data_sources_count ?? 0) > 0"
                  :title="(provenance.data_sources_count ?? 0) > 0 ? 'Utilisée par des sources' : ''"
                  @click="remove(provenance)"
                >
                  Supprimer
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="provenances.length === 0" class="py-10 text-center text-sm text-slate-400">Aucune provenance.</p>
    </div>
  </div>
</template>
