<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'

const emit = defineEmits<{ close: [] }>()
const datasets = useStudioDatasetsStore()

// ─── Step management ─────────────────────────────────────────────────────────

type SourceType = 'file' | 'api'
type Step = 'pick-type' | 'configure'

const step = ref<Step>('pick-type')
const sourceType = ref<SourceType | null>(null)

function selectType(type: SourceType) {
  sourceType.value = type
  step.value = 'configure'
}

function goBack() {
  step.value = 'pick-type'
  sourceType.value = null
  resetForms()
}

function resetForms() {
  // File
  fileObj.value = null
  fileName.value = ''
  isDragOver.value = false
  // API
  apiForm.value.name = ''
  apiForm.value.url = ''
  apiForm.value.method = 'GET'
  apiForm.value.authType = 'none'
  apiForm.value.apiKeyHeader = 'X-API-Key'
  apiForm.value.apiKeyValue = ''
  apiForm.value.bearerToken = ''
  apiForm.value.dataPath = ''
  // Status
  submitStatus.value = 'idle'
  testStatus.value = 'idle'
  testMessage.value = ''
  errorMessage.value = ''
}

// ─── File form ───────────────────────────────────────────────────────────────

const fileObj = ref<File | null>(null)
const fileName = ref('')
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) setFile(input.files[0])
}

function onFileDrop(event: DragEvent) {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) setFile(file)
}

function setFile(file: File) {
  fileObj.value = file
  if (!fileName.value) {
    fileName.value = file.name.replace(/\.[^/.]+$/, '')
  }
}

const fileExtension = computed(() => {
  if (!fileObj.value) return ''
  return fileObj.value.name.split('.').pop()?.toUpperCase() ?? ''
})

