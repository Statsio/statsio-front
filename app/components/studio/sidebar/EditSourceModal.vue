<script setup lang="ts">
import { ref } from 'vue'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { updateDataSource, refreshDataSource, type DataSourceDetail } from '@/api/data-sources'
import AppStepModal from '@/components/ui/AppStepModal.vue'
import { useEditSourceWizard, EDIT_SOURCE_WIZARD_STEPS } from '@/composables/useEditSourceWizard'
import StepSourceConfigure from './add-source-steps/StepSourceConfigure.vue'
import StepProvenance from './add-source-steps/StepProvenance.vue'
import StepVisibility from './add-source-steps/StepVisibility.vue'

const props = defineProps<{ source: DataSourceDetail }>()
const emit = defineEmits<{ close: [] }>()
const datasets = useStudioDatasetsStore()

const {
  sourceType, name, newFileObj, sheetName, headerRow, excludedRows, apiForm, existingFileLabel,
  provenanceId, provenanceOtherLabel,
  visibility, categories,
  currentStepId, canGoNext,
  buildPayload,
} = useEditSourceWizard(props.source)

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
  <AppStepModal
    :open="true"
    title="Modifier la source"
    :steps="EDIT_SOURCE_WIZARD_STEPS"
    v-model:current-step-id="currentStepId"
    :can-go-next="canGoNext"
    :loading="submitting"
    size="md"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <template #default="{ step }">
      <p v-if="submitStatus === 'error'" class="mb-3 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">
        {{ errorMessage }}
      </p>
      <div v-if="submitStatus === 'success'" class="mb-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-600 font-semibold">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        Source mise à jour
        <template v-if="newFileObj || sourceType === 'api'"> — traitement en cours</template>
      </div>
      <p v-if="refreshMessage" class="mb-3 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-600">
        {{ refreshMessage }}
      </p>

      <StepSourceConfigure
        v-if="step?.id === 'configure'"
        :source-type="sourceType"
        :file-obj="newFileObj"
        :file-name="name"
        :sheet-name="sheetName"
        :header-row="headerRow"
        :excluded-rows="excludedRows"
        :existing-file-label="existingFileLabel"
        :api-form="apiForm"
        :is-editing-api="sourceType === 'api'"
        :last-refreshed-at="lastRefreshedAt"
        :next-refresh-at="nextRefreshAt"
        :refreshing="refreshing"
        :is-partial="props.source.isPartial"
        :partial-reason="props.source.partialReason"
        @refresh-now="handleRefreshNow"
        @update:file-obj="newFileObj = $event"
        @update:file-name="name = $event"
        @update:sheet-name="sheetName = $event"
        @update:header-row="headerRow = $event"
        @update:excluded-rows="excludedRows = $event"
        @update:api-form="apiForm = $event"
      />
      <StepProvenance
        v-else-if="step?.id === 'provenance'"
        v-model="provenanceId"
        :other-label="provenanceOtherLabel"
        @update:other-label="provenanceOtherLabel = $event"
      />
      <StepVisibility
        v-else-if="step?.id === 'visibility'"
        :visibility="visibility"
        :categories="categories"
        @update:visibility="visibility = $event"
        @update:categories="categories = $event"
      />
    </template>
  </AppStepModal>
</template>
