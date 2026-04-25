<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { StudioDataSource } from '@/types/studio-data-source'
import type { StatsDataNormalizationMapping, StatsDataFieldMapping } from '@/types/statsdata-query'
import { suggestStatsDataSourceNormalizationMapping } from '@/api/statsdata-sources'
import { parseStatsDataNormalizationMapping } from '@/lib/statsdata-source-mapper'
import type { StatsDataMappingSuggestionField } from '@/types/statsdata-mapping-suggestions'

const props = defineProps<{
  source: StudioDataSource
  documentId: string
  busy?: boolean
}>()

const emit = defineEmits<{
  apply: [mapping: StatsDataNormalizationMapping | null]
}>()

type Mode = 'auto' | 'visuel' | 'json'
const mode = ref<Mode>('auto')

const loadingSuggest = ref(false)
const suggestError = ref<string | null>(null)
const suggested = ref<StatsDataNormalizationMapping | null>(null)
const fields = ref<StatsDataMappingSuggestionField[]>([])
const rowPathOptions = ref<string[]>([])

const mappingJsonError = ref<string | null>(null)
const mappingDraft = ref('')

const selectedRowPath = ref<string>('') // '' = root
const pickedKeys = ref<Record<string, boolean>>({})
const pickedValues = ref<Record<string, boolean>>({})
const customNames = ref<Record<string, string>>({})

const canSuggest = computed(() => props.source.kind !== 'manual') // manual already structured grid

const rowPathSelectOptions = computed(() => [
  { value: '', label: '(racine)' },
  ...rowPathOptions.value.map((p) => ({ value: p, label: p })),
])

const resetFromSource = () => {
  const cur = props.source.normalizationMapping ?? { keyFields: [], valueFields: [] }
  mappingDraft.value = JSON.stringify(cur, null, 2)

  suggested.value = props.source.normalizationMapping ?? null
  fields.value = []
  rowPathOptions.value = []
  suggestError.value = null
  mappingJsonError.value = null

  selectedRowPath.value = (props.source.normalizationMapping?.rowPath ?? '') as string
  pickedKeys.value = {}
  pickedValues.value = {}
  customNames.value = {}
}

watch(
  () => props.source.id,
  () => resetFromSource(),
  { immediate: true },
)

const runSuggest = async () => {
  if (!canSuggest.value || props.busy) return
  loadingSuggest.value = true
  suggestError.value = null
  try {
    const res = await suggestStatsDataSourceNormalizationMapping(props.documentId, props.source.id)
    suggested.value = res.suggestedMapping
    fields.value = res.fields
    rowPathOptions.value = res.rowPathOptions ?? []

    selectedRowPath.value = res.suggestedMapping.rowPath ?? ''
    pickedKeys.value = {}
    pickedValues.value = {}
    customNames.value = {}

    for (const f of res.suggestedMapping.keyFields ?? []) {
      const p = (f.from ?? f.name).trim()
      if (p) pickedKeys.value[p] = true
      if (f.name) customNames.value[p] = f.name
    }
    for (const f of res.suggestedMapping.valueFields ?? []) {
      const p = (f.from ?? f.name).trim()
      if (p) pickedValues.value[p] = true
      if (f.name && !customNames.value[p]) customNames.value[p] = f.name
    }

    mappingDraft.value = JSON.stringify(res.suggestedMapping, null, 2)
    mode.value = 'visuel'
  } catch (e) {
    suggestError.value = 'Impossible de générer des suggestions.'
  } finally {
    loadingSuggest.value = false
  }
}

const toFieldDef = (path: string): StatsDataFieldMapping | null => {
  const p = path.trim()
  if (!p) return null
  const parts = p.split('.')
  const last = parts.length ? parts[parts.length - 1] : p
  const name = (customNames.value[p] ?? last ?? p).trim()
  if (!name) return null
  const from = p === name ? undefined : p
  return from ? { name, from } : { name }
}

const buildMappingFromVisual = (): StatsDataNormalizationMapping => {
  const keyPaths = Object.entries(pickedKeys.value)
    .filter(([, on]) => on)
    .map(([p]) => p)
  const valuePaths = Object.entries(pickedValues.value)
    .filter(([, on]) => on)
    .map(([p]) => p)

  const keyFields = keyPaths.map(toFieldDef).filter((x): x is StatsDataFieldMapping => x !== null)
  const valueFields = valuePaths.map(toFieldDef).filter((x): x is StatsDataFieldMapping => x !== null)

  const rowPath = selectedRowPath.value.trim()
  return {
    ...(rowPath ? { rowPath } : {}),
    keyFields,
    valueFields,
  }
}

const applyVisual = () => {
  const m = buildMappingFromVisual()
  mappingDraft.value = JSON.stringify(m, null, 2)
  emit('apply', m)
}

const applyJson = () => {
  mappingJsonError.value = null
  try {
    const raw = JSON.parse(mappingDraft.value) as unknown
    const parsed = parseStatsDataNormalizationMapping(raw)
    if (parsed === null) {
      emit('apply', null)
      return
    }
    emit('apply', parsed)
  } catch {
    mappingJsonError.value = 'JSON invalide ou mapping non conforme (keyFields / valueFields).'
  }
}
</script>