const fileSize = computed(() => {
  if (!fileObj.value) return ''
  const bytes = fileObj.value.size
  if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} Mo`
  return `${(bytes / 1024).toFixed(0)} Ko`
})

const ACCEPTED = '.csv,.xlsx,.xls,.json,.parquet'
const ACCEPTED_TYPES = [
  'text/csv', 'application/json',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel', 'text/plain',
  'application/octet-stream', 'application/vnd.apache.parquet',
]

function onFileDragOver(event: DragEvent) {
  isDragOver.value = true
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

// ─── API form ────────────────────────────────────────────────────────────────

type AuthType = 'none' | 'api_key' | 'bearer'
type HttpMethod = 'GET' | 'POST'

const apiForm = ref({
  name: '',
  url: '',
  method: 'GET' as HttpMethod,
  authType: 'none' as AuthType,
  apiKeyHeader: 'X-API-Key',
  apiKeyValue: '',
  bearerToken: '',
  dataPath: '',
})

const testStatus = ref<'idle' | 'loading' | 'ok' | 'error'>('idle')
const testMessage = ref('')

async function testConnection() {
  if (!apiForm.value.url) return
  testStatus.value = 'loading'
  testMessage.value = ''

  const headers: Record<string, string> = {}
  if (apiForm.value.authType === 'api_key' && apiForm.value.apiKeyValue) {
    headers[apiForm.value.apiKeyHeader || 'X-API-Key'] = apiForm.value.apiKeyValue
  }
  if (apiForm.value.authType === 'bearer' && apiForm.value.bearerToken) {
    headers['Authorization'] = `Bearer ${apiForm.value.bearerToken}`
  }

  try {
    await apiHttp.post(STATSIO_API.sourceApi.probeConnection, {
      url: apiForm.value.url,
      method: apiForm.value.method,
      headers,
    })
    testStatus.value = 'ok'
    testMessage.value = 'Connexion réussie'
  } catch (e: unknown) {
    testStatus.value = 'error'
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    testMessage.value = msg ?? 'Impossible de joindre cette URL'
  }
}

// ─── Submit ──────────────────────────────────────────────────────────────────

const submitStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMessage = ref('')

const canSubmit = computed(() => {
  if (submitStatus.value === 'loading') return false
  if (sourceType.value === 'file') return fileObj.value !== null
  if (sourceType.value === 'api') return !!apiForm.value.name.trim() && !!apiForm.value.url.trim()
  return false
})

async function submit() {
  if (!canSubmit.value) return
  submitStatus.value = 'loading'
  errorMessage.value = ''

  try {
    if (sourceType.value === 'file') {
      await submitFile()
    } else {
      await submitApi()
    }
    submitStatus.value = 'success'
    await datasets.loadDatasets()
    setTimeout(() => emit('close'), 800)
  } catch (e: unknown) {
    submitStatus.value = 'error'
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    errorMessage.value = msg ?? 'Une erreur est survenue. Vérifiez les champs et réessayez.'
  }
}

async function submitFile() {
  const form = new FormData()
  form.append('file', fileObj.value!)
  if (fileName.value.trim()) form.append('name', fileName.value.trim())
  await apiHttp.post('/data-sources/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

async function submitApi() {
  const headers: Record<string, string> = {}
  if (apiForm.value.authType === 'api_key' && apiForm.value.apiKeyValue) {
    headers[apiForm.value.apiKeyHeader] = apiForm.value.apiKeyValue
  }
  if (apiForm.value.authType === 'bearer' && apiForm.value.bearerToken) {
    headers['Authorization'] = `Bearer ${apiForm.value.bearerToken}`
  }
  await apiHttp.post(STATSIO_API.apiSources.collection, {
    name: apiForm.value.name,
    url: apiForm.value.url,
    method: apiForm.value.method,
    auth_type: apiForm.value.authType,
    headers,
    data_path: apiForm.value.dataPath || null,
  })
}

// Close on Escape
watch(() => true, () => {
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div class="flex items-center gap-3">
            <!-- Back button -->
            <button
              v-if="step === 'configure'"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors -ml-1"
              @click="goBack"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <h2 class="text-base font-bold text-slate-900">
                {{ step === 'pick-type' ? 'Ajouter une source' : sourceType === 'file' ? 'Importer un fichier' : 'Connecter une API' }}
              </h2>
              <p v-if="step === 'configure'" class="text-xs text-slate-400 mt-0.5">
                {{ sourceType === 'file' ? 'CSV, Excel, JSON ou Parquet natif' : 'REST API avec authentification optionnelle' }}
              </p>
            </div>
          </div>
          <button
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            @click="emit('close')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">

          <!-- Step 0: Pick type -->
          <div v-if="step === 'pick-type'" class="p-6 grid grid-cols-2 gap-3">
            <!-- File -->
            <button
              class="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-6 text-center hover:border-[var(--color-primary)] hover:bg-purple-50/40 transition-all"
              @click="selectType('file')"
            >
              <div class="w-14 h-14 rounded-2xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                <svg class="w-7 h-7 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-800 group-hover:text-[var(--color-primary)] transition-colors">Fichier</p>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">CSV, Excel, JSON, Parquet<br>Upload direct</p>
              </div>
            </button>

            <!-- API -->
            <button
              class="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-6 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-all"
              @click="selectType('api')"
            >
              <div class="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <svg class="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">API REST</p>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">URL externe<br>Auth optionnelle</p>
              </div>
            </button>
          </div>

          <!-- Step 1: File form -->
          <div v-else-if="sourceType === 'file'" class="px-6 py-5 flex flex-col gap-5">

            <!-- Drop zone -->
            <div
              class="relative rounded-2xl border-2 border-dashed transition-all cursor-pointer"
              :class="isDragOver
                ? 'border-[var(--color-primary)] bg-purple-50'
                : fileObj ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'"
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

              <!-- No file selected -->
              <div v-if="!fileObj" class="flex flex-col items-center gap-3 py-10 px-6 text-center pointer-events-none">
                <svg class="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <div>
                  <p class="text-sm font-semibold text-slate-600">Glisser un fichier ici</p>
                  <p class="text-xs text-slate-400 mt-1">ou cliquer pour parcourir — CSV, XLSX, JSON, Parquet</p>
                </div>
              </div>

              <!-- File selected -->
              <div v-else class="flex items-center gap-4 p-4">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <span class="text-[10px] font-bold text-emerald-700">{{ fileExtension }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-800 truncate">{{ fileObj.name }}</p>
                  <p class="text-xs text-slate-400 mt-0.5">{{ fileSize }}</p>
                </div>
                <button
                  class="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  @click.stop="fileObj = null; fileName = ''"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Name -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Nom de la source <span class="font-normal normal-case text-slate-400">(optionnel)</span>
              </label>
              <input
                v-model="fileName"
                type="text"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                placeholder="ex : Inflation 2026"
              />
            </div>
          </div>

          <!-- Step 1: API form -->
          <div v-else-if="sourceType === 'api'" class="px-6 py-5 flex flex-col gap-4">

            <!-- Name -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nom <span class="text-red-400">*</span></label>
              <input
                v-model="apiForm.name"
                type="text"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
                placeholder="ex : API météo OpenWeather"
              />
            </div>

            <!-- URL + Method -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">URL <span class="text-red-400">*</span></label>
              <div class="flex gap-2">
                <select
                  v-model="apiForm.method"
                  class="shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
                <input
                  v-model="apiForm.url"
                  type="url"
                  class="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all font-mono"
                  placeholder="https://api.example.com/data"
                />
              </div>
            </div>

            <!-- Authentication -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Authentification</label>
              <div class="flex rounded-xl border border-slate-200 overflow-hidden">
                <button
                  v-for="opt in [{ v: 'none', l: 'Aucune' }, { v: 'api_key', l: 'Clé API' }, { v: 'bearer', l: 'Bearer' }]"
                  :key="opt.v"
                  class="flex-1 py-2 text-xs font-semibold transition-colors"
                  :class="apiForm.authType === opt.v
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-500 hover:bg-slate-50'"
                  @click="apiForm.authType = opt.v as AuthType"
                >
                  {{ opt.l }}
                </button>
              </div>

              <!-- API Key fields -->
              <div v-if="apiForm.authType === 'api_key'" class="mt-3 flex gap-2">
                <input
                  v-model="apiForm.apiKeyHeader"
                  type="text"
                  class="w-32 shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
                  placeholder="X-API-Key"
                />
                <input
                  v-model="apiForm.apiKeyValue"
                  type="password"
                  class="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
                  placeholder="Valeur de la clé"
                />
              </div>

              <!-- Bearer token field -->
              <div v-if="apiForm.authType === 'bearer'" class="mt-3">
                <input
                  v-model="apiForm.bearerToken"
                  type="password"
                  class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
                  placeholder="Token d'accès"
                />
              </div>
            </div>

            <!-- Data path -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Chemin des données <span class="font-normal normal-case text-slate-400">(optionnel)</span>
              </label>
              <input
                v-model="apiForm.dataPath"
                type="text"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
                placeholder="ex : data.results ou items"
              />
              <p class="text-[11px] text-slate-400 mt-1">Laissez vide si l'API renvoie directement un tableau.</p>
            </div>

            <!-- Test connection -->
            <div
              class="flex items-center gap-3 rounded-xl p-3 transition-colors"
              :class="testStatus === 'ok' ? 'bg-emerald-50' : testStatus === 'error' ? 'bg-red-50' : 'bg-slate-50'"
            >
              <button
                class="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
                :class="testStatus === 'loading'
                  ? 'border-slate-200 text-slate-400 cursor-wait'
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
                :class="testStatus === 'ok' ? 'text-emerald-600' : testStatus === 'error' ? 'text-red-500' : 'text-slate-400'"
              >
                {{ testStatus === 'idle' ? 'Vérifiez la connexion avant de continuer' : testMessage }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="step === 'configure'" class="px-6 py-4 border-t border-slate-100 flex flex-col gap-3 shrink-0">
          <!-- Error -->
          <p v-if="submitStatus === 'error'" class="text-xs text-red-500 text-center">
            {{ errorMessage }}
          </p>

          <!-- Success -->
          <div v-if="submitStatus === 'success'" class="flex items-center justify-center gap-2 text-sm text-emerald-600 font-semibold">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Source ajoutée — traitement en cours
          </div>

          <div v-else class="flex gap-3">
            <button
              class="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              @click="emit('close')"
            >
              Annuler
            </button>
            <button
              class="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
              :class="canSubmit
                ? (sourceType === 'api' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-[var(--color-primary)] hover:bg-purple-700')
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'"
              :disabled="!canSubmit"
              @click="submit"
            >
              <svg v-if="submitStatus === 'loading'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ submitStatus === 'loading' ? 'Envoi…' : 'Ajouter la source' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>
