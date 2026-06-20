<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { fetchStatsDataDocument, saveStatsDataDocument, deleteStatsDataDocument } from '@/api/studio'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id ?? '')

const loading = ref(true)
const error = ref<string | null>(null)
const isSaving = ref(false)
const isSaved = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)

const form = reactive({
  title: '',
  description: '',
  status: 'draft' as 'draft' | 'published',
})

onMounted(async () => {
  try {
    const doc = await fetchStatsDataDocument(id)
    form.title = doc.title
    form.description = doc.description ?? ''
    form.status = (doc.status as 'draft' | 'published') ?? 'draft'
  } catch {
    error.value = 'Document introuvable.'
  } finally {
    loading.value = false
  }
})

async function save() {
  isSaving.value = true
  try {
    await saveStatsDataDocument(id, {
      title: form.title,
      description: form.description || null,
      status: form.status,
    })
    isSaved.value = true
    setTimeout(() => { isSaved.value = false }, 2500)
  } finally {
    isSaving.value = false
  }
}

async function confirmDelete() {
  showDeleteConfirm.value = false
  isDeleting.value = true
  try {
    await deleteStatsDataDocument(id)
    router.push('/contenus')
  } finally {
    isDeleting.value = false
  }
}

const visibilityOptions = [
  { value: 'published', label: 'Public', description: 'Visible dans le catalogue public et par tous les visiteurs' },
  { value: 'draft', label: 'Brouillon', description: 'Visible uniquement par vous dans votre espace éditorial' },
]
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-10">
      <div class="container max-w-3xl flex flex-col gap-8">

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-32">
          <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="py-24 text-center text-slate-500">
          <p>{{ error }}</p>
        </div>

        <template v-else>
          <!-- Header -->
          <div class="flex items-center justify-between gap-4">
            <div class="flex flex-col gap-1">
              <p class="eyebrow text-primary">Propriétés</p>
              <h1 class="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                {{ form.title }}
              </h1>
            </div>
            <AppButton
              variant="primary"
              size="sm"
              :disabled="isSaving"
              @click="save"
            >
              {{ isSaving ? 'Enregistrement…' : isSaved ? 'Enregistré ✓' : 'Enregistrer' }}
            </AppButton>
          </div>

          <!-- General settings -->
          <div class="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div class="border-b border-slate-100 px-7 py-5">
              <h2 class="text-sm font-bold text-slate-900">Informations générales</h2>
            </div>
            <div class="px-7 py-6 flex flex-col gap-5">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Titre</label>
                <input
                  v-model="form.title"
                  type="text"
                  class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Titre du StatsData"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  placeholder="Description courte affichée dans les listings"
                />
              </div>
            </div>
          </div>

          <!-- Visibility -->
          <div class="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div class="border-b border-slate-100 px-7 py-5">
              <h2 class="text-sm font-bold text-slate-900">Visibilité</h2>
            </div>
            <div class="px-7 py-4 flex flex-col divide-y divide-slate-100">
              <label
                v-for="opt in visibilityOptions"
                :key="opt.value"
                class="flex items-center gap-4 py-4 cursor-pointer"
              >
                <input
                  type="radio"
                  name="visibility"
                  :value="opt.value"
                  v-model="form.status"
                  class="accent-primary w-4 h-4 shrink-0"
                />
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-slate-800">{{ opt.label }}</span>
                  <span class="text-xs text-slate-500 mt-0.5">{{ opt.description }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Studio link -->
          <div class="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm flex items-center gap-5">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800">Éditer dans le Studio</p>
              <p class="text-xs text-slate-500 mt-0.5">Construisez les pages de visualisation avec l'interface drag & drop.</p>
            </div>
            <AppButton as="router-link" :to="`/studio/${id}`" variant="secondary" size="sm">
              Ouvrir le Studio
            </AppButton>
          </div>

          <!-- Danger zone -->
          <div class="rounded-[2rem] border border-red-100 bg-white shadow-sm overflow-hidden">
            <div class="border-b border-red-100 px-7 py-5 bg-red-50/50">
              <h2 class="text-sm font-bold text-red-600">Zone de danger</h2>
            </div>
            <div class="px-7 py-6 flex items-start gap-5">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800">Supprimer ce StatsData</p>
                <p class="text-xs text-slate-500 mt-0.5">Cette action supprime définitivement le dataset, toutes ses pages et les fichiers associés. Irréversible.</p>
              </div>
              <button
                class="shrink-0 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                :disabled="isDeleting"
                @click="showDeleteConfirm = true"
              >
                {{ isDeleting ? 'Suppression…' : 'Supprimer' }}
              </button>
            </div>
          </div>
        </template>

        <!-- Delete confirm modal -->
        <Teleport to="body">
          <div
            v-if="showDeleteConfirm"
            class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm"
            @click.self="showDeleteConfirm = false"
          >
            <div class="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl mx-4">
              <h3 class="text-lg font-bold text-slate-950">Confirmer la suppression</h3>
              <p class="mt-2 text-sm text-slate-600">
                Êtes-vous sûr de vouloir supprimer <strong>{{ form.title }}</strong> ?
                Cette action est irréversible.
              </p>
              <div class="mt-6 flex gap-3 justify-end">
                <button
                  class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  @click="showDeleteConfirm = false"
                >
                  Annuler
                </button>
                <button
                  class="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
                  @click="confirmDelete"
                >
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>
    </section>
  </main>
</template>
