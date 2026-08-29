<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useStudioStore } from '@/stores/studio'
import StudioWizardModal from '@/components/studio/ui/StudioWizardModal.vue'
import { useAddSourceWizard, ADD_SOURCE_WIZARD_STEPS } from '@/composables/useAddSourceWizard'
import { createApiDataSource, type QueryMapping } from '@/api/data-sources'
import StepSourceType from './add-source-steps/StepSourceType.vue'
import StepApiDetect from './add-source-steps/StepApiDetect.vue'
import StepSourceConfigure from './add-source-steps/StepSourceConfigure.vue'
import StepProvenance from './add-source-steps/StepProvenance.vue'
import StepVisibility from './add-source-steps/StepVisibility.vue'

const emit = defineEmits<{ close: [] }>()
const datasets = useStudioDatasetsStore()
const studio = useStudioStore()

const {
  sourceType, fileObj, fileName, sheetName, headerRow, excludedRows, apiForm,
  datagouvInput, datagouvName, applyDatagouvPreset,
  provenanceId, provenanceOtherLabel,
  visibility, categories,
  currentStepId, canGoNext,
  buildMetadataPayload, buildApiPayload,
} = useAddSourceWizard()

// Pré-coche les catégories de visibilité publique avec celles du contenu Studio ouvert.
categories.value = studio.content?.categories ?? []

const activeSteps = computed(() => {
  if (sourceType.value === 'catalog') return ADD_SOURCE_WIZARD_STEPS.slice(0, 1)
  // L'étape "Détection" ne concerne que les sources API (rien à détecter pour un fichier).
  if (sourceType.value === 'file') return ADD_SOURCE_WIZARD_STEPS.filter((s) => s.id !== 'detect')
  // data.gouv.fr : l'identifiant de ressource suffit — pas de détection ni de configuration manuelle.
  if (sourceType.value === 'datagouv') {
    return ADD_SOURCE_WIZARD_STEPS.filter((s) => s.id !== 'detect' && s.id !== 'configure')
  }
  return ADD_SOURCE_WIZARD_STEPS
})

const wizardSteps = computed(() =>
  activeSteps.value.map((s) => ({ key: s.id, label: s.title, hint: s.description })),
)

const currentIndex = computed(() => activeSteps.value.findIndex((s) => s.id === currentStepId.value))
const isLastStep = computed(() => currentIndex.value === activeSteps.value.length - 1)

function goto(key: string) {
  // On ne saute que vers une étape déjà visitée / adjacente (StudioWizardModal grise les suivantes).
  currentStepId.value = key
}
function back() {
  const prev = activeSteps.value[currentIndex.value - 1]
  if (prev) currentStepId.value = prev.id
}
function next() {
  if (!canGoNext.value || submitting.value) return
  // En quittant l'étape « Type » pour une source data.gouv.fr, on dérive la config API
  // (URL tabular-api, enveloppe, pagination) depuis l'identifiant de ressource saisi.
  if (currentStepId.value === 'type' && sourceType.value === 'datagouv') {
    applyDatagouvPreset()
  }
  if (isLastStep.value) {
    handleSubmit()
    return
  }
  const nextStep = activeSteps.value[currentIndex.value + 1]
  if (nextStep) currentStepId.value = nextStep.id
}

const wizardSummary = computed(() => {
  const parts: string[] = []
  const kind = { file: 'Fichier', api: 'API REST', catalog: 'Source publique', datagouv: 'data.gouv.fr' }[sourceType.value as string]
  if (kind) parts.push(kind)
  if (sourceType.value === 'file' && fileName.value) parts.push(fileName.value)
  if (sourceType.value === 'api' && apiForm.value?.url) parts.push(apiForm.value.url)
  if (sourceType.value === 'datagouv' && apiForm.value?.url) parts.push(apiForm.value.url)
  return parts.join(' · ') || 'Choisissez une provenance pour commencer.'
})

// ─── Soumission ──────────────────────────────────────────────────────────────

const submitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')
/** Mapping de filtres auto-détecté, affiché en relecture avant de fermer une source live nouvellement créée. */
const detectedQueryMapping = ref<QueryMapping | null>(null)

async function handleSubmit() {
  submitting.value = true
  submitStatus.value = 'idle'
  errorMessage.value = ''
  detectedQueryMapping.value = null

  try {
    let isLive = false
    if (sourceType.value === 'file') {
      await submitFile()
    } else if (sourceType.value === 'api' || sourceType.value === 'datagouv') {
      if (sourceType.value === 'datagouv') applyDatagouvPreset()
      isLive = await submitApi()
    }
    submitStatus.value = 'success'
    await datasets.loadDatasets()
    setTimeout(() => emit('close'), isLive ? 4000 : 800)
  } catch (e: unknown) {
    submitStatus.value = 'error'
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    errorMessage.value = msg ?? 'Une erreur est survenue. Vérifiez les champs et réessayez.'
  } finally {
    submitting.value = false
  }
}

