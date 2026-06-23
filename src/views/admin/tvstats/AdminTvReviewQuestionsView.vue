<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  adminListReviewQuestions,
  adminCreateReviewQuestion,
  adminUpdateReviewQuestion,
  adminDeleteReviewQuestion,
  type AdminReviewQuestion,
} from '@/api/admin'

const questions = ref<AdminReviewQuestion[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Create form
const showCreate = ref(false)
const createForm = reactive({ label: '', description: '', category_slugs: '' })
const creating = ref(false)

// Edit form
const editingId = ref<number | null>(null)
const editForm = reactive({ label: '', description: '', category_slugs: '', is_active: true, sort_order: 0 })
const saving = ref(false)

function parseSlugs(raw: string): string[] | null {
  const cleaned = raw.split(',').map((s) => s.trim()).filter(Boolean)
  return cleaned.length > 0 ? cleaned : null
}

function joinSlugs(slugs: string[] | null): string {
  return slugs ? slugs.join(', ') : ''
}

async function create() {
  if (!createForm.label.trim()) return
  creating.value = true
  error.value = null
  try {
    const q = await adminCreateReviewQuestion({
      label: createForm.label.trim(),
      description: createForm.description.trim() || null,
      category_slugs: parseSlugs(createForm.category_slugs),
    })
    questions.value.push(q)
    createForm.label = ''
    createForm.description = ''
    createForm.category_slugs = ''
    showCreate.value = false
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erreur lors de la création.'
  } finally {
    creating.value = false
  }
}

function startEdit(q: AdminReviewQuestion) {
  editingId.value = q.id
  editForm.label = q.label
  editForm.description = q.description ?? ''
  editForm.category_slugs = joinSlugs(q.category_slugs)
  editForm.is_active = q.is_active
  editForm.sort_order = q.sort_order
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(q: AdminReviewQuestion) {
  saving.value = true
  error.value = null
  try {
    const updated = await adminUpdateReviewQuestion(q.id, {
      label: editForm.label.trim(),
      description: editForm.description.trim() || null,
      category_slugs: parseSlugs(editForm.category_slugs),
      is_active: editForm.is_active,
      sort_order: editForm.sort_order,
    })
    const idx = questions.value.findIndex((x) => x.id === q.id)
    if (idx !== -1) questions.value[idx] = updated
    editingId.value = null
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erreur lors de la mise à jour.'
  } finally {
    saving.value = false
  }
}

async function remove(q: AdminReviewQuestion) {
  if (!confirm(`Supprimer la question "${q.label}" ?`)) return
  error.value = null
  try {
    await adminDeleteReviewQuestion(q.id)
    questions.value = questions.value.filter((x) => x.id !== q.id)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erreur lors de la suppression.'
  }
}

async function toggleActive(q: AdminReviewQuestion) {
  try {
    const updated = await adminUpdateReviewQuestion(q.id, { is_active: !q.is_active })
    const idx = questions.value.findIndex((x) => x.id === q.id)
    if (idx !== -1) questions.value[idx] = updated
  } catch {
    // silent
  }
}

onMounted(async () => {
  try {
    questions.value = await adminListReviewQuestions()
  } catch {
    error.value = 'Impossible de charger les questions.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Questions de notation</h1>
        <p class="text-sm text-slate-500">{{ questions.length }} question{{ questions.length > 1 ? 's' : '' }} · Posées aux téléspectateurs après visionnage</p>
      </div>
      <button
        class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        @click="showCreate = !showCreate"
      >
        + Nouvelle question
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showCreate" class="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 class="mb-4 text-sm font-semibold text-slate-900">Nouvelle question</h2>
      <div class="space-y-3">
        <input
          v-model="createForm.label"
          placeholder="Question (ex: Avez-vous apprécié ce programme ?)"
          class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          @keydown.enter="create"
        />
        <input
          v-model="createForm.description"
          placeholder="Description facultative"
          class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
        <div>
          <input
            v-model="createForm.category_slugs"
            placeholder="Catégories (slugs séparés par virgule, vide = toutes)"
            class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <p class="mt-1 text-xs text-slate-400">Laisser vide pour afficher à toutes les catégories. Ex: fiction, sport, documentaire</p>
        </div>
        <div class="flex gap-3">
          <button
            class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            :disabled="creating || !createForm.label.trim()"
            @click="create"
          >
            {{ creating ? 'Création…' : 'Créer' }}
          </button>
          <button class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" @click="showCreate = false">
            Annuler
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{{ error }}</p>

    <div v-if="loading" class="py-20 text-center text-slate-400">Chargement…</div>

    <div v-else class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div v-if="questions.length === 0" class="py-12 text-center text-sm text-slate-400">Aucune question.</div>

      <div v-for="(q, idx) in questions" :key="q.id" class="border-b border-slate-50 last:border-0">
        <!-- View row -->
        <template v-if="editingId !== q.id">
          <div class="flex items-start gap-4 px-5 py-4">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
              {{ idx + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900" :class="{ 'opacity-50 line-through': !q.is_active }">{{ q.label }}</p>
              <p v-if="q.description" class="mt-0.5 text-xs text-slate-500">{{ q.description }}</p>
              <div class="mt-1.5 flex flex-wrap gap-1.5 items-center">
                <span
                  v-if="q.category_slugs === null"
                  class="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600"
                >
                  Toutes catégories
                </span>
                <span
                  v-else
                  v-for="slug in q.category_slugs"
                  :key="slug"
                  class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 capitalize"
                >
                  {{ slug }}
                </span>
                <span class="text-[10px] text-slate-400">· Ordre {{ q.sort_order }}</span>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <!-- Active toggle -->
              <button
                class="relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
                :class="q.is_active ? 'bg-tvstats-primary' : 'bg-slate-200'"
                :title="q.is_active ? 'Désactiver' : 'Activer'"
                @click="toggleActive(q)"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200"
                  :class="q.is_active ? 'translate-x-4' : 'translate-x-0'"
                />
              </button>
              <button class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50" @click="startEdit(q)">
                Modifier
              </button>
              <button class="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50" @click="remove(q)">
                Sup.
              </button>
            </div>
          </div>
        </template>

        <!-- Edit row -->
        <template v-else>
          <div class="bg-slate-50 px-5 py-4 space-y-3">
            <input v-model="editForm.label" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" placeholder="Question" />
            <input v-model="editForm.description" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" placeholder="Description (facultatif)" />
            <input v-model="editForm.category_slugs" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" placeholder="Catégories (vide = toutes)" />
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 text-sm text-slate-600">
                <input v-model="editForm.is_active" type="checkbox" class="rounded" />
                Actif
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-600">
                Ordre
                <input v-model.number="editForm.sort_order" type="number" min="0" class="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none" />
              </label>
            </div>
            <div class="flex gap-2">
              <button
                class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                :disabled="saving"
                @click="saveEdit(q)"
              >
                {{ saving ? '…' : 'Enregistrer' }}
              </button>
              <button class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" @click="cancelEdit">
                Annuler
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
