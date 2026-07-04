<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { SourceType, AuthType, HttpMethod } from '@/composables/useAddSourceWizard'

interface ApiFormShape {
  name: string
  url: string
  method: HttpMethod
  authType: AuthType
  apiKeyHeader: string
  apiKeyValue: string
  bearerToken: string
  dataPath: string
}

const props = defineProps<{
  sourceType: SourceType | null
  fileObj: File | null
  fileName: string
  apiForm: ApiFormShape
}>()

const emit = defineEmits<{
  'update:fileObj': [File | null]
  'update:fileName': [string]
  'update:apiForm': [ApiFormShape]
}>()

function updateApiForm(patch: Partial<ApiFormShape>) {
  emit('update:apiForm', { ...props.apiForm, ...patch })
}

// ─── File drop zone ──────────────────────────────────────────────────────────

const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const ACCEPTED = '.csv,.xlsx,.xls,.json,.parquet'

function setFile(file: File) {
  emit('update:fileObj', file)
  if (!props.fileName) {
    emit('update:fileName', file.name.replace(/\.[^/.]+$/, ''))
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

// ─── API test connection ─────────────────────────────────────────────────────

const testStatus = ref<'idle' | 'loading' | 'ok' | 'error'>('idle')
const testMessage = ref('')

async function testConnection() {
  if (!props.apiForm.url) return
  testStatus.value = 'loading'
  testMessage.value = ''

  const headers: Record<string, string> = {}
  if (props.apiForm.authType === 'api_key' && props.apiForm.apiKeyValue) {
    headers[props.apiForm.apiKeyHeader || 'X-API-Key'] = props.apiForm.apiKeyValue
  }
  if (props.apiForm.authType === 'bearer' && props.apiForm.bearerToken) {
    headers['Authorization'] = `Bearer ${props.apiForm.bearerToken}`
  }

  try {
    await apiHttp.post(STATSIO_API.sourceApi.probeConnection, {
      url: props.apiForm.url,
      method: props.apiForm.method,
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
</script>

<template>
  <!-- File form -->
  <div v-if="sourceType === 'file'" class="flex flex-col gap-5 py-2">
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

      <div v-if="!fileObj" class="flex flex-col items-center gap-3 py-10 px-6 text-center pointer-events-none">
        <svg class="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <div>
          <p class="text-sm font-semibold text-slate-600">Glisser un fichier ici</p>
          <p class="text-xs text-slate-400 mt-1">ou cliquer pour parcourir — CSV, XLSX, JSON, Parquet</p>
        </div>
      </div>

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
          @click.stop="emit('update:fileObj', null); emit('update:fileName', '')"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
        Nom de la source <span class="font-normal normal-case text-slate-400">(optionnel)</span>
      </label>
      <input
        :value="fileName"
        type="text"
        class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
        placeholder="ex : Inflation 2026"
        @input="emit('update:fileName', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>

  <!-- API form -->
  <div v-else-if="sourceType === 'api'" class="flex flex-col gap-4 py-2">
    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nom <span class="text-red-400">*</span></label>
      <input
        :value="apiForm.name"
        type="text"
        class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
        placeholder="ex : API météo OpenWeather"
        @input="updateApiForm({ name: ($event.target as HTMLInputElement).value })"
      />
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">URL <span class="text-red-400">*</span></label>
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
          class="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all font-mono"
          placeholder="https://api.example.com/data"
          @input="updateApiForm({ url: ($event.target as HTMLInputElement).value })"
        />
      </div>
    </div>

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
          @click="updateApiForm({ authType: opt.v as AuthType })"
        >
          {{ opt.l }}
        </button>
      </div>

      <div v-if="apiForm.authType === 'api_key'" class="mt-3 flex gap-2">
        <input
          :value="apiForm.apiKeyHeader"
          type="text"
          class="w-32 shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
          placeholder="X-API-Key"
          @input="updateApiForm({ apiKeyHeader: ($event.target as HTMLInputElement).value })"
        />
        <input
          :value="apiForm.apiKeyValue"
          type="password"
          class="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
          placeholder="Valeur de la clé"
          @input="updateApiForm({ apiKeyValue: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div v-if="apiForm.authType === 'bearer'" class="mt-3">
        <input
          :value="apiForm.bearerToken"
          type="password"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
          placeholder="Token d'accès"
          @input="updateApiForm({ bearerToken: ($event.target as HTMLInputElement).value })"
        />
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
        Chemin des données <span class="font-normal normal-case text-slate-400">(optionnel)</span>
      </label>
      <input
        :value="apiForm.dataPath"
        type="text"
        class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
        placeholder="ex : data.results ou items"
        @input="updateApiForm({ dataPath: ($event.target as HTMLInputElement).value })"
      />
      <p class="text-[11px] text-slate-400 mt-1">Laissez vide si l'API renvoie directement un tableau.</p>
    </div>

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
</template>
