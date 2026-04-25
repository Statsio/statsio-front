<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/lib/http-errors'
import {
  fetchStatsDataDocument,
  updateStatsDataDocument,
  type StatsDataShareDto,
  fetchStatsDataDocumentShares,
  upsertStatsDataDocumentShare,
  deleteStatsDataDocumentShare,
  uploadStatsDataCoverImage,
} from '@/api/statsdata-documents'
import type { StatsDataDocumentDto } from '@/types/statsdata-document-api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const docId = computed(() => String(route.params.id ?? '').trim())

const isLoading = ref(true)
const loadError = ref<string | null>(null)
const saving = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref<string | null>(null)

const doc = ref<StatsDataDocumentDto | null>(null)

const form = ref({
  title: '',
  visibility: 'private' as StatsDataDocumentDto['visibility'],
  categories: [] as string[],
  tags: [] as string[],
  description: '',
  cover_media_id: null as number | null,
  cover_url: null as string | null,
})

const shareEmail = ref('')
const shareRole = ref<'viewer' | 'editor'>('viewer')
const sharesLoading = ref(false)
const sharesError = ref<string | null>(null)
const shares = ref<StatsDataShareDto[]>([])

const isOwner = computed(() => {
  const uid = authStore.user?.id
  const createdById = doc.value?.created_by?.id
  if (uid == null || !createdById) return false
  return String(uid) === String(createdById)
})

const studioLink = computed(() => (docId.value ? `/studio/statsdata/${docId.value}` : '/studio/statsdata/nouveau'))

const visibilitySelectOptions = [
  { value: 'private', label: 'Privé' },
  { value: 'team', label: 'Équipe' },
  { value: 'public', label: 'Public' },
]

const shareRoleSelectOptions = [
  { value: 'viewer', label: 'Lecteur' },
  { value: 'editor', label: 'Éditeur' },
]

const load = async () => {
  if (!docId.value) {
    loadError.value = 'StatsData introuvable.'
    isLoading.value = false
    return
  }
  isLoading.value = true
  loadError.value = null
  try {
    const d = await fetchStatsDataDocument(docId.value)
    doc.value = d
    form.value.title = d.title ?? ''
    form.value.visibility = d.visibility
    form.value.categories = d.categories ?? []
    form.value.tags = d.tags ?? []
    form.value.description = d.description ?? ''
    form.value.cover_media_id = d.cover_media_id ?? null
    form.value.cover_url = d.cover_url ?? null
  } catch (e) {
    loadError.value = getErrorMessage(e, 'Erreur lors du chargement.')
  } finally {
    isLoading.value = false
  }
}

const loadShares = async () => {
  if (!docId.value) return
  sharesLoading.value = true
  sharesError.value = null
  try {
    shares.value = await fetchStatsDataDocumentShares(docId.value)
  } catch (e) {
    sharesError.value = getErrorMessage(e, 'Impossible de charger les partages.')
  } finally {
    sharesLoading.value = false
  }
}

onMounted(async () => {
  await load()
  await loadShares()
  if (doc.value && !isOwner.value) {
    await router.replace({ name: 'statsdata' })
  }
})

const onSave = async () => {
  if (!docId.value) return
  saveError.value = null
  saveSuccess.value = null
  saving.value = true
  try {
    const updated = await updateStatsDataDocument(docId.value, {
      title: form.value.title,
      visibility: form.value.visibility,
      description: form.value.description,
      categories: form.value.categories,
      tags: form.value.tags,
      cover_media_id: form.value.cover_media_id,
    })
    doc.value = updated
    form.value.cover_url = updated.cover_url ?? form.value.cover_url
    saveSuccess.value = 'Propriétés enregistrées.'
    window.setTimeout(() => (saveSuccess.value = null), 2500)
  } catch (e) {
    saveError.value = getErrorMessage(e, 'Enregistrement impossible.')
  } finally {
    saving.value = false
  }
}

const parseCsv = (raw: string) =>
  raw
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
    .slice(0, 50)

const categoriesDraft = computed({
  get: () => form.value.categories.join(', '),
  set: (v) => (form.value.categories = parseCsv(v)),
})
const tagsDraft = computed({
  get: () => form.value.tags.join(', '),
  set: (v) => (form.value.tags = parseCsv(v)),
})

const onUploadCover = async (file: File | null) => {
  if (!file || !docId.value) return
  saveError.value = null
  saveSuccess.value = null
  saving.value = true
  try {
    const uploaded = await uploadStatsDataCoverImage(docId.value, file)
    form.value.cover_media_id = uploaded.media_id
    form.value.cover_url = uploaded.url
    await onSave()
  } catch (e) {
    saveError.value = getErrorMessage(e, 'Upload image impossible.')
  } finally {
    saving.value = false
  }
}

const onAddShare = async () => {
  if (!docId.value) return
  const email = shareEmail.value.trim()
  if (!email) return
  sharesError.value = null
  try {
    await upsertStatsDataDocumentShare(docId.value, { email, role: shareRole.value })
    shareEmail.value = ''
    await loadShares()
  } catch (e) {
    sharesError.value = getErrorMessage(e, 'Partage impossible.')
  }
}

