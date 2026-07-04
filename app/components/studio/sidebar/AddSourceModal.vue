<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useStudioStore } from '@/stores/studio'
import AppStepModal from '@/components/ui/AppStepModal.vue'
import { useAddSourceWizard, ADD_SOURCE_WIZARD_STEPS } from '@/composables/useAddSourceWizard'
import StepSourceType from './add-source-steps/StepSourceType.vue'
import StepSourceConfigure from './add-source-steps/StepSourceConfigure.vue'
import StepProvenance from './add-source-steps/StepProvenance.vue'
import StepVisibility from './add-source-steps/StepVisibility.vue'

const emit = defineEmits<{ close: [] }>()
const datasets = useStudioDatasetsStore()
const studio = useStudioStore()

const {
  sourceType, fileObj, fileName, apiForm,
  provenanceId, provenanceOtherLabel,
  visibility, categories,
  currentStepId, canGoNext,
  buildMetadataPayload, buildApiPayload,
} = useAddSourceWizard()

// Pré-coche les catégories de visibilité publique avec celles du contenu Studio ouvert.
categories.value = studio.content?.categories ?? []

const activeSteps = computed(() =>
  sourceType.value === 'catalog' ? ADD_SOURCE_WIZARD_STEPS.slice(0, 1) : ADD_SOURCE_WIZARD_STEPS,
)

const submitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')

async function handleSubmit() {
  submitting.value = true
  submitStatus.value = 'idle'
  errorMessage.value = ''

  try {
    if (sourceType.value === 'file') {
      await submitFile()
    } else if (sourceType.value === 'api') {
      await submitApi()
    }
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

async function submitFile() {
  const form = new FormData()
  form.append('file', fileObj.value!)
  if (fileName.value.trim()) form.append('name', fileName.value.trim())

  const meta = buildMetadataPayload()
  form.append('visibility', meta.visibility)
  meta.categories.forEach((c) => form.append('categories[]', c))
  if (meta.provenance_id !== null) form.append('provenance_id', String(meta.provenance_id))
  if (meta.provenance_other_label) form.append('provenance_other_label', meta.provenance_other_label)

  await apiHttp.post(STATSIO_API.dataSources.upload, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

async function submitApi() {
  await apiHttp.post(STATSIO_API.apiSources.collection, buildApiPayload())
}

async function handleAttached() {
  await datasets.loadDatasets()
  emit('close')
}
</script>

<template>
  <AppStepModal
    :open="true"
    title="Ajouter une source"
    :steps="activeSteps"
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
        Source ajoutée — traitement en cours
      </div>

      <StepSourceType
        v-if="step.id === 'type'"
        v-model="sourceType"
        @attached="handleAttached"
      />
      <StepSourceConfigure
        v-else-if="step.id === 'configure'"
        :source-type="sourceType"
        :file-obj="fileObj"
        :file-name="fileName"
        :api-form="apiForm"
        @update:file-obj="fileObj = $event"
        @update:file-name="fileName = $event"
        @update:api-form="apiForm = $event"
      />
      <StepProvenance
        v-else-if="step.id === 'provenance'"
        v-model="provenanceId"
        :other-label="provenanceOtherLabel"
        @update:other-label="provenanceOtherLabel = $event"
      />
      <StepVisibility
        v-else-if="step.id === 'visibility'"
        :visibility="visibility"
        :categories="categories"
        @update:visibility="visibility = $event"
        @update:categories="categories = $event"
      />
    </template>
  </AppStepModal>
</template>
