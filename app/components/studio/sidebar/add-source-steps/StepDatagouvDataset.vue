<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getErrorMessage } from '@/lib/http-errors'
import { parseDatagouvResourceId } from '@/composables/useAddSourceWizard'
import {
  searchDataGouvDatasets,
  fetchDataGouvDataset,
  type DataGouvDatasetSummary,
  type DataGouvDatasetDetail,
  type DataGouvResource,
} from '@/api/datagouv'

const props = defineProps<{
  datagouvInput: string
  datagouvName: string
}>()

const emit = defineEmits<{
  'update:datagouvInput': [string]
  'update:datagouvName': [string]
}>()

const datagouvResourceId = computed(() => parseDatagouvResourceId(props.datagouvInput))

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const dgQuery = ref('')
const dgResults = ref<DataGouvDatasetSummary[]>([])
const dgLoading = ref(false)
const dgError = ref('')
const dgOpenDataset = ref<DataGouvDatasetDetail | null>(null)
const dgLoadingDetail = ref(false)
const manualOpen = ref(false)

/** La saisie est-elle une référence directe (URL data.gouv ou identifiant) plutôt qu'un mot-clé ? */
function looksLikeRef(value: string): boolean {
  const v = value.trim()
  return /^https?:\/\//i.test(v) || UUID_RE.test(v) || /\/datasets\//i.test(v)
}

async function runDatagouvSearch() {
  const q = dgQuery.value.trim()
  dgError.value = ''
  dgOpenDataset.value = null
  if (q.length < 2) {
    dgResults.value = []
    return
  }

  if (looksLikeRef(q)) {
    dgResults.value = []
    await openDataset(q)
    return
  }

  dgLoading.value = true
  try {
    const result = await searchDataGouvDatasets(q)
    dgResults.value = result.datasets
  } catch (e) {
    dgError.value = getErrorMessage(e, 'La recherche data.gouv.fr a échoué.')
    dgResults.value = []
  } finally {
    dgLoading.value = false
  }
}

let dgSearchTimeout: ReturnType<typeof setTimeout> | undefined
watch(dgQuery, () => {
  clearTimeout(dgSearchTimeout)
  dgSearchTimeout = setTimeout(runDatagouvSearch, 350)
})

async function openDataset(ref: string) {
  dgLoadingDetail.value = true
  dgError.value = ''
  try {
    const detail = await fetchDataGouvDataset(ref)
    dgOpenDataset.value = detail
    // Référence pointant déjà vers une ressource précise → import direct si requêtable.
    if (detail.preselect_resource_id) {
      const target = detail.resources.find((r) => r.id === detail.preselect_resource_id)
      if (target?.tabular_available) importResource(detail, target)
    }
  } catch (e) {
    dgError.value = getErrorMessage(e, 'Ce jeu de données data.gouv.fr est introuvable.')
    dgOpenDataset.value = null
  } finally {
    dgLoadingDetail.value = false
  }
}

function importResource(dataset: DataGouvDatasetDetail | null, resource: DataGouvResource) {
  emit('update:datagouvInput', resource.id)
  if (dataset && !props.datagouvName.trim()) emit('update:datagouvName', dataset.title)
}

function clearDatagouvSelection() {
  emit('update:datagouvInput', '')
}

