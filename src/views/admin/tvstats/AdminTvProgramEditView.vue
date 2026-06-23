<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  adminGetProgram,
  adminUpdateProgram,
  adminListCategories,
  type AdminProgramDetail,
  type AdminCategory,
} from '@/api/admin'

const route = useRoute()
const router = useRouter()

const program = ref<AdminProgramDetail | null>(null)
const allCategories = ref<AdminCategory[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  title: '',
  type: '',
  description: '',
  image_url: '',
  youtube_url: '',
  is_tvstats_pick: false,
  category_ids: [] as number[],
})

const colorClass: Record<string, string> = {
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
function catClass(cat: AdminCategory) {
  return colorClass[cat.color ?? ''] ?? 'bg-slate-100 text-slate-700'
}

function toggleCategory(id: number) {
  const idx = form.category_ids.indexOf(id)
  if (idx === -1) form.category_ids.push(id)
  else form.category_ids.splice(idx, 1)
}

onMounted(async () => {
  const [p, cats] = await Promise.all([
    adminGetProgram(Number(route.params.id)),
    adminListCategories(),
  ])
  program.value = p
  allCategories.value = cats
  form.title = p.title
  form.type = p.type ?? ''
  form.description = p.description ?? ''
  form.image_url = p.image_url ?? ''
  form.youtube_url = p.youtube_url ?? ''
  form.is_tvstats_pick = p.is_tvstats_pick
  form.category_ids = p.categories.map((c) => c.id)
  loading.value = false
})

async function submit() {
  if (!program.value) return
  error.value = null
  saving.value = true
  try {
    await adminUpdateProgram(program.value.id, {
      title: form.title,
      type: form.type || null,
      description: form.description || null,
      image_url: form.image_url || null,
      youtube_url: form.youtube_url || null,
      is_tvstats_pick: form.is_tvstats_pick,
      category_ids: form.category_ids,
    })
    router.push(`/admin/tvstats/programs/${program.value.id}`)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Erreur lors de la mise à jour.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="py-20 text-center text-slate-400">Chargement…</div>
  <div v-else-if="program" class="mx-auto max-w-2xl">
    <!-- Breadcrumb -->
    <div class="mb-6 flex items-center gap-4">
      <RouterLink :to="`/admin/tvstats/programs/${program.id}`" class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ program.title }}
      </RouterLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-bold text-slate-900">Modifier</h1>
    </div>

    <form class="space-y-5" @submit.prevent="submit">

      <!-- Informations de base -->
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Informations</h2>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Titre</label>
            <input v-model="form.title" required class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Type / Genre (texte libre)</label>
            <input v-model="form.type" placeholder="ex: Série, Documentaire…" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Description</label>
            <textarea v-model="form.description" rows="5" class="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
        </div>
      </section>

      <!-- Catégories -->
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Catégories</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in allCategories"
            :key="cat.id"
            type="button"
            class="rounded-full px-3 py-1 text-xs font-semibold transition ring-2"
            :class="[
              catClass(cat),
              form.category_ids.includes(cat.id)
                ? 'ring-current opacity-100'
                : 'ring-transparent opacity-50 hover:opacity-80',
            ]"
            @click="toggleCategory(cat.id)"
          >
            {{ cat.name }}
          </button>
        </div>
        <p v-if="allCategories.length === 0" class="text-sm text-slate-400">Aucune catégorie disponible.</p>
      </section>

      <!-- Médias -->
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Médias</h2>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Image (URL)</label>
            <input
              v-model="form.image_url"
              type="url"
              placeholder="https://…"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <div v-if="form.image_url" class="mt-2">
              <img
                :src="form.image_url"
                class="h-28 w-auto rounded-xl border border-slate-200 object-cover"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Vidéo YouTube (URL ou ID)</label>
            <input
              v-model="form.youtube_url"
              placeholder="https://youtube.com/watch?v=… ou ID court"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>
      </section>

      <!-- Éditorial -->
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Éditorial</h2>
        <label class="flex cursor-pointer items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-900">Coup de cœur TvStats ❤️</p>
            <p class="text-xs text-slate-500">Met en avant ce programme dans la sélection éditoriale.</p>
          </div>
          <button
            type="button"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            :class="form.is_tvstats_pick ? 'bg-slate-900' : 'bg-slate-200'"
            @click="form.is_tvstats_pick = !form.is_tvstats_pick"
          >
            <span
              class="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="form.is_tvstats_pick ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </label>
      </section>

      <p v-if="error" class="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{{ error }}</p>

      <div class="flex justify-end gap-3">
        <RouterLink :to="`/admin/tvstats/programs/${program.id}`" class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Annuler
        </RouterLink>
        <button
          type="submit"
          class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          :disabled="saving"
        >
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>
