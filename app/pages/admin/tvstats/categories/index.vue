<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
import { ref, reactive, onMounted } from 'vue'
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  type AdminCategory,
} from '@/api/admin'

const categories = ref<AdminCategory[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const COLORS = [
  { value: 'slate',  label: 'Gris' },
  { value: 'blue',   label: 'Bleu' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'violet', label: 'Violet' },
  { value: 'purple', label: 'Violet foncé' },
  { value: 'pink',   label: 'Rose' },
  { value: 'red',    label: 'Rouge' },
  { value: 'orange', label: 'Orange' },
  { value: 'yellow', label: 'Jaune' },
  { value: 'lime',   label: 'Lime' },
  { value: 'green',  label: 'Vert' },
  { value: 'teal',   label: 'Teal' },
  { value: 'cyan',   label: 'Cyan' },
  { value: 'sky',    label: 'Bleu ciel' },
]

// Map Tailwind color name → actual CSS classes
function colorClass(color: string | null): string {
  const map: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    violet: 'bg-violet-100 text-violet-700',
    purple: 'bg-purple-100 text-purple-700',
    pink: 'bg-pink-100 text-pink-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    lime: 'bg-lime-100 text-lime-700',
    green: 'bg-green-100 text-green-700',
    teal: 'bg-teal-100 text-teal-700',
    cyan: 'bg-cyan-100 text-cyan-700',
    sky: 'bg-sky-100 text-sky-700',
  }
  return map[color ?? ''] ?? 'bg-slate-100 text-slate-700'
}

// ---- Create form ----
const showCreate = ref(false)
const createForm = reactive({ name: '', color: 'slate' })
const creating = ref(false)

async function create() {
  if (!createForm.name.trim()) return
  creating.value = true
  error.value = null
  try {
    const cat = await adminCreateCategory({ name: createForm.name.trim(), color: createForm.color })
    categories.value.push({ ...cat, programs_count: 0 })
    categories.value.sort((a, b) => a.name.localeCompare(b.name))
    createForm.name = ''
    createForm.color = 'slate'
    showCreate.value = false
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erreur lors de la création.'
  } finally {
    creating.value = false
  }
}

// ---- Inline edit ----
const editingId = ref<number | null>(null)
const editForm = reactive({ name: '', color: '' })
const saving = ref(false)

function startEdit(cat: AdminCategory) {
  editingId.value = cat.id
  editForm.name = cat.name
  editForm.color = cat.color ?? 'slate'
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(cat: AdminCategory) {
  saving.value = true
  error.value = null
  try {
    const updated = await adminUpdateCategory(cat.id, { name: editForm.name.trim(), color: editForm.color })
    const idx = categories.value.findIndex((c) => c.id === cat.id)
    if (idx !== -1) categories.value[idx] = { ...updated, programs_count: cat.programs_count }
    categories.value.sort((a, b) => a.name.localeCompare(b.name))
    editingId.value = null
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erreur lors de la mise à jour.'
  } finally {
    saving.value = false
  }
}

async function remove(cat: AdminCategory) {
  if (!confirm(`Supprimer la catégorie "${cat.name}" ?`)) return
  error.value = null
  try {
    await adminDeleteCategory(cat.id)
    categories.value = categories.value.filter((c) => c.id !== cat.id)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erreur lors de la suppression.'
  }
}

onMounted(async () => {
  try {
    categories.value = await adminListCategories()
  } catch {
    error.value = 'Impossible de charger les catégories.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Catégories TV</h1>
        <p class="text-sm text-slate-500">{{ categories.length }} catégorie{{ categories.length > 1 ? 's' : '' }}</p>
      </div>
      <button
        class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        @click="showCreate = !showCreate"
      >
        + Nouvelle catégorie
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showCreate" class="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 class="mb-4 text-sm font-semibold text-slate-900">Nouvelle catégorie</h2>
      <div class="flex flex-wrap gap-3">
        <input
          v-model="createForm.name"
          placeholder="Nom (ex: Téléfilm)"
          class="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 min-w-48"
          @keydown.enter="create"
        />
        <select v-model="createForm.color" class="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400">
          <option v-for="c in COLORS" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
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
            <th class="px-5 py-3 font-semibold text-slate-600">Catégorie</th>
            <th class="px-5 py-3 font-semibold text-slate-600">Couleur</th>
            <th class="px-5 py-3 font-semibold text-slate-600">Programmes</th>
            <th class="px-5 py-3 font-semibold text-slate-600 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id" class="border-b border-slate-50 last:border-0 hover:bg-slate-50">
            <td class="px-5 py-3">
              <template v-if="editingId === cat.id">
                <input
                  v-model="editForm.name"
                  class="rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-slate-400 w-48"
                  @keydown.enter="saveEdit(cat)"
                  @keydown.escape="cancelEdit"
                />
              </template>
              <template v-else>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="colorClass(cat.color)"
                >
                  {{ cat.name }}
                </span>
              </template>
            </td>
            <td class="px-5 py-3">
              <template v-if="editingId === cat.id">
                <select v-model="editForm.color" class="rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-slate-400">
                  <option v-for="c in COLORS" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
              </template>
              <template v-else>
                <span class="text-slate-500 capitalize">{{ cat.color ?? '—' }}</span>
              </template>
            </td>
            <td class="px-5 py-3 text-slate-500">{{ cat.programs_count ?? 0 }}</td>
            <td class="px-5 py-3 text-right">
              <template v-if="editingId === cat.id">
                <button
                  class="mr-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                  :disabled="saving"
                  @click="saveEdit(cat)"
                >
                  {{ saving ? '…' : 'Enregistrer' }}
                </button>
                <button class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50" @click="cancelEdit">
                  Annuler
                </button>
              </template>
              <template v-else>
                <button class="mr-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50" @click="startEdit(cat)">
                  Modifier
                </button>
                <button
                  class="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                  :disabled="(cat.programs_count ?? 0) > 0"
                  :title="(cat.programs_count ?? 0) > 0 ? 'Utilisée par des programmes' : ''"
                  @click="remove(cat)"
                >
                  Supprimer
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="categories.length === 0" class="py-10 text-center text-sm text-slate-400">Aucune catégorie.</p>
    </div>
  </div>
</template>