async function submitFile() {
  const form = new FormData()
  form.append('file', fileObj.value!)
  if (fileName.value.trim()) form.append('name', fileName.value.trim())
  if (sheetName.value) form.append('sheet_name', sheetName.value)
  if (headerRow.value) form.append('header_row', String(headerRow.value))
  excludedRows.value.forEach((r) => form.append('excluded_rows[]', String(r)))

  const meta = buildMetadataPayload()
  form.append('visibility', meta.visibility)
  meta.categories.forEach((c) => form.append('categories[]', c))
  if (meta.provenance_id !== null) form.append('provenance_id', String(meta.provenance_id))
  if (meta.provenance_other_label) form.append('provenance_other_label', meta.provenance_other_label)

  await apiHttp.post(STATSIO_API.dataSources.upload, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** @returns true si la source créée est en direct (live). */
async function submitApi(): Promise<boolean> {
  const created = await createApiDataSource(buildApiPayload())
  if (created.materialization === 'live') {
    detectedQueryMapping.value = created.queryMapping
    return true
  }
  return false
}

async function handleAttached() {
  await datasets.loadDatasets()
  emit('close')
}
</script>

<template>
  <StudioWizardModal
    title="Ajouter une source"
    rail-title="Ajouter une source"
    rail-blurb="Les colonnes détectées alimentent tous les blocs de données et les variables."
    :steps="wizardSteps"
    :current="currentStepId"
    :summary="wizardSummary"
    :next-label="isLastStep ? 'Connecter la source' : 'Suivant'"
    :next-disabled="!canGoNext"
    :next-loading="submitting"
    @close="emit('close')"
    @back="back"
    @next="next"
    @go="goto"
  >
    <p v-if="submitStatus === 'error'" class="mb-3 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">
      {{ errorMessage }}
    </p>

    <div v-if="submitStatus === 'success'" class="mb-4 flex flex-col gap-3">
      <div class="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
        <span>✓</span>
        <template v-if="detectedQueryMapping">Source en direct créée</template>
        <template v-else>Source ajoutée — traitement en cours</template>
      </div>

      <div v-if="detectedQueryMapping" class="rounded-xl border border-[var(--studio-line)] p-3.5">
        <p class="mb-2 text-xs font-semibold text-[var(--studio-muted)]">Filtres détectés automatiquement</p>
        <table v-if="Object.keys(detectedQueryMapping.filters).length" class="w-full text-xs">
          <thead>
            <tr class="text-left text-[var(--studio-faint)]">
              <th class="pb-1 font-medium">Colonne</th>
              <th class="pb-1 font-medium">Paramètre upstream</th>
              <th class="pb-1 font-medium">Opérateurs</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(f, col) in detectedQueryMapping.filters" :key="col" class="border-t border-[var(--studio-line)]">
              <td class="py-1 font-mono text-[var(--studio-ink)]">{{ col }}</td>
              <td class="py-1 font-mono text-[var(--studio-muted)]">
                {{ f.param ?? `${f.range?.gteParam} / ${f.range?.lteParam}` }}
              </td>
              <td class="py-1 text-[var(--studio-muted)]">{{ f.operators.join(', ') }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-xs text-[var(--studio-faint)]">
          Aucun filtre n'a pu être détecté automatiquement — modifiez la source pour en déclarer manuellement.
        </p>
        <p class="mt-2 text-[11px] text-[var(--studio-faint)]">
          Vous pouvez corriger ce mapping à tout moment depuis « Modifier la source ».
        </p>
      </div>
    </div>

    <StepSourceType
      v-if="currentStepId === 'type'"
      v-model="sourceType"
      :datagouv-input="datagouvInput"
      :datagouv-name="datagouvName"
      @update:datagouv-input="datagouvInput = $event"
      @update:datagouv-name="datagouvName = $event"
      @attached="handleAttached"
    />
    <StepApiDetect
      v-else-if="currentStepId === 'detect'"
      :api-form="apiForm"
      @update:api-form="apiForm = $event"
      @advance="currentStepId = 'configure'"
    />
    <StepSourceConfigure
      v-else-if="currentStepId === 'configure'"
      :source-type="sourceType"
      :file-obj="fileObj"
      :file-name="fileName"
      :sheet-name="sheetName"
      :header-row="headerRow"
      :excluded-rows="excludedRows"
      :api-form="apiForm"
      @update:file-obj="fileObj = $event"
      @update:file-name="fileName = $event"
      @update:sheet-name="sheetName = $event"
      @update:header-row="headerRow = $event"
      @update:excluded-rows="excludedRows = $event"
      @update:api-form="apiForm = $event"
    />
    <StepProvenance
      v-else-if="currentStepId === 'provenance'"
      v-model="provenanceId"
      :other-label="provenanceOtherLabel"
      :preselect-slug="sourceType === 'datagouv' ? 'gouvernemental' : undefined"
      @update:other-label="provenanceOtherLabel = $event"
    />
    <StepVisibility
      v-else-if="currentStepId === 'visibility'"
      :visibility="visibility"
      :categories="categories"
      @update:visibility="visibility = $event"
      @update:categories="categories = $event"
    />
  </StudioWizardModal>
</template>