<template>
  <div class="space-y-2 rounded-xl border border-primary/20 bg-violet-50/40 px-2.5 py-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap gap-1">
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-[11px] font-semibold"
          :class="mode === 'auto' ? 'bg-primary text-white' : 'text-slate-700 hover:bg-white/70'"
          @click="mode = 'auto'"
        >
          Auto
        </button>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-[11px] font-semibold"
          :class="mode === 'visuel' ? 'bg-primary text-white' : 'text-slate-700 hover:bg-white/70'"
          @click="mode = 'visuel'"
        >
          Visuel
        </button>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-[11px] font-semibold"
          :class="mode === 'json' ? 'bg-primary text-white' : 'text-slate-700 hover:bg-white/70'"
          @click="mode = 'json'"
        >
          JSON
        </button>
      </div>

      <AppButton
        v-if="mode !== 'json'"
        variant="secondary"
        size="sm"
        type="button"
        :disabled="busy || loadingSuggest || !canSuggest"
        @click="runSuggest"
      >
        {{ loadingSuggest ? 'Analyse…' : 'Auto-configurer' }}
      </AppButton>
    </div>

    <p v-if="!canSuggest" class="text-[11px] leading-snug text-slate-600">
      Suggestions automatiques indisponibles pour une grille manuelle (utilise plutôt la sélection visuelle ou le JSON).
    </p>
    <p v-if="suggestError" class="text-[11px] text-rose-700">{{ suggestError }}</p>

    <div v-if="mode === 'auto'" class="space-y-2">
      <p class="text-[11px] leading-snug text-slate-600">
        Clique sur <span class="font-semibold">Auto-configurer</span> pour détecter les champs (clés/valeurs) et proposer un mapping.
        Tu pourras ensuite ajuster dans l’onglet <span class="font-semibold">Visuel</span>.
      </p>
      <div v-if="suggested" class="rounded-xl border border-slate-200 bg-white/70 px-2.5 py-2">
        <p class="mb-1 text-[11px] font-semibold text-slate-700">Dernière suggestion</p>
        <pre class="whitespace-pre-wrap break-words font-mono text-[10px] text-slate-700">{{ JSON.stringify(suggested, null, 2) }}</pre>
      </div>
    </div>

    <div v-else-if="mode === 'visuel'" class="space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <label class="text-[11px] font-semibold text-slate-700" for="row-path">rowPath</label>
        <AppSelect
          id="row-path"
          v-model="selectedRowPath"
          :options="rowPathSelectOptions"
          size="sm"
          button-class="min-h-0 rounded-lg bg-white px-2 py-1 text-[11px] text-slate-800 focus:ring-2 focus:ring-primary/20"
          panel-class="mt-1"
          aria-label="rowPath"
        />
        <span class="text-[10px] text-slate-500">Astuce : si ton API renvoie `{ data: [...] }`, choisis `data`.</span>
      </div>

      <div v-if="fields.length === 0" class="rounded-xl border border-slate-200 bg-white/70 px-2.5 py-2 text-[11px] text-slate-600">
        Aucune liste de champs pour l’instant. Utilise <span class="font-semibold">Auto-configurer</span> ou passe en JSON.
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white/70">
        <div class="grid grid-cols-[1fr_auto_auto] gap-x-2 border-b border-slate-100 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <span>Champ</span>
          <span>Clé</span>
          <span>Valeur</span>
        </div>
        <div class="max-h-[260px] overflow-auto">
          <div
            v-for="f in fields"
            :key="f.path"
            class="grid grid-cols-[1fr_auto_auto] items-start gap-x-2 border-b border-slate-100 px-2.5 py-2"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <code class="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-800">{{ f.path }}</code>
                <span class="text-[10px] font-semibold text-slate-500">{{ f.kind }}</span>
              </div>
              <input
                v-model="customNames[f.path]"
                type="text"
                class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800"
                :placeholder="`Nom (défaut: ${f.path.split('.')[f.path.split('.').length - 1]})`"
              />
              <p v-if="f.examples?.length" class="mt-1 text-[10px] text-slate-500">
                Ex: {{ f.examples.join(' · ') }}
              </p>
            </div>
            <label class="flex items-center justify-center">
              <input v-model="pickedKeys[f.path]" type="checkbox" class="h-4 w-4" />
            </label>
            <label class="flex items-center justify-center">
              <input v-model="pickedValues[f.path]" type="checkbox" class="h-4 w-4" />
            </label>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <AppButton variant="primary" size="sm" type="button" :disabled="busy" @click="applyVisual">
          Appliquer ce mapping
        </AppButton>
        <AppButton
          variant="ghost"
          size="sm"
          type="button"
          class="text-slate-700"
          :disabled="busy"
          @click="
            mappingDraft = JSON.stringify(buildMappingFromVisual(), null, 2);
            mode = 'json'
          "
        >
          Voir en JSON
        </AppButton>
      </div>
    </div>

    <div v-else class="space-y-2">
      <label class="block text-[11px] font-semibold text-slate-700" for="map-json">normalizationMapping (JSON)</label>
      <p class="text-[10px] leading-snug text-slate-500">
        Tu peux garder ce mode en “dernier recours”. Le visuel remplit ce JSON automatiquement.
      </p>
      <textarea
        id="map-json"
        v-model="mappingDraft"
        rows="8"
        class="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 font-mono text-[11px] text-slate-800 outline-none focus:border-primary/40"
        spellcheck="false"
      />
      <p v-if="mappingJsonError" class="text-[11px] text-rose-700">{{ mappingJsonError }}</p>
      <AppButton variant="primary" size="sm" type="button" :disabled="busy" @click="applyJson">
        Enregistrer le mapping
      </AppButton>
    </div>
  </div>
</template>

