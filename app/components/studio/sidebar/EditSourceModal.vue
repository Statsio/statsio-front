<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { updateDataSource, refreshDataSource, type DataSourceDetail } from '@/api/data-sources'
import StudioWizardModal from '@/components/studio/ui/StudioWizardModal.vue'
import { useEditSourceWizard, EDIT_SOURCE_WIZARD_STEPS } from '@/composables/useEditSourceWizard'
import StepSourceConfigure from './add-source-steps/StepSourceConfigure.vue'
import StepSynchronisation from './add-source-steps/StepSynchronisation.vue'
import StepProvenance from './add-source-steps/StepProvenance.vue'
import StepVisibility from './add-source-steps/StepVisibility.vue'

const props = defineProps<{ source: DataSourceDetail }>()
const emit = defineEmits<{ close: [] }>()
const datasets = useStudioDatasetsStore()

const {
  sourceType, name, newFileObj, sheetName, headerRow, excludedRows, apiForm, existingFileLabel,
  queryMappingOverride, setFilterParam, setFilterRange, toggleSortableColumn, setSearchParam, setSortParam, setSortDirectionParam,
  provenanceId, provenanceOtherLabel,
  visibility, categories,
  currentStepId, canGoNext,
  buildPayload,
} = useEditSourceWizard(props.source)

// L'étape « Synchronisation » ne concerne que les sources API en mode snapshot
// (un fichier importé n'a pas d'origine à resynchroniser, une source live est toujours à jour).
const showSyncStep = computed(() => sourceType === 'api' && apiForm.value.materialization !== 'live')

const activeSteps = computed(() =>
  showSyncStep.value
    ? EDIT_SOURCE_WIZARD_STEPS
    : EDIT_SOURCE_WIZARD_STEPS.filter((s) => s.id !== 'synchronisation'),
)

const wizardSteps = computed(() =>
  activeSteps.value.map((s) => ({ key: s.id, label: s.title, hint: s.description })),
)
const currentIndex = computed(() => activeSteps.value.findIndex((s) => s.id === currentStepId.value))
const isLastStep = computed(() => currentIndex.value === activeSteps.value.length - 1)

function goto(key: string) {
  currentStepId.value = key
}
function back() {
  const prev = activeSteps.value[currentIndex.value - 1]
  if (prev) currentStepId.value = prev.id
}
function next() {
  if (!canGoNext.value || submitting.value) return
  if (isLastStep.value) {
    handleSubmit()
    return
  }
  const nextStep = activeSteps.value[currentIndex.value + 1]
  if (nextStep) currentStepId.value = nextStep.id
}

const wizardSummary = computed(() => {
  const parts: string[] = [sourceType === 'api' ? 'API REST' : 'Fichier']
  if (sourceType === 'api' && apiForm.value.url) parts.push(apiForm.value.url)
  else if (existingFileLabel) parts.push(existingFileLabel)
  return parts.join(' · ')
})

const submitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')

// ─── Actualisation immédiate (source API) ─────────────────────────────────────
const refreshing = ref(false)
const refreshMessage = ref('')
const lastRefreshedAt = ref(props.source.lastRefreshedAt)
const nextRefreshAt = ref(props.source.nextRefreshAt)

async function handleRefreshNow() {
  refreshing.value = true
  refreshMessage.value = ''
  try {
    const updated = await refreshDataSource(props.source.id)
    lastRefreshedAt.value = updated.lastRefreshedAt
    nextRefreshAt.value = updated.nextRefreshAt
    refreshMessage.value = 'Actualisation lancée — traitement en cours'
    await datasets.loadDatasets()
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    refreshMessage.value = msg ?? "Impossible d'actualiser cette source."
  } finally {
    refreshing.value = false
  }
}

async function handleSubmit() {
  submitting.value = true
  submitStatus.value = 'idle'
  errorMessage.value = ''

  try {
    await updateDataSource(props.source.id, buildPayload(), newFileObj.value)
    submitStatus.value = 'success'
    await datasets.loadDatasets()
    setTimeout(() => emit('close'), 800)
  } catch (e: unknown) {
    submitStatus.value = 'error'
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    errorMessage.value = msg ?? 'Une erreur est survenue. Vérifiez les champs et réessayez.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <StudioWizardModal
    title="Modifier la source"
    rail-title="Modifier la source"
    rail-blurb="Ajustez la connexion, la synchronisation, la provenance ou la visibilité."
    :steps="wizardSteps"
    :current="currentStepId"
    :summary="wizardSummary"
    :next-label="isLastStep ? 'Enregistrer' : 'Suivant'"
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
    <div v-if="submitStatus === 'success'" class="mb-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
      <span>✓</span>
      Source mise à jour
      <template v-if="newFileObj || sourceType === 'api'"> — traitement en cours</template>
    </div>
    <p v-if="refreshMessage" class="mb-3 rounded-xl bg-[var(--studio-note)] px-4 py-2 text-xs text-[var(--studio-muted)]">
      {{ refreshMessage }}
    </p>

    <StepSourceConfigure
      v-if="currentStepId === 'configure'"
      :source-type="sourceType"
      :file-obj="newFileObj"
      :file-name="name"
      :sheet-name="sheetName"
      :header-row="headerRow"
      :excluded-rows="excludedRows"
      :existing-file-label="existingFileLabel"
      :api-form="apiForm"
      :is-editing-api="sourceType === 'api'"
      :hide-refresh-frequency="showSyncStep"
      :last-refreshed-at="lastRefreshedAt"
      :next-refresh-at="nextRefreshAt"
      :refreshing="refreshing"
      :is-partial="props.source.isPartial"
      :partial-reason="props.source.partialReason"
      :query-mapping="queryMappingOverride"
      @refresh-now="handleRefreshNow"
      @update:file-obj="newFileObj = $event"
      @update:file-name="name = $event"
      @update:sheet-name="sheetName = $event"
      @update:header-row="headerRow = $event"
      @update:excluded-rows="excludedRows = $event"
      @update:api-form="apiForm = $event"
      @set-filter-param="setFilterParam"
      @set-filter-range="setFilterRange"
      @toggle-sortable-column="toggleSortableColumn"
      @set-search-param="setSearchParam"
      @set-sort-param="setSortParam"
      @set-sort-direction-param="setSortDirectionParam"
    />
    <StepSynchronisation
      v-else-if="currentStepId === 'synchronisation'"
      :model-value="apiForm.refreshFrequency"
      :last-refreshed-at="lastRefreshedAt"
      :next-refresh-at="nextRefreshAt"
      :refreshing="refreshing"
      @update:model-value="apiForm = { ...apiForm, refreshFrequency: $event }"
      @refresh-now="handleRefreshNow"
    />
    <StepProvenance
      v-else-if="currentStepId === 'provenance'"
      v-model="provenanceId"
      :other-label="provenanceOtherLabel"
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