const selectedResourceLabel = computed(() => {
  const id = datagouvResourceId.value
  if (id.length < 16) return ''
  const match = dgOpenDataset.value?.resources.find((r) => r.id === id)
  return match ? `${match.title} · ${match.format || 'ressource'}` : id
})

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return ''
  const units = ['o', 'Ko', 'Mo', 'Go']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`
}
</script>

<template>
  <div class="flex flex-col gap-3 py-2">
    <!-- Ressource sélectionnée -->
    <div
      v-if="datagouvResourceId.length >= 16"
      class="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50/50 px-3.5 py-2.5"
    >
      <span class="text-emerald-600">✓</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-[var(--studio-ink)] truncate">
          {{ selectedResourceLabel || datagouvResourceId }}
        </p>
        <p class="text-[11px] text-[var(--studio-faint)] font-mono truncate">{{ datagouvResourceId }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 text-xs font-semibold text-[var(--studio-faint)] hover:text-red-500 transition-colors"
        @click="clearDatagouvSelection"
      >
        Changer
      </button>
    </div>

    <template v-else>
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--studio-faint)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          v-model="dgQuery"
          type="search"
          placeholder="Rechercher un jeu de données sur data.gouv.fr…"
          class="w-full rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-note)] pl-9 pr-3 py-2 text-sm text-[var(--studio-ink)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all"
        />
      </div>
      <p class="text-[11px] text-[var(--studio-faint)] -mt-1">
        Vous pouvez aussi coller l'URL d'une page data.gouv.fr ou un identifiant de ressource.
      </p>

      <p v-if="dgError" class="text-xs text-red-500">{{ dgError }}</p>

      <div v-if="dgLoading || dgLoadingDetail" class="py-6 text-center text-sm text-[var(--studio-faint)]">Recherche…</div>

      <!-- Détail d'un jeu de données ouvert -->
      <div v-else-if="dgOpenDataset" class="flex flex-col gap-2">
        <button
          type="button"
          class="self-start text-xs font-semibold text-[var(--studio-faint)] hover:text-orange-500 transition-colors"
          @click="dgOpenDataset = null"
        >
          ← Retour aux résultats
        </button>
        <div class="rounded-xl border border-[var(--studio-line-strong)] p-3.5">
          <p class="text-sm font-bold text-[var(--studio-ink)]">{{ dgOpenDataset.title }}</p>
          <p v-if="dgOpenDataset.organization.name" class="text-[11px] text-[var(--studio-faint)] mt-0.5">
            {{ dgOpenDataset.organization.name }}
          </p>
          <a
            :href="dgOpenDataset.page_url"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-block text-[11px] font-semibold text-orange-500 hover:underline"
          >
            Voir sur data.gouv.fr ↗
          </a>

          <p class="mt-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)]">
            Ressources
          </p>
          <div class="flex flex-col gap-1.5">
            <div
              v-for="resource in dgOpenDataset.resources"
              :key="resource.id"
              class="flex items-center gap-3 rounded-lg border px-3 py-2"
              :class="resource.tabular_available ? 'border-[var(--studio-line-strong)]' : 'border-[var(--studio-line)] opacity-60'"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm text-[var(--studio-ink)] truncate">{{ resource.title }}</p>
                <p class="text-[10px] text-[var(--studio-faint)] uppercase">
                  {{ resource.format || '—' }}<template v-if="formatBytes(resource.filesize)"> · {{ formatBytes(resource.filesize) }}</template>
                </p>
              </div>
              <button
                v-if="resource.tabular_available"
                type="button"
                class="shrink-0 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 transition-colors"
                @click="importResource(dgOpenDataset, resource)"
              >
                Importer
              </button>
              <span v-else class="shrink-0 text-[10px] text-[var(--studio-faint)]">non requêtable</span>
            </div>
            <p v-if="!dgOpenDataset.resources.length" class="text-xs text-[var(--studio-faint)]">
              Aucune ressource dans ce jeu de données.
            </p>
          </div>
        </div>
      </div>

      <!-- Résultats de recherche -->
      <div v-else-if="dgResults.length" class="flex flex-col gap-2 max-h-72 overflow-y-auto">
        <button
          v-for="dataset in dgResults"
          :key="dataset.id ?? dataset.slug"
          type="button"
          class="flex items-center gap-3 rounded-xl border border-[var(--studio-line-strong)] px-3 py-2.5 text-left hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
          @click="openDataset(dataset.slug || dataset.id || '')"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-[var(--studio-ink)] truncate">{{ dataset.title }}</p>
            <div class="flex items-center gap-1.5 mt-0.5 text-[10px] text-[var(--studio-faint)]">
              <span v-if="dataset.organization.name" class="truncate">{{ dataset.organization.name }}</span>
              <span>· {{ dataset.resources_count }} ressource(s)</span>
            </div>
          </div>
          <span class="shrink-0 text-[var(--studio-faint)]">›</span>
        </button>
      </div>

      <div v-else-if="dgQuery.trim().length >= 2" class="py-6 text-center text-sm text-[var(--studio-faint)]">
        Aucun jeu de données trouvé.
      </div>

      <!-- Saisie manuelle (repli) -->
      <div class="border-t border-[var(--studio-line)] pt-3">
        <button
          type="button"
          class="text-xs font-semibold text-[var(--studio-faint)] hover:text-orange-500 transition-colors"
          @click="manualOpen = !manualOpen"
        >
          {{ manualOpen ? '−' : '+' }} Saisie manuelle d'un identifiant de ressource
        </button>
        <div v-if="manualOpen" class="mt-2">
          <input
            :value="datagouvInput"
            type="text"
            class="w-full rounded-xl border border-[var(--studio-line-strong)] px-4 py-2.5 text-sm text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all"
            placeholder="336c34b5-a527-4c35-b84d-18462daa7c51"
            @input="emit('update:datagouvInput', ($event.target as HTMLInputElement).value)"
          />
          <p class="text-[11px] text-[var(--studio-faint)] mt-1">
            Vous pouvez aussi coller l'URL complète de l'API tabulaire
            (<span class="font-mono">https://tabular-api.data.gouv.fr/api/resources/&lt;id&gt;/data/</span>).
          </p>
        </div>
      </div>
    </template>

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
</template>
