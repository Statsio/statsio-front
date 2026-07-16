<script setup lang="ts">
import { ref, watch } from 'vue'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { fetchContentCategories } from '@/api/content-categories'
import { getErrorMessage } from '@/lib/http-errors'
import type { ContentCategory } from '@/types/content-creation'
import type { SourceType } from '@/composables/useAddSourceWizard'

const props = defineProps<{
  modelValue: SourceType | null
}>()

const emit = defineEmits<{
  'update:modelValue': [SourceType | null]
  attached: []
}>()

function selectType(type: SourceType) {
  emit('update:modelValue', type)
}

// ─── Public catalog browsing ────────────────────────────────────────────────

interface PublicSource {
  id: number
  name: string
  type: string
  categories: string[]
  provenance: { id: number; slug: string; name: string } | null
  created_at: string
}

const query = ref('')
const selectedCategory = ref<string | null>(null)
const categories = ref<ContentCategory[]>([])
const results = ref<PublicSource[]>([])
const loadingResults = ref(false)
const attachingId = ref<number | null>(null)
const error = ref('')

async function loadCategories() {
  try {
    categories.value = await fetchContentCategories()
  } catch {
    categories.value = []
  }
}

async function search() {
  loadingResults.value = true
  error.value = ''
  try {
    const { data } = await apiHttp.get<{ success: boolean; data: PublicSource[] }>(
      STATSIO_API.dataSources.public,
      { params: { q: query.value || undefined, category: selectedCategory.value || undefined } },
    )
    results.value = data.data ?? []
  } catch (e) {
    error.value = getErrorMessage(e, 'Impossible de charger les sources publiques.')
  } finally {
    loadingResults.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | undefined
watch(query, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(search, 300)
})

function toggleCategory(slug: string) {
  selectedCategory.value = selectedCategory.value === slug ? null : slug
  search()
}

async function attach(source: PublicSource) {
  attachingId.value = source.id
  error.value = ''
  try {
    await apiHttp.post(STATSIO_API.dataSources.attach(source.id))
    emit('attached')
  } catch (e) {
    error.value = getErrorMessage(e, "Impossible d'ajouter cette source.")
  } finally {
    attachingId.value = null
  }
}

watch(
  () => props.modelValue,
  (type) => {
    if (type === 'catalog' && results.value.length === 0 && !loadingResults.value) {
      loadCategories()
      search()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-5 py-2">
    <div class="grid grid-cols-3 gap-3">
      <!-- File -->
      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all"
        :class="modelValue === 'file' ? 'border-[var(--color-primary)] bg-purple-50/40' : 'border-slate-200 bg-white hover:border-[var(--color-primary)] hover:bg-purple-50/40'"
        @click="selectType('file')"
      >
        <div class="w-12 h-12 rounded-2xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
          <svg class="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800">Fichier</p>
          <p class="text-xs text-slate-400 mt-1 leading-relaxed">CSV, Excel, JSON, Parquet</p>
        </div>
      </button>

      <!-- API -->
      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all"
        :class="modelValue === 'api' ? 'border-blue-400 bg-blue-50/40' : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40'"
        @click="selectType('api')"
      >
        <div class="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
          <svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800">API REST</p>
          <p class="text-xs text-slate-400 mt-1 leading-relaxed">URL externe, auth optionnelle</p>
        </div>
      </button>

      <!-- Public catalog -->
      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all"
        :class="modelValue === 'catalog' ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40'"
        @click="selectType('catalog')"
      >
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
          <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800">Sources publiques</p>
          <p class="text-xs text-slate-400 mt-1 leading-relaxed">Réutiliser une source existante</p>
        </div>
      </button>
    </div>

    <!-- Public catalog browsing -->
    <div v-if="modelValue === 'catalog'" class="flex flex-col gap-3 border-t border-slate-100 pt-4">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          v-model="query"
          type="search"
          placeholder="Rechercher une source publique…"
          class="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all"
        />
      </div>

      <div v-if="categories.length" class="flex flex-wrap gap-1.5">
        <button
          v-for="cat in categories"
          :key="cat.slug"
          type="button"
          class="rounded-full border px-2.5 py-1 text-xs font-semibold transition"
          :class="selectedCategory === cat.slug
            ? 'border-emerald-400 bg-emerald-500 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'"
          @click="toggleCategory(cat.slug)"
        >
          {{ cat.name }}
        </button>
      </div>

      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

      <div v-if="loadingResults" class="py-8 text-center text-sm text-slate-400">Chargement…</div>

      <div v-else-if="!results.length" class="py-8 text-center text-sm text-slate-400">
        Aucune source publique trouvée.
      </div>

      <div v-else class="flex flex-col gap-2 max-h-64 overflow-y-auto">
        <div
          v-for="source in results"
          :key="source.id"
          class="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">{{ source.name }}</p>
            <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span v-if="source.provenance" class="text-[10px] text-slate-400">{{ source.provenance.name }}</span>
              <span
                v-for="slug in source.categories"
                :key="slug"
                class="text-[10px] rounded-full bg-slate-100 text-slate-500 px-1.5 py-0.5"
              >{{ categories.find((c) => c.slug === slug)?.name ?? slug }}</span>
            </div>
          </div>
          <button
            class="shrink-0 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 transition-colors disabled:opacity-50"
            :disabled="attachingId === source.id"
            @click="attach(source)"
          >
            {{ attachingId === source.id ? 'Ajout…' : 'Utiliser' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
