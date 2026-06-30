<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppStepModal from '@/components/ui/AppStepModal.vue'
import AppModal from '@/components/ui/AppModal.vue'
import StepTitle from '@/components/create/steps/StepTitle.vue'
import StepCategories from '@/components/create/steps/StepCategories.vue'
import StepCoverage from '@/components/create/steps/StepCoverage.vue'
import StepPublication from '@/components/create/steps/StepPublication.vue'
import StepSuccess from '@/components/create/steps/StepSuccess.vue'
import { useCreateContentWizard, CONTENT_WIZARD_STEPS } from '@/composables/useCreateContentWizard'
import { createStatsDataDocument } from '@/api/studio'
import type { StatsDataDocument } from '@/api/studio'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [boolean]
  close: []
}>()

const router = useRouter()
const submitting = ref(false)
const createdDoc = ref<StatsDataDocument | null>(null)

const {
  title, categories, coverageType, coverageValues,
  visibility, publishedAs, channelId,
  currentStepId, canGoNext,
  reset, buildPayload,
} = useCreateContentWizard()

watch(() => props.open, (v) => {
  if (!v) {
    setTimeout(reset, 300)
    createdDoc.value = null
  }
})

async function handleSubmit() {
  submitting.value = true
  try {
    createdDoc.value = await createStatsDataDocument(buildPayload())
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:open', false)
  emit('close')
}

const studioPath = () => createdDoc.value ? `/studio/${createdDoc.value.slug ?? createdDoc.value.id}` : '/studio'
</script>

<template>
  <!-- Success state -->
  <AppModal v-if="createdDoc" :open="open" title="StatsData créé" size="sm" @update:open="handleClose" @close="handleClose">
    <StepSuccess
      content-type-label="StatsData"
      :studio-path="studioPath()"
      @close="handleClose"
    />
  </AppModal>

  <!-- Wizard -->
  <AppStepModal
    v-else
    :open="open"
    title="Nouveau StatsData"
    :steps="CONTENT_WIZARD_STEPS"
    v-model:current-step-id="currentStepId"
    :can-go-next="canGoNext"
    :loading="submitting"
    size="md"
    @update:open="handleClose"
    @close="handleClose"
    @submit="handleSubmit"
  >
    <template #default="{ step }">
      <StepTitle
        v-if="step.id === 'title'"
        v-model="title"
        content-type-label="StatsData"
      />
      <StepCategories
        v-else-if="step.id === 'categories'"
        v-model="categories"
      />
      <StepCoverage
        v-else-if="step.id === 'coverage'"
        :coverage-type="coverageType"
        :coverage-values="coverageValues"
        @update:coverage-type="coverageType = $event"
        @update:coverage-values="coverageValues = $event"
      />
      <StepPublication
        v-else-if="step.id === 'publication'"
        :visibility="visibility"
        :published-as="publishedAs"
        :channel-id="channelId"
        @update:visibility="visibility = $event"
        @update:published-as="publishedAs = $event"
        @update:channel-id="channelId = $event"
      />
    </template>
  </AppStepModal>
</template>
