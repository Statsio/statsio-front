<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  createEmptyManualSource,
  createMockApiSource,
} from '@/data/studio-mock-data-sources'
import AppButton from '@/components/ui/AppButton.vue'
import {
  normalizationMappingJsonLooksPopulatedButUnparsed,
  parseStatsDataNormalizationMapping,
} from '@/lib/statsdata-source-mapper'
import type { StudioDataSource, StudioDataSourceApi, StudioDataSourceManual } from '@/types/studio-data-source'
import type { StatsDataNormalizationMapping } from '@/types/statsdata-query'
import type { SourcesFeedback } from '@/composables/useStudioDocument'
import StudioManualSourceGrid from '@/components/studio/StudioManualSourceGrid.vue'
import StudioNormalizationMappingEditor from '@/components/studio/StudioNormalizationMappingEditor.vue'

const props = defineProps<{
  dataSources: StudioDataSource[]
  /** Identifiant document StatsData (null en création ou sans API). */
  documentId: string | null
  /** Utilise les endpoints `/statsdata/.../sources` + retours serveur. */
  remoteEnabled: boolean
  sourcesBusy?: boolean
  feedback: SourcesFeedback | null
  /** PATCH minimal `normalizationMapping` (StatsData). Si absent en mode distant, « Enregistrer le mapping » retombe sur `sync-source`. */
  persistSourceNormalization?: (
    sourceId: string,
    mapping: StatsDataNormalizationMapping | null,
  ) => Promise<void>
}>()

const emit = defineEmits<{
  'update-source': [StudioDataSource]
  'add-source': [StudioDataSource]
  'remove-source': [id: string]
  'sync-source': [StudioDataSource]
  'probe-api': [StudioDataSourceApi]
  'upload-file': [file: File]
  'dismiss-feedback': []
  'refresh-normalized': [sourceId: string]
}>()

const expandedId = ref<string | null>(null)
const mappingOpenId = ref<string | null>(null)
const mappingDraft = ref('')
const mappingJsonError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

watch(mappingOpenId, (id) => {
  mappingJsonError.value = null
  if (!id) return
  const s = props.dataSources.find((x) => x.id === id)
  mappingDraft.value = JSON.stringify(
    s?.normalizationMapping ?? { keyFields: [], valueFields: [] },
    null,
    2,
  )
})

const applyMappingJson = async (src: StudioDataSource) => {
  mappingJsonError.value = null
  let parsed: StatsDataNormalizationMapping | null
  let raw: unknown
  try {
    raw = JSON.parse(mappingDraft.value) as unknown
    parsed = parseStatsDataNormalizationMapping(raw)
  } catch {
    mappingJsonError.value = 'JSON invalide ou mapping non conforme (keyFields / valueFields).'
    return
  }
  if (parsed === null && normalizationMappingJsonLooksPopulatedButUnparsed(raw)) {
    mappingJsonError.value =
      'Aucun champ valide : chaque entrée doit être une chaîne (ex. "TIME_PERIOD") ou un objet { "name": "...", "from": "..." } (from optionnel).'
    return
  }
  const next = { ...src, normalizationMapping: parsed }
  emit('update-source', next)
  if (props.remoteEnabled && props.documentId) {
    if (props.persistSourceNormalization) {
      try {
        await props.persistSourceNormalization(src.id, parsed)
      } catch {
        return
      }
    } else {
      emit('sync-source', next)
    }
  }
  mappingOpenId.value = null
}

const applyMapping = async (src: StudioDataSource, mapping: StatsDataNormalizationMapping | null) => {
  const next = { ...src, normalizationMapping: mapping }
  emit('update-source', next)
  if (props.remoteEnabled && props.documentId) {
    if (props.persistSourceNormalization) {
      await props.persistSourceNormalization(src.id, mapping)
    } else {
      emit('sync-source', next)
    }
  }
}

const kindLabel: Record<StudioDataSource['kind'], string> = {
  manual: 'Manuel',
  file: 'Fichier',
  api: 'API',
}

const onManualUpdate = (src: StudioDataSourceManual) => {
  emit('update-source', src)
  if (props.remoteEnabled && props.documentId) emit('sync-source', src)
}

const patchApiField = (src: StudioDataSourceApi, patch: Partial<StudioDataSourceApi>) => {
  emit('update-source', { ...src, ...patch })
}

const saveApiNow = (src: StudioDataSourceApi) => {
  emit('sync-source', src)
}

const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) emit('upload-file', file)
}

const onSourceNameCommit = (src: StudioDataSource, el: HTMLInputElement) => {
  const next = { ...src, name: el.value }
  emit('update-source', next)
  if (props.remoteEnabled && props.documentId) emit('sync-source', next)
}
</script>

