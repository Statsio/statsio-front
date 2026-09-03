<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { SourceType, AuthType, HttpMethod, ApiFormPagination, ApiFormShape } from '@/composables/useAddSourceWizard'
import { apiFormAuthHeaders, useApiStructureDetection } from '@/composables/useAddSourceWizard'
import type { Materialization, SpreadsheetPreview, QueryMapping } from '@/api/data-sources'
import { previewSpreadsheet } from '@/api/data-sources'
import { REFRESH_FREQUENCY_OPTIONS } from '@/lib/refresh-frequency'
import ApiDetectionResults from './ApiDetectionResults.vue'

const PAGINATION_STYLE_OPTIONS: { v: ApiFormPagination['style']; l: string }[] = [
  { v: 'none', l: 'Aucune' },
  { v: 'offset', l: 'Offset' },
  { v: 'page', l: 'Page' },
  { v: 'cursor', l: 'Curseur' },
  { v: 'next_link', l: 'Lien suivant' },
]

const props = defineProps<{
  sourceType: SourceType | null
  fileObj: File | null
  fileName: string
  /** xlsx/xls uniquement — feuille et ligne d'en-têtes choisies via l'aperçu ci-dessous. */
  sheetName?: string | null
  headerRow?: number | null
  /** Numéros de ligne (1-indexés, dans la feuille) à exclure du parsing, sous la ligne d'en-têtes. */
  excludedRows?: number[]
  apiForm: ApiFormShape
  /** Mode édition : libellé du fichier déjà en place, affiché tant qu'aucun nouveau fichier n'est choisi. */
  existingFileLabel?: string
  /** Mode édition d'une source API : active le bouton "Actualiser maintenant" et l'affichage des dates. */
  isEditingApi?: boolean
  /** Masque le sélecteur de fréquence + le bloc "Actualiser maintenant" quand une étape dédiée (Synchronisation) les porte. */
  hideRefreshFrequency?: boolean
  lastRefreshedAt?: string | null
  nextRefreshAt?: string | null
  refreshing?: boolean
  isPartial?: boolean
  partialReason?: string | null
  /** Mode édition d'une source API "live" : mapping de requête actuel, complétable manuellement ci-dessous. */
  queryMapping?: QueryMapping
}>()

const PARTIAL_REASON_LABELS: Record<string, string> = {
  max_pages: 'nombre maximum de pages atteint',
  max_rows: 'nombre maximum de lignes atteint',
  time_budget: "délai maximum de récupération atteint",
}

const emit = defineEmits<{
  'update:fileObj': [File | null]
  'update:fileName': [string]
  'update:sheetName': [string | null]
  'update:headerRow': [number | null]
  'update:excludedRows': [number[]]
  'update:apiForm': [ApiFormShape]
  'refresh-now': []
  'set-filter-param': [column: string, param: string]
  'set-filter-range': [column: string, gteParam: string, lteParam: string]
  'toggle-sortable-column': [column: string, sortable: boolean]
  'set-search-param': [value: string]
  'set-sort-param': [value: string]
  'set-sort-direction-param': [value: string]
}>()

function updateApiForm(patch: Partial<ApiFormShape>) {
  emit('update:apiForm', { ...props.apiForm, ...patch })
}

function updatePagination(patch: Partial<ApiFormPagination>) {
  updateApiForm({ pagination: { ...props.apiForm.pagination, ...patch } })
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

// ─── File drop zone ──────────────────────────────────────────────────────────

const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const ACCEPTED = '.csv,.xlsx,.xls,.json,.parquet'

const isSpreadsheet = computed(() => /\.(xlsx|xls)$/i.test(props.fileObj?.name ?? ''))

function setFile(file: File) {
  emit('update:fileObj', file)
  if (!props.fileName) {
    emit('update:fileName', file.name.replace(/\.[^/.]+$/, ''))
  }
  emit('update:sheetName', null)
  emit('update:headerRow', null)
  emit('update:excludedRows', [])
  spreadsheetPreview.value = null
  previewError.value = ''
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    loadSpreadsheetPreview(undefined, file)
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) setFile(input.files[0])
}

function onFileDrop(event: DragEvent) {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) setFile(file)
}

