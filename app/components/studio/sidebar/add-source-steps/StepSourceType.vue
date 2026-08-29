<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { fetchContentCategories } from '@/api/content-categories'
import { getErrorMessage } from '@/lib/http-errors'
import type { ContentCategory } from '@/types/content-creation'
import type { SourceType } from '@/composables/useAddSourceWizard'
import { parseDatagouvResourceId } from '@/composables/useAddSourceWizard'

const props = defineProps<{
  modelValue: SourceType | null
  datagouvInput: string
  datagouvName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [SourceType | null]
  'update:datagouvInput': [string]
  'update:datagouvName': [string]
  attached: []
}>()

const datagouvResourceId = computed(() => parseDatagouvResourceId(props.datagouvInput))

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
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <!-- File -->
      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all"
        :class="modelValue === 'file' ? 'border-[var(--color-primary)] bg-purple-50/40' : 'border-[var(--studio-line-strong)] bg-white hover:border-[var(--color-primary)] hover:bg-purple-50/40'"
        @click="selectType('file')"
      >
        <div class="w-12 h-12 rounded-2xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
          <svg class="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold text-[var(--studio-ink)]">Fichier</p>
          <p class="text-xs text-[var(--studio-faint)] mt-1 leading-relaxed">CSV, Excel, JSON, Parquet</p>
        </div>
      </button>

      <!-- API -->
      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all"
        :class="modelValue === 'api' ? 'border-blue-400 bg-blue-50/40' : 'border-[var(--studio-line-strong)] bg-white hover:border-blue-400 hover:bg-blue-50/40'"
        @click="selectType('api')"
      >
        <div class="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
          <svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold text-[var(--studio-ink)]">API REST</p>
          <p class="text-xs text-[var(--studio-faint)] mt-1 leading-relaxed">URL externe, auth optionnelle</p>
        </div>
      </button>

      <!-- Public catalog -->
      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all"
        :class="modelValue === 'catalog' ? 'border-emerald-400 bg-emerald-50/40' : 'border-[var(--studio-line-strong)] bg-white hover:border-emerald-400 hover:bg-emerald-50/40'"
        @click="selectType('catalog')"
      >
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
          <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold text-[var(--studio-ink)]">Sources publiques</p>
          <p class="text-xs text-[var(--studio-faint)] mt-1 leading-relaxed">Réutiliser une source existante</p>
        </div>
      </button>

      <!-- data.gouv.fr -->
      <button
        class="group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all"
        :class="modelValue === 'datagouv' ? 'border-orange-400 bg-orange-50/40' : 'border-[var(--studio-line-strong)] bg-white hover:border-orange-400 hover:bg-orange-50/40'"
        @click="selectType('datagouv')"
      >
        <div class="w-12 h-12 rounded-2xl bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
          <svg class="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0a13.5 13.5 0 0 0 0-18m0 18a13.5 13.5 0 0 1 0-18M3 12h18" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold text-[var(--studio-ink)]">data.gouv.fr</p>
          <p class="text-xs text-[var(--studio-faint)] mt-1 leading-relaxed">Un identifiant de ressource suffit</p>
        </div>
      </button>
    </div>

    <!-- data.gouv.fr — saisie de l'identifiant de ressource -->
    <div v-if="modelValue === 'datagouv'" class="flex flex-col gap-3 border-t border-[var(--studio-line)] pt-4">
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">
          Identifiant de la ressource <span class="text-red-400">*</span>
        </label>
        <input
          :value="datagouvInput"
          type="text"
          class="w-full rounded-xl border border-[var(--studio-line-strong)] px-4 py-2.5 text-sm text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all"
          placeholder="336c34b5-a527-4c35-b84d-18462daa7c51"
          @input="emit('update:datagouvInput', ($event.target as HTMLInputElement).value)"
        />
        <p class="text-[11px] text-[var(--studio-faint)] mt-1">
          L'identifiant figure sur la fiche de la ressource sur data.gouv.fr — vous pouvez aussi coller
          l'URL complète de l'API tabulaire
          (<span class="font-mono">https://tabular-api.data.gouv.fr/api/resources/&lt;id&gt;/data/</span>).
          La pagination et l'enveloppe des données sont configurées automatiquement.
        </p>
        <p v-if="datagouvInput && datagouvResourceId.length >= 16" class="text-[11px] text-emerald-600 mt-1 font-mono break-all">
          → https://tabular-api.data.gouv.fr/api/resources/{{ datagouvResourceId }}/data/
        </p>
      </div>

      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">
          Nom de la source <span class="font-normal normal-case text-[var(--studio-faint)]">(optionnel)</span>
        </label>
        <input
          :value="datagouvName"
          type="text"
          class="w-full rounded-xl border border-[var(--studio-line-strong)] px-4 py-2.5 text-sm text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all"
          placeholder="ex : Prix des carburants"
          @input="emit('update:datagouvName', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Public catalog browsing -->
    <div v-if="modelValue === 'catalog'" class="flex flex-col gap-3 border-t border-[var(--studio-line)] pt-4">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--studio-faint)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          v-model="query"
          type="search"
          placeholder="Rechercher une source publique…"
          class="w-full rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-note)] pl-9 pr-3 py-2 text-sm text-[var(--studio-ink)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all"
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
            : 'border-[var(--studio-line-strong)] bg-white text-[var(--studio-muted)] hover:border-emerald-300'"
          @click="toggleCategory(cat.slug)"
        >
          {{ cat.name }}
        </button>
      </div>

      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

      <div v-if="loadingResults" class="py-8 text-center text-sm text-[var(--studio-faint)]">Chargement…</div>

      <div v-else-if="!results.length" class="py-8 text-center text-sm text-[var(--studio-faint)]">
        Aucune source publique trouvée.
      </div>

      <div v-else class="flex flex-col gap-2 max-h-64 overflow-y-auto">
        <div
          v-for="source in results"
          :key="source.id"
          class="flex items-center gap-3 rounded-xl border border-[var(--studio-line-strong)] px-3 py-2.5 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-[var(--studio-ink)] truncate">{{ source.name }}</p>
            <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span v-if="source.provenance" class="text-[10px] text-[var(--studio-faint)]">{{ source.provenance.name }}</span>
              <span
                v-for="slug in source.categories"
                :key="slug"
                class="text-[10px] rounded-full bg-slate-100 text-[var(--studio-muted)] px-1.5 py-0.5"
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
