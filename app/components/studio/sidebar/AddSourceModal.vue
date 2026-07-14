<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useStudioStore } from '@/stores/studio'
import AppStepModal from '@/components/ui/AppStepModal.vue'
import { useAddSourceWizard, ADD_SOURCE_WIZARD_STEPS } from '@/composables/useAddSourceWizard'
import { createApiDataSource, type QueryMapping } from '@/api/data-sources'
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
    } else if (sourceType.value === 'api') {
      isLive = await submitApi()
    }
    submitStatus.value = 'success'
    await datasets.loadDatasets()
    // Pour une source live, on laisse le temps de relire le mapping détecté avant de fermer.
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
      <div v-if="submitStatus === 'success'" class="mb-3 flex flex-col gap-3">
        <div class="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-600 font-semibold">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <template v-if="detectedQueryMapping">Source en direct créée</template>
          <template v-else>Source ajoutée — traitement en cours</template>
        </div>

        <div v-if="detectedQueryMapping" class="rounded-xl border border-slate-200 p-3">
          <p class="text-xs font-semibold text-slate-600 mb-2">Filtres détectés automatiquement</p>
          <table v-if="Object.keys(detectedQueryMapping.filters).length" class="w-full text-xs">
            <thead>
              <tr class="text-left text-slate-400">
                <th class="font-medium pb-1">Colonne</th>
                <th class="font-medium pb-1">Paramètre upstream</th>
                <th class="font-medium pb-1">Opérateurs</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(f, col) in detectedQueryMapping.filters" :key="col" class="border-t border-slate-100">
                <td class="py-1 font-mono text-slate-700">{{ col }}</td>
                <td class="py-1 font-mono text-slate-500">
                  {{ f.param ?? `${f.range?.gteParam} / ${f.range?.lteParam}` }}
                </td>
                <td class="py-1 text-slate-500">{{ f.operators.join(', ') }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-xs text-slate-400">
            Aucun filtre n'a pu être détecté automatiquement — modifiez la source pour en déclarer manuellement.
          </p>
          <p class="text-[11px] text-slate-400 mt-2">
            Vous pouvez corriger ce mapping à tout moment depuis "Modifier la source".
          </p>
        </div>
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