function onFileDragOver(event: DragEvent) {
  isDragOver.value = true
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

const fileExtension = computed(() => {
  if (!props.fileObj) return ''
  return props.fileObj.name.split('.').pop()?.toUpperCase() ?? ''
})

const fileSize = computed(() => {
  if (!props.fileObj) return ''
  const bytes = props.fileObj.size
  if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} Mo`
  return `${(bytes / 1024).toFixed(0)} Ko`
})

// ─── Spreadsheet preview (xlsx/xls — choix de la feuille et de la ligne d'en-têtes) ──

const spreadsheetPreview = ref<SpreadsheetPreview | null>(null)
const previewLoading = ref(false)
const previewError = ref('')

async function loadSpreadsheetPreview(sheet?: string, fileOverride?: File) {
  const file = fileOverride ?? props.fileObj
  if (!file) return
  previewLoading.value = true
  previewError.value = ''
  try {
    const preview = await previewSpreadsheet(file, sheet)
    spreadsheetPreview.value = preview
    emit('update:sheetName', preview.sheetName)
    emit('update:headerRow', props.headerRow ?? preview.suggestedHeaderRow ?? 1)
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    previewError.value = msg ?? "Impossible de lire ce fichier pour l'aperçu"
  } finally {
    previewLoading.value = false
  }
}

function onSheetChange(sheet: string) {
  emit('update:headerRow', null)
  emit('update:excludedRows', [])
  loadSpreadsheetPreview(sheet)
}

function selectHeaderRow(rowIndex1Based: number) {
  emit('update:headerRow', rowIndex1Based)
  // La ligne d'en-têtes ne peut pas aussi être exclue.
  emit('update:excludedRows', (props.excludedRows ?? []).filter((r) => r !== rowIndex1Based))
}

function toggleExcludeRow(rowIndex1Based: number) {
  const current = props.excludedRows ?? []
  emit(
    'update:excludedRows',
    current.includes(rowIndex1Based)
      ? current.filter((r) => r !== rowIndex1Based)
      : [...current, rowIndex1Based],
  )
}

// ─── API test connection ─────────────────────────────────────────────────────

const testStatus = ref<'idle' | 'loading' | 'ok' | 'error'>('idle')
const testMessage = ref('')

async function testConnection() {
  if (!props.apiForm.url) return
  testStatus.value = 'loading'
  testMessage.value = ''

  try {
    await apiHttp.post(STATSIO_API.sourceApi.probeConnection, {
      url: props.apiForm.url,
      method: props.apiForm.method,
      headers: apiFormAuthHeaders(props.apiForm),
    })
    testStatus.value = 'ok'
    testMessage.value = 'Connexion réussie'
  } catch (e: unknown) {
    testStatus.value = 'error'
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    testMessage.value = msg ?? 'Impossible de joindre cette URL'
  }
}

// ─── API structure auto-detection (re-détection en édition — voir StepApiDetect pour la création) ──

const { detectStatus, detectResult, detectError, runDetection } = useApiStructureDetection(
  () => props.apiForm,
  updateApiForm,
)

// ─── Configuration avancée (query_mapping manuel) ────────────────────────────

const advancedOpen = ref(false)
const newFilterColumn = ref('')
const newFilterParam = ref('')
const newRangeColumn = ref('')
const newRangeGteParam = ref('')
const newRangeLteParam = ref('')
const newSortableColumn = ref('')

function addFilterMapping() {
  if (!newFilterColumn.value.trim() || !newFilterParam.value.trim()) return
  emit('set-filter-param', newFilterColumn.value.trim(), newFilterParam.value.trim())
  newFilterColumn.value = ''
  newFilterParam.value = ''
}

function addFilterRange() {
  if (!newRangeColumn.value.trim() || !newRangeGteParam.value.trim() || !newRangeLteParam.value.trim()) return
  emit('set-filter-range', newRangeColumn.value.trim(), newRangeGteParam.value.trim(), newRangeLteParam.value.trim())
  newRangeColumn.value = ''
  newRangeGteParam.value = ''
  newRangeLteParam.value = ''
}

function addSortableColumn() {
  if (!newSortableColumn.value.trim()) return
  emit('toggle-sortable-column', newSortableColumn.value.trim(), true)
  newSortableColumn.value = ''
}
</script>

<template>
  <!-- File form -->
  <div v-if="sourceType === 'file'" class="flex flex-col gap-5 py-2">
    <div
      class="relative rounded-2xl border-2 border-dashed transition-all cursor-pointer"
      :class="isDragOver
        ? 'border-[var(--color-primary)] bg-purple-50'
        : fileObj ? 'border-emerald-300 bg-emerald-50' : 'border-[var(--studio-line-strong)] hover:border-slate-300 bg-[var(--studio-note)]'"
      @click="fileInputRef?.click()"
      @dragover.prevent="onFileDragOver"
      @dragleave="isDragOver = false"
      @drop.prevent="onFileDrop"
    >
      <input
        ref="fileInputRef"
        type="file"
        class="sr-only"
        :accept="ACCEPTED"
        @change="onFileChange"
      />

      <div v-if="!fileObj && existingFileLabel" class="flex items-center gap-4 p-4 pointer-events-none">
        <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-[var(--studio-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12L12 18m0 0 3.75-3.75M12 18V9m-3.75-6H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-[var(--studio-ink)] truncate">{{ existingFileLabel }}</p>
          <p class="text-xs text-[var(--studio-faint)] mt-0.5">Fichier actuel — cliquer ou glisser pour remplacer</p>
        </div>
      </div>

      <div v-else-if="!fileObj" class="flex flex-col items-center gap-3 py-10 px-6 text-center pointer-events-none">
        <svg class="w-10 h-10 text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <div>
          <p class="text-sm font-semibold text-[var(--studio-muted)]">Glisser un fichier ici</p>
          <p class="text-xs text-[var(--studio-faint)] mt-1">ou cliquer pour parcourir — CSV, XLSX, JSON, Parquet</p>
        </div>
      </div>

      <div v-else class="flex items-center gap-4 p-4">
        <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <span class="text-[10px] font-bold text-emerald-700">{{ fileExtension }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-[var(--studio-ink)] truncate">{{ fileObj.name }}</p>
          <p class="text-xs text-[var(--studio-faint)] mt-0.5">{{ fileSize }}</p>
        </div>
        <button
          class="shrink-0 p-1.5 rounded-lg text-[var(--studio-faint)] hover:text-red-500 hover:bg-red-50 transition-colors"
          @click.stop="emit('update:fileObj', null); if (!existingFileLabel) emit('update:fileName', '')"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">
        Nom de la source <span class="font-normal normal-case text-[var(--studio-faint)]">(optionnel)</span>
      </label>
      <input
        :value="fileName"
        type="text"
        class="w-full rounded-xl border border-[var(--studio-line-strong)] px-4 py-2.5 text-sm text-[var(--studio-ink)] focus:outline-none  focus:border-[var(--color-primary)] transition-all"
        placeholder="ex : Inflation 2026"
        @input="emit('update:fileName', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div v-if="isSpreadsheet" class="rounded-xl border border-[var(--studio-line-strong)] p-3">
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)]">
          Feuille et ligne d'en-têtes
        </label>
        <svg v-if="previewLoading" class="w-3.5 h-3.5 animate-spin text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <p v-if="previewError" class="text-xs text-red-500">{{ previewError }}</p>

      <template v-else-if="spreadsheetPreview">
        <AppSelect
          v-if="spreadsheetPreview.sheets.length > 1"
          :model-value="sheetName ?? spreadsheetPreview.sheetName"
          :options="spreadsheetPreview.sheets.map((s) => ({ value: s, label: s }))"
          class="mb-2"
          teleport
          @update:model-value="onSheetChange($event as string)"
        />

        <p class="text-[11px] text-[var(--studio-faint)] mb-2">
          Cliquez sur la ligne qui contient les en-têtes de colonnes ({{ headerRow ? `ligne ${headerRow} sélectionnée` : 'aucune sélection' }}).
          Pour les lignes sous l'en-tête, utilisez l'icône pour exclure une note ou une ligne parasite du jeu de données.
        </p>

        <div class="overflow-x-auto rounded-lg border border-[var(--studio-line)] max-h-56 overflow-y-auto">
          <table class="w-full text-[11px]">
            <tbody>
              <tr
                v-for="(row, i) in spreadsheetPreview.rows"
                :key="i"
                class="border-t border-[var(--studio-line)] first:border-t-0"
                :class="[
                  headerRow === i + 1 ? 'bg-emerald-50' : (excludedRows ?? []).includes(i + 1) ? 'bg-[var(--studio-note)]' : 'hover:bg-[var(--studio-note)]',
                ]"
              >
                <td class="w-5 shrink-0 px-1">
                  <button
                    v-if="headerRow != null && i + 1 > headerRow"
                    type="button"
                    class="flex items-center justify-center w-4 h-4 rounded transition-colors"
                    :class="(excludedRows ?? []).includes(i + 1)
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-[var(--studio-faint)] hover:text-[var(--studio-muted)]'"
                    :title="(excludedRows ?? []).includes(i + 1) ? 'Réinclure cette ligne' : 'Exclure cette ligne'"
                    @click.stop="toggleExcludeRow(i + 1)"
                  >
                    <svg v-if="(excludedRows ?? []).includes(i + 1)" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    <svg v-else class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </button>
                </td>
                <td
                  class="px-1 py-1 text-[var(--studio-faint)] font-mono w-6 text-right shrink-0 cursor-pointer"
                  @click="selectHeaderRow(i + 1)"
                >
                  {{ i + 1 }}
                </td>
                <td
                  v-for="(cell, j) in row.slice(0, 8)"
                  :key="j"
                  class="px-2 py-1 text-[var(--studio-muted)] truncate max-w-[120px] cursor-pointer"
                  :class="[
                    headerRow === i + 1 ? 'font-semibold text-emerald-700' : '',
                    (excludedRows ?? []).includes(i + 1) ? 'line-through text-[var(--studio-faint)]' : '',
                  ]"
                  @click="selectHeaderRow(i + 1)"
                >
                  {{ cell ?? '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="(excludedRows ?? []).length" class="text-[11px] text-[var(--studio-faint)] mt-1.5">
          {{ excludedRows!.length }} ligne{{ excludedRows!.length > 1 ? 's' : '' }} exclue{{ excludedRows!.length > 1 ? 's' : '' }} :
          {{ [...excludedRows!].sort((a, b) => a - b).join(', ') }}
        </p>
      </template>
    </div>
  </div>

  <!-- API form -->
  <div v-else-if="sourceType === 'api'" class="flex flex-col gap-4 py-2">
    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">Nom <span class="text-red-400">*</span></label>
      <input
        :value="apiForm.name"
        type="text"
        class="w-full rounded-xl border border-[var(--studio-line-strong)] px-4 py-2.5 text-sm text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
        placeholder="ex : API météo OpenWeather"
        @input="updateApiForm({ name: ($event.target as HTMLInputElement).value })"
      />
    </div>

    <!-- Édition uniquement : à la création, l'URL est déjà capturée à l'étape "Détection". -->
    <div v-if="isEditingApi">
      <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">URL <span class="text-red-400">*</span></label>
      <div class="flex gap-2">
        <AppSelect
          :model-value="apiForm.method"
          :options="[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }]"
          class="shrink-0 w-24"
          teleport
          @update:model-value="updateApiForm({ method: $event as HttpMethod })"
        />
        <input
          :value="apiForm.url"
          type="url"
          class="flex-1 rounded-xl border border-[var(--studio-line-strong)] px-4 py-2.5 text-sm text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all font-mono"
          placeholder="https://api.example.com/data"
          @input="updateApiForm({ url: ($event.target as HTMLInputElement).value })"
        />
      </div>
    </div>

    <div v-if="isEditingApi" class="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:cursor-wait disabled:opacity-60"
          :class="detectStatus === 'loading' ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'"
          :disabled="!apiForm.url || detectStatus === 'loading'"
          @click="runDetection"
        >
          <svg v-if="detectStatus === 'loading'" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3.75 12 6.75-6.75M3.75 12l6.75 6.75M3.75 12h16.5" transform="rotate(90 12 12)" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          Redétecter automatiquement
        </button>
        <p class="text-[11px] text-[var(--studio-muted)] leading-tight">
          <template v-if="detectStatus === 'idle'">Analyse la réponse de l'API pour re-pré-remplir enveloppe et pagination.</template>
          <template v-else-if="detectStatus === 'loading'">Analyse en cours…</template>
          <template v-else-if="detectStatus === 'detected'">Structure détectée — vérifiez les champs ci-dessous.</template>
          <template v-else-if="detectStatus === 'error'">{{ detectError }}</template>
        </p>
      </div>

      <div v-if="detectStatus === 'detected' && detectResult" class="mt-3 border-t border-blue-100 pt-3">
        <ApiDetectionResults :result="detectResult" />
      </div>
    </div>

    <div v-if="!isEditingApi">
      <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">
        Mode de récupération
      </label>
      <div class="flex rounded-xl border border-[var(--studio-line-strong)] overflow-hidden">
        <button
          v-for="opt in [{ v: 'snapshot', l: 'Instantané (Parquet)' }, { v: 'live', l: 'En direct' }]"
          :key="opt.v"
          type="button"
          class="flex-1 py-2 text-xs font-semibold transition-colors"
          :class="apiForm.materialization === opt.v
            ? 'bg-blue-500 text-white'
            : 'text-[var(--studio-muted)] hover:bg-[var(--studio-note)]'"
          @click="updateApiForm({ materialization: opt.v as Materialization })"
        >
          {{ opt.l }}
        </button>
      </div>
      <p class="text-[11px] text-[var(--studio-faint)] mt-1">
        <template v-if="apiForm.materialization === 'live'">
          Chaque consultation interroge l'API en direct — aucune donnée n'est stockée. Adapté aux sources
          trop volumineuses pour être copiées (des millions de lignes). Pas de jointures ni d'agrégations.
        </template>
        <template v-else>
          Les données sont récupérées une fois et converties en Parquet, puis actualisées selon la fréquence choisie.
        </template>
      </p>
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">Authentification</label>
      <div class="flex rounded-xl border border-[var(--studio-line-strong)] overflow-hidden">
        <button
          v-for="opt in [{ v: 'none', l: 'Aucune' }, { v: 'api_key', l: 'Clé API' }, { v: 'bearer', l: 'Bearer' }]"
          :key="opt.v"
          class="flex-1 py-2 text-xs font-semibold transition-colors"
          :class="apiForm.authType === opt.v
            ? 'bg-blue-500 text-white'
            : 'text-[var(--studio-muted)] hover:bg-[var(--studio-note)]'"
          @click="updateApiForm({ authType: opt.v as AuthType })"
        >
          {{ opt.l }}
        </button>
      </div>

      <div v-if="apiForm.authType === 'api_key'" class="mt-3 flex gap-2">
        <input
          :value="apiForm.apiKeyHeader"
          type="text"
          class="w-32 shrink-0 rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-muted)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
          placeholder="X-API-Key"
          @input="updateApiForm({ apiKeyHeader: ($event.target as HTMLInputElement).value })"
        />
        <input
          :value="apiForm.apiKeyValue"
          type="password"
          class="flex-1 rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
          placeholder="Valeur de la clé"
          @input="updateApiForm({ apiKeyValue: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div v-if="apiForm.authType === 'bearer'" class="mt-3">
        <input
          :value="apiForm.bearerToken"
          type="password"
          class="w-full rounded-xl border border-[var(--studio-line-strong)] px-4 py-2.5 text-sm text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
          placeholder="Token d'accès"
          @input="updateApiForm({ bearerToken: ($event.target as HTMLInputElement).value })"
        />
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">
        Chemin des données <span class="font-normal normal-case text-[var(--studio-faint)]">(optionnel)</span>
      </label>
      <input
        :value="apiForm.dataPath"
        type="text"
        class="w-full rounded-xl border border-[var(--studio-line-strong)] px-4 py-2.5 text-sm text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
        placeholder="ex : data.results ou items"
        @input="updateApiForm({ dataPath: ($event.target as HTMLInputElement).value })"
      />
      <p class="text-[11px] text-[var(--studio-faint)] mt-1">Laissez vide si l'API renvoie directement un tableau.</p>
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">
        Pagination <span class="font-normal normal-case text-[var(--studio-faint)]">(si l'API renvoie plusieurs pages)</span>
      </label>
      <div class="flex rounded-xl border border-[var(--studio-line-strong)] overflow-hidden">
        <button
          v-for="opt in PAGINATION_STYLE_OPTIONS"
          :key="opt.v"
          type="button"
          class="flex-1 py-2 text-[11px] font-semibold transition-colors"
          :class="apiForm.pagination.style === opt.v
            ? 'bg-blue-500 text-white'
            : 'text-[var(--studio-muted)] hover:bg-[var(--studio-note)]'"
          @click="updatePagination({ style: opt.v })"
        >
          {{ opt.l }}
        </button>
      </div>

      <!-- offset / page -->
      <div v-if="apiForm.pagination.style === 'offset' || apiForm.pagination.style === 'page'" class="mt-3 flex flex-col gap-2">
        <div class="flex gap-2">
          <input
            :value="apiForm.pagination.paramName"
            type="text"
            class="flex-1 rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
            placeholder="Nom du paramètre (ex : offset)"
            @input="updatePagination({ paramName: ($event.target as HTMLInputElement).value })"
          />
          <input
            :value="apiForm.pagination.paramStart"
            type="number"
            class="w-28 shrink-0 rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
            placeholder="Départ"
            @input="updatePagination({ paramStart: Number(($event.target as HTMLInputElement).value) })"
          />
        </div>
        <div class="flex gap-2">
          <input
            :value="apiForm.pagination.sizeParam"
            type="text"
            class="flex-1 rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
            placeholder="Nom du paramètre taille (ex : limit)"
            @input="updatePagination({ sizeParam: ($event.target as HTMLInputElement).value })"
          />
          <input
            :value="apiForm.pagination.pageSize"
            type="number"
            class="w-28 shrink-0 rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
            placeholder="Taille de page"
            @input="updatePagination({ pageSize: Number(($event.target as HTMLInputElement).value) })"
          />
        </div>
        <input
          :value="apiForm.pagination.totalPath"
          type="text"
          class="w-full rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
          placeholder="Chemin du total (optionnel, ex : meta.total)"
          @input="updatePagination({ totalPath: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <!-- cursor -->
      <div v-else-if="apiForm.pagination.style === 'cursor'" class="mt-3 flex flex-col gap-2">
        <div class="flex gap-2">
          <input
            :value="apiForm.pagination.cursorParam"
            type="text"
            class="flex-1 rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
            placeholder="Nom du paramètre curseur (ex : cursor)"
            @input="updatePagination({ cursorParam: ($event.target as HTMLInputElement).value })"
          />
          <input
            :value="apiForm.pagination.pageSize"
            type="number"
            class="w-28 shrink-0 rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
            placeholder="Taille de page"
            @input="updatePagination({ pageSize: Number(($event.target as HTMLInputElement).value) })"
          />
        </div>
        <input
          :value="apiForm.pagination.cursorPath"
          type="text"
          class="w-full rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
          placeholder="Chemin du curseur dans la réponse (ex : next_cursor)"
          @input="updatePagination({ cursorPath: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <!-- next_link -->
      <div v-else-if="apiForm.pagination.style === 'next_link'" class="mt-3 flex flex-col gap-2">
        <div class="flex rounded-xl border border-[var(--studio-line-strong)] overflow-hidden">
          <button
            v-for="opt in [{ v: 'body', l: 'Dans la réponse (JSON)' }, { v: 'header', l: 'Header HTTP Link' }]"
            :key="opt.v"
            type="button"
            class="flex-1 py-2 text-[11px] font-semibold transition-colors"
            :class="apiForm.pagination.nextLinkSource === opt.v
              ? 'bg-blue-500 text-white'
              : 'text-[var(--studio-muted)] hover:bg-[var(--studio-note)]'"
            @click="updatePagination({ nextLinkSource: opt.v as 'body' | 'header' })"
          >
            {{ opt.l }}
          </button>
        </div>
        <input
          v-if="apiForm.pagination.nextLinkSource === 'body'"
          :value="apiForm.pagination.nextLinkPath"
          type="text"
          class="w-full rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
          placeholder="Chemin de l'URL suivante (ex : next_page_url)"
          @input="updatePagination({ nextLinkPath: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div v-if="apiForm.pagination.style !== 'none' && apiForm.materialization !== 'live'" class="mt-3">
        <input
          :value="apiForm.pagination.maxPages ?? ''"
          type="number"
          class="w-full rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-sm text-[var(--studio-ink)] focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
          placeholder="Nombre max. de pages (optionnel, défaut serveur : 100)"
          @input="updatePagination({ maxPages: ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null })"
        />
      </div>
    </div>

    <div v-if="apiForm.materialization !== 'live' && !hideRefreshFrequency">
      <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">
        Actualisation automatique
      </label>
      <div class="flex rounded-xl border border-[var(--studio-line-strong)] overflow-hidden">
        <button
          v-for="opt in REFRESH_FREQUENCY_OPTIONS"
          :key="opt.v"
          type="button"
          class="flex-1 py-2 text-[11px] font-semibold transition-colors"
          :class="apiForm.refreshFrequency === opt.v
            ? 'bg-blue-500 text-white'
            : 'text-[var(--studio-muted)] hover:bg-[var(--studio-note)]'"
          @click="updateApiForm({ refreshFrequency: opt.v })"
        >
          {{ opt.l }}
        </button>
      </div>
      <p class="text-[11px] text-[var(--studio-faint)] mt-1">
        La source sera automatiquement ré-interrogée à cette fréquence.
      </p>
    </div>

    <p v-if="isEditingApi && isPartial" class="rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-700">
      Données partielles — {{ partialReason ? PARTIAL_REASON_LABELS[partialReason] ?? partialReason : 'récupération incomplète' }}.
      Ajoutez des filtres à l'URL ou augmentez le nombre max. de pages pour récupérer davantage de données.
    </p>

    <p v-if="isEditingApi && apiForm.materialization === 'live'" class="rounded-xl bg-blue-50 px-4 py-2 text-xs text-blue-700">
      Source en direct — toujours à jour, aucune actualisation nécessaire.
    </p>

    <div v-if="isEditingApi && apiForm.materialization !== 'live' && !hideRefreshFrequency" class="flex items-center gap-3 rounded-xl bg-[var(--studio-note)] p-3">
      <button
        type="button"
        class="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
        :class="refreshing
          ? 'border-[var(--studio-line-strong)] text-[var(--studio-faint)] cursor-wait'
          : 'border-blue-200 text-blue-600 hover:bg-blue-50'"
        :disabled="refreshing"
        @click="emit('refresh-now')"
      >
        <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': refreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Actualiser maintenant
      </button>
      <div class="text-[11px] text-[var(--studio-muted)] leading-tight">
        <p>Dernière actualisation : {{ formatDate(lastRefreshedAt) }}</p>
        <p v-if="apiForm.refreshFrequency !== 'none'">Prochaine actualisation : {{ formatDate(nextRefreshAt) }}</p>
      </div>
    </div>

    <div
      class="flex items-center gap-3 rounded-xl p-3 transition-colors"
      :class="testStatus === 'ok' ? 'bg-emerald-50' : testStatus === 'error' ? 'bg-red-50' : 'bg-[var(--studio-note)]'"
    >
      <button
        class="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
        :class="testStatus === 'loading'
          ? 'border-[var(--studio-line-strong)] text-[var(--studio-faint)] cursor-wait'
          : 'border-blue-200 text-blue-600 hover:bg-blue-50'"
        :disabled="!apiForm.url || testStatus === 'loading'"
        @click="testConnection"
      >
        <svg v-if="testStatus === 'loading'" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.122a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Z" />
        </svg>
        Tester la connexion
      </button>
      <p
        class="text-xs font-medium"
        :class="testStatus === 'ok' ? 'text-emerald-600' : testStatus === 'error' ? 'text-red-500' : 'text-[var(--studio-faint)]'"
      >
        {{ testStatus === 'idle' ? 'Vérifiez la connexion avant de continuer' : testMessage }}
      </p>
    </div>

    <!-- Configuration avancée — complète manuellement la détection auto (recherche/tri/filtres) -->
    <div v-if="isEditingApi && queryMapping" class="rounded-xl border border-[var(--studio-line-strong)]">
      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-[var(--studio-muted)]"
        @click="advancedOpen = !advancedOpen"
      >
        Configuration avancée
        <svg class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': advancedOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div v-if="advancedOpen" class="flex flex-col gap-4 border-t border-[var(--studio-line)] p-3">
        <p class="text-[11px] text-[var(--studio-faint)] leading-relaxed">
          Corrige ou complète ce que la détection automatique n'a pas su deviner — utile quand
          l'API a une recherche/un tri/des filtres que le sondage n'a pas reconnus.
        </p>

        <!-- Recherche -->
        <div>
          <label class="block text-[11px] font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">
            Paramètre de recherche <span class="font-normal normal-case">(optionnel)</span>
          </label>
          <input
            :value="queryMapping.searchParam ?? ''"
            type="text"
            class="w-full rounded-lg border border-[var(--studio-line-strong)] px-3 py-1.5 text-xs text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
            placeholder="ex : q, search"
            @change="emit('set-search-param', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- Tri -->
        <div>
          <label class="block text-[11px] font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">Tri</label>
          <div class="flex gap-2 mb-2">
            <input
              :value="queryMapping.sortParam ?? ''"
              type="text"
              class="flex-1 rounded-lg border border-[var(--studio-line-strong)] px-3 py-1.5 text-xs text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
              placeholder="Paramètre (ex : sort)"
              @change="emit('set-sort-param', ($event.target as HTMLInputElement).value)"
            />
            <input
              :value="queryMapping.sortDirectionParam ?? ''"
              type="text"
              class="flex-1 rounded-lg border border-[var(--studio-line-strong)] px-3 py-1.5 text-xs text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
              placeholder="Paramètre de direction (optionnel, ex : order)"
              @change="emit('set-sort-direction-param', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <p class="text-[11px] text-[var(--studio-faint)] mb-2">
            Deux conventions : un paramètre générique (ex. <code>sort</code>, avec direction dans un
            second champ) — ou <code>{column}</code> dans le nom si l'API a un paramètre par colonne
            (ex. <code>{column}__sort</code> pour <code>prix__sort=asc</code>). Sans paramètre déclaré,
            les colonnes ci-dessous restent triables mais le tri n'a aucun effet.
          </p>
          <div v-if="queryMapping.sortableColumns.length" class="flex flex-wrap gap-1.5 mb-2">
            <span
              v-for="col in queryMapping.sortableColumns"
              :key="col"
              class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-mono text-[var(--studio-muted)]"
            >
              {{ col }}
              <button type="button" class="text-[var(--studio-faint)] hover:text-red-500" @click="emit('toggle-sortable-column', col, false)">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newSortableColumn"
              type="text"
              class="flex-1 rounded-lg border border-[var(--studio-line-strong)] px-3 py-1.5 text-xs text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
              placeholder="Nom de colonne triable"
              @keydown.enter.prevent="addSortableColumn"
            />
            <button type="button" class="shrink-0 px-3 py-1.5 rounded-lg border border-[var(--studio-line-strong)] text-xs font-semibold text-[var(--studio-muted)] hover:bg-[var(--studio-note)]" @click="addSortableColumn">
              Ajouter
            </button>
          </div>
        </div>

        <!-- Filtres -->
        <div>
          <label class="block text-[11px] font-semibold uppercase tracking-wider text-[var(--studio-faint)] mb-1.5">Filtres</label>
          <div v-if="Object.keys(queryMapping.filters).length" class="flex flex-col gap-1.5 mb-2">
            <div
              v-for="(f, col) in queryMapping.filters"
              :key="col"
              class="flex items-center justify-between rounded-lg bg-[var(--studio-note)] px-2.5 py-1.5 text-[11px]"
            >
              <span class="font-mono text-[var(--studio-ink)]">
                <template v-if="f.range">{{ col }} → {{ f.range.gteParam }} / {{ f.range.lteParam }}</template>
                <template v-else>{{ col }} → {{ f.param }}</template>
              </span>
              <button type="button" class="text-[var(--studio-faint)] hover:text-red-500" @click="f.range ? emit('set-filter-range', String(col), '', '') : emit('set-filter-param', String(col), '')">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p class="text-[11px] text-[var(--studio-faint)] mb-1.5">Égalité (ex : <code>ville__exact</code>) :</p>
          <div class="flex gap-2 mb-3">
            <input
              v-model="newFilterColumn"
              type="text"
              class="flex-1 rounded-lg border border-[var(--studio-line-strong)] px-3 py-1.5 text-xs text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
              placeholder="Colonne"
              @keydown.enter.prevent="addFilterMapping"
            />
            <input
              v-model="newFilterParam"
              type="text"
              class="flex-1 rounded-lg border border-[var(--studio-line-strong)] px-3 py-1.5 text-xs text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
              placeholder="Paramètre upstream"
              @keydown.enter.prevent="addFilterMapping"
            />
            <button type="button" class="shrink-0 px-3 py-1.5 rounded-lg border border-[var(--studio-line-strong)] text-xs font-semibold text-[var(--studio-muted)] hover:bg-[var(--studio-note)]" @click="addFilterMapping">
              Ajouter
            </button>
          </div>

          <p class="text-[11px] text-[var(--studio-faint)] mb-1.5">Plage min/max (ex : <code>prix__greater</code> / <code>prix__less</code>) :</p>
          <div class="flex gap-2">
            <input
              v-model="newRangeColumn"
              type="text"
              class="w-24 shrink-0 rounded-lg border border-[var(--studio-line-strong)] px-3 py-1.5 text-xs text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
              placeholder="Colonne"
              @keydown.enter.prevent="addFilterRange"
            />
            <input
              v-model="newRangeGteParam"
              type="text"
              class="flex-1 rounded-lg border border-[var(--studio-line-strong)] px-3 py-1.5 text-xs text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
              placeholder="Paramètre minimum (≥)"
              @keydown.enter.prevent="addFilterRange"
            />
            <input
              v-model="newRangeLteParam"
              type="text"
              class="flex-1 rounded-lg border border-[var(--studio-line-strong)] px-3 py-1.5 text-xs text-[var(--studio-ink)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
              placeholder="Paramètre maximum (≤)"
              @keydown.enter.prevent="addFilterRange"
            />
            <button type="button" class="shrink-0 px-3 py-1.5 rounded-lg border border-[var(--studio-line-strong)] text-xs font-semibold text-[var(--studio-muted)] hover:bg-[var(--studio-note)]" @click="addFilterRange">
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