<template>
  <section aria-labelledby="studio-sources-heading" class="border-t border-slate-100 pt-6">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 id="studio-sources-heading" class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        Sources de données
      </h2>
    </div>

    <div
      v-if="feedback"
      class="mb-3 rounded-2xl border px-3 py-2 text-xs leading-snug"
      :class="
        feedback.kind === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-rose-200 bg-rose-50 text-rose-900'
      "
      role="status"
    >
      <div class="flex items-start justify-between gap-2">
        <span>{{ feedback.text }}</span>
        <button
          type="button"
          class="shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] font-semibold opacity-70 hover:opacity-100"
          @click="emit('dismiss-feedback')"
        >
          Fermer
        </button>
      </div>
    </div>

    <p v-if="remoteEnabled && !documentId" class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      Enregistrez le document une première fois pour activer les sources sur le serveur.
    </p>
    <div v-else-if="remoteEnabled" class="mb-4 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
      <p class="font-semibold text-slate-800">Étapes conseillées</p>
      <ol class="mt-1 list-decimal space-y-0.5 pl-4">
        <li>Ajoute une source (grille, fichier, API)</li>
        <li>Définis le mapping de normalisation</li>
        <li>Clique sur « Actualiser les données » (snapshot)</li>
        <li>Construit tes blocs (tableaux / graphiques)</li>
      </ol>
    </div>
    <p v-else class="mb-4 text-xs leading-relaxed text-slate-500">Sources locales (hors StatsData API).</p>

    <div class="mb-3 flex flex-wrap gap-2">
      <AppButton
        variant="secondary"
        size="sm"
        type="button"
        :disabled="sourcesBusy || (remoteEnabled && !documentId)"
        @click="emit('add-source', createEmptyManualSource())"
      >
        + Grille manuelle
      </AppButton>
      <AppButton
        variant="outline"
        size="sm"
        type="button"
        :disabled="sourcesBusy || (remoteEnabled && !documentId)"
        @click="fileInputRef?.click()"
      >
        + Importer un fichier
      </AppButton>
      <input
        ref="fileInputRef"
        type="file"
        class="sr-only"
        accept=".csv,.txt,text/csv"
        @change="onFileSelected"
      />
      <AppButton
        variant="outline"
        size="sm"
        type="button"
        :disabled="sourcesBusy || (remoteEnabled && !documentId)"
        @click="emit('add-source', createMockApiSource())"
      >
        + Connexion API
      </AppButton>
    </div>

    <ul class="flex flex-col gap-2">
      <li
        v-for="src in props.dataSources"
        :key="src.id"
        class="rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="w-full">
            <label class="sr-only" :for="`src-name-${src.id}`">Nom de la source</label>
            <input
              :id="`src-name-${src.id}`"
              :value="src.name"
              type="text"
              class="mb-1 w-full max-w-full rounded-xl border border-transparent bg-white/80 px-2 py-1 text-sm font-semibold text-slate-900 outline-none focus:border-slate-200 focus:ring-1 focus:ring-primary/20"
              @change="onSourceNameCommit(src, $event.target as HTMLInputElement)"
            />
            <p class="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">{{ kindLabel[src.kind] }}</p>
            <p v-if="src.kind === 'file'" class="mt-1 truncate text-xs text-slate-500">{{ src.fileName }} · {{ src.format }}</p>
            <p v-if="src.kind === 'api'" class="mt-1 truncate text-xs text-slate-500">{{ src.url }}</p>
            <div
              v-if="remoteEnabled && documentId"
              class="mt-2 rounded-xl border border-slate-200/90 bg-white/70 px-2.5 py-2 text-[11px] leading-snug text-slate-600"
            >
              <template v-if="src.lastSnapshot">
                <span
                  class="font-semibold"
                  :class="src.lastSnapshot.status === 'ok' ? 'text-emerald-700' : 'text-rose-700'"
                >
                  {{ src.lastSnapshot.status === 'ok' ? 'Snapshot OK' : 'Snapshot en échec' }}
                </span>
                <span v-if="typeof src.lastSnapshot.rowCount === 'number'"> · {{ src.lastSnapshot.rowCount }} ligne(s)</span>
                <span v-if="src.lastSnapshot.refreshedAt" class="text-slate-500"> · {{ src.lastSnapshot.refreshedAt }}</span>
                <p v-if="src.lastSnapshot.status === 'failed' && src.lastSnapshot.errorMessage" class="mt-1 text-rose-800">
                  {{ src.lastSnapshot.errorMessage }}
                </p>
              </template>
              <p v-else class="text-slate-500">Aucun snapshot — définissez un mapping puis actualisez.</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <AppButton
                  variant="secondary"
                  size="sm"
                  type="button"
                  :disabled="sourcesBusy"
                  @click="emit('refresh-normalized', src.id)"
                >
                  Actualiser les données
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="sm"
                  type="button"
                  class="text-slate-700"
                  @click="mappingOpenId = mappingOpenId === src.id ? null : src.id"
                >
                  {{ mappingOpenId === src.id ? 'Fermer le mapping' : 'Configurer le mapping' }}
                </AppButton>
              </div>
            </div>
            <div
              v-if="remoteEnabled && documentId && mappingOpenId === src.id"
              class="mt-2 space-y-2"
            >
              <StudioNormalizationMappingEditor
                :source="src"
                :document-id="documentId"
                :busy="sourcesBusy"
                @apply="applyMapping(src, $event)"
              />
              <p v-if="mappingJsonError" class="text-[11px] text-rose-700">{{ mappingJsonError }}</p>
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap gap-1">
            <AppButton
              v-if="src.kind === 'manual'"
              variant="ghost"
              size="sm"
              type="button"
              @click="expandedId = expandedId === src.id ? null : src.id"
            >
              {{ expandedId === src.id ? 'Fermer' : 'Éditer' }}
            </AppButton>
            <AppButton
              v-if="src.kind === 'api'"
              variant="ghost"
              size="sm"
              type="button"
              @click="expandedId = expandedId === src.id ? null : src.id"
            >
              {{ expandedId === src.id ? 'Fermer' : 'Réglages API' }}
            </AppButton>
            <AppButton
              variant="ghost"
              size="sm"
              type="button"
              class="text-rose-600"
              :disabled="sourcesBusy"
              @click="emit('remove-source', src.id)"
            >
              Retirer
            </AppButton>
          </div>
        </div>

        <div v-if="src.kind === 'manual' && expandedId === src.id" class="mt-3 border-t border-slate-200 pt-3">
          <StudioManualSourceGrid :source="src" @update="onManualUpdate($event)" />
        </div>

        <div v-if="src.kind === 'api' && expandedId === src.id" class="mt-3 space-y-3 border-t border-slate-200 pt-3">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`api-url-${src.id}`">URL de l’API</label>
            <input
              :id="`api-url-${src.id}`"
              :value="src.url"
              type="url"
              autocomplete="off"
              class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              @input="patchApiField(src, { url: ($event.target as HTMLInputElement).value })"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`api-key-${src.id}`">Clé / token (optionnel)</label>
            <input
              :id="`api-key-${src.id}`"
              :value="src.apiKeyPreview"
              type="password"
              autocomplete="off"
              class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              :placeholder="
                src.hasStoredApiKey && !src.apiKeyPreview
                  ? 'Clé enregistrée côté serveur (non renvoyée) — saisir pour remplacer'
                  : 'Clé ou token (optionnel)'
              "
              @input="patchApiField(src, { apiKeyPreview: ($event.target as HTMLInputElement).value })"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`api-limit-${src.id}`"
              >Limit (optionnel)</label
            >
            <input
              :id="`api-limit-${src.id}`"
              :value="src.apiLimit ?? ''"
              type="number"
              min="1"
              placeholder="ex. 100"
              class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              @input="
                patchApiField(src, {
                  apiLimit: (() => {
                    const raw = ($event.target as HTMLInputElement).value.trim()
                    if (!raw) return null
                    const n = Number(raw)
                    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
                  })(),
                })
              "
            />
            <p class="mt-1 text-[11px] leading-snug text-slate-500">
              Si l’URL ne contient pas déjà <code class="rounded bg-slate-100 px-0.5">limit=</code>, cette valeur sera ajoutée automatiquement côté serveur.
            </p>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`api-search-tpl-${src.id}`"
              >Recherche (template URL)</label
            >
            <input
              :id="`api-search-tpl-${src.id}`"
              :value="src.apiSearchTemplate ?? ''"
              type="text"
              autocomplete="off"
              placeholder="ex. https://geo.api.gouv.fr/communes?codePostal={q}"
              class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              @input="patchApiField(src, { apiSearchTemplate: ($event.target as HTMLInputElement).value })"
            />
            <p class="mt-1 text-[11px] leading-snug text-slate-500">
              Utilise <code class="rounded bg-slate-100 px-0.5">{q}</code> et <code class="rounded bg-slate-100 px-0.5">{f}</code>. Exemples :
              <code class="rounded bg-slate-100 px-0.5">...?codePostal={q}</code> ou
              <code class="rounded bg-slate-100 px-0.5">...?where={f}%3D{q}</code>.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton variant="secondary" size="sm" type="button" :disabled="sourcesBusy" @click="emit('probe-api', src)">
              Tester la connexion
            </AppButton>
            <AppButton variant="primary" size="sm" type="button" :disabled="sourcesBusy" @click="saveApiNow(src)">
              Enregistrer sur le serveur
            </AppButton>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