const onDeleteShare = async (userId: number) => {
  if (!docId.value) return
  sharesError.value = null
  try {
    await deleteStatsDataDocumentShare(docId.value, userId)
    await loadShares()
  } catch (e) {
    sharesError.value = getErrorMessage(e, 'Suppression du partage impossible.')
  }
}
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-8">
      <div class="container flex flex-col gap-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="max-w-3xl">
            <p class="eyebrow text-primary">Propriétés StatsData</p>
            <h1 class="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              {{ doc?.title || 'Paramètres' }}
            </h1>
            <p class="mt-3 text-lg leading-8 text-slate-600">
              Gérez les métadonnées, l’image, la visibilité et les partages sans toucher à la mise en page dans le studio.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <AppButton as="router-link" :to="studioLink" variant="secondary" size="md">Ouvrir le studio</AppButton>
            <AppButton as="router-link" to="/contenus" variant="outline" size="md">Mes contenus</AppButton>
          </div>
        </div>
      </div>
    </section>

    <section class="section pt-0">
      <div class="container">
        <div
          v-if="isLoading"
          class="rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
        >
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Chargement</p>
          <h2 class="mt-3 text-2xl font-semibold text-slate-950">On récupère les propriétés.</h2>
        </div>

        <div
          v-else-if="loadError"
          class="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-12 text-center shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
        >
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Erreur</p>
          <h2 class="mt-3 text-2xl font-semibold text-slate-950">Impossible de charger.</h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm leading-7 text-rose-900/80">{{ loadError }}</p>
        </div>

        <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <form
            class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_26px_80px_-54px_rgba(15,23,42,0.45)] sm:p-8"
            @submit.prevent="onSave"
          >
            <div class="flex flex-col gap-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Métadonnées</p>
                  <h2 class="mt-2 text-2xl font-semibold text-slate-950">Informations</h2>
                </div>
                <AppButton type="submit" variant="primary" size="md" :disabled="saving">
                  {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
                </AppButton>
              </div>

              <div v-if="saveError" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {{ saveError }}
              </div>
              <div v-if="saveSuccess" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {{ saveSuccess }}
              </div>

              <label class="flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Nom</span>
                <input
                  v-model="form.title"
                  type="text"
                  class="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary/30 focus:bg-white focus:outline-none"
                  placeholder="Titre public…"
                />
              </label>

              <label class="flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Visibilité</span>
                <AppSelect v-model="form.visibility" :options="visibilitySelectOptions" aria-label="Visibilité" />
              </label>

              <label class="flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Catégories (séparées par virgule)</span>
                <input
                  v-model="categoriesDraft"
                  type="text"
                  class="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary/30 focus:bg-white focus:outline-none"
                  placeholder="Économie, Santé, Territoires…"
                />
              </label>

              <label class="flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Tags (séparés par virgule)</span>
                <input
                  v-model="tagsDraft"
                  type="text"
                  class="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary/30 focus:bg-white focus:outline-none"
                  placeholder="inflation, communes, ipc…"
                />
              </label>

              <label class="flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Description</span>
                <textarea
                  v-model="form.description"
                  rows="6"
                  class="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 focus:border-primary/30 focus:bg-white focus:outline-none"
                  placeholder="Contexte, objectifs, sources, périmètre…"
                />
              </label>
            </div>
          </form>

          <aside class="flex flex-col gap-6">
            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_26px_80px_-54px_rgba(15,23,42,0.45)]">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Image</p>
              <h3 class="mt-2 text-xl font-semibold text-slate-950">Couverture</h3>
              <div class="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                <img v-if="form.cover_url" :src="form.cover_url" alt="" class="h-48 w-full object-cover" />
                <div v-else class="flex h-48 items-center justify-center text-sm text-slate-500">Aucune image</div>
              </div>
              <div class="mt-4">
                <label class="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Uploader</label>
                <input
                  class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  type="file"
                  accept="image/*"
                  :disabled="saving"
                  @change="onUploadCover(($event.target as HTMLInputElement).files?.[0] ?? null)"
                />
                <p class="mt-2 text-xs leading-5 text-slate-500">PNG/JPG/WebP. L’image est stockée via l’API media.</p>
              </div>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_26px_80px_-54px_rgba(15,23,42,0.45)]">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Partage</p>
              <h3 class="mt-2 text-xl font-semibold text-slate-950">Collaborateurs</h3>

              <div v-if="sharesError" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {{ sharesError }}
              </div>

              <div class="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end">
                <label class="flex flex-col gap-2">
                  <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Email</span>
                  <input
                    v-model="shareEmail"
                    type="email"
                    class="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary/30 focus:bg-white focus:outline-none"
                    placeholder="collab@exemple.com"
                  />
                </label>
                <label class="flex flex-col gap-2">
                  <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Rôle</span>
                  <AppSelect v-model="shareRole" :options="shareRoleSelectOptions" aria-label="Rôle" />
                </label>
                <AppButton variant="primary" size="md" type="button" :disabled="sharesLoading" @click="onAddShare">Ajouter</AppButton>
              </div>

              <div v-if="sharesLoading" class="mt-4 text-sm text-slate-500">Chargement…</div>
              <div v-else class="mt-4 flex flex-col gap-2">
                <div v-if="shares.length === 0" class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  Aucun partage.
                </div>
                <div
                  v-for="s in shares"
                  :key="s.user_id"
                  class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-900">{{ s.email }}</p>
                    <p class="text-xs text-slate-500">Rôle: {{ s.role === 'editor' ? 'Éditeur' : 'Lecteur' }}</p>
                  </div>
                  <AppButton variant="ghost" size="md" type="button" @click="onDeleteShare(s.user_id)">Retirer</AppButton>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </main>
</template>

