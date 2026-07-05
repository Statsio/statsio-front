<script setup lang="ts">
import { ref, watch } from 'vue'
import AppStepModal from '@/components/ui/AppStepModal.vue'
import AppModal from '@/components/ui/AppModal.vue'
import StepChannelIdentity from '@/components/channels/steps/StepChannelIdentity.vue'
import StepChannelEditorial from '@/components/channels/steps/StepChannelEditorial.vue'
import StepChannelVisuals from '@/components/channels/steps/StepChannelVisuals.vue'
import StepChannelLegal from '@/components/channels/steps/StepChannelLegal.vue'
import StepChannelSuccess from '@/components/channels/steps/StepChannelSuccess.vue'
import { useCreateChannelWizard, CHANNEL_WIZARD_STEPS } from '@/composables/useCreateChannelWizard'
import { createChannel, type Channel } from '@/api/channels'
import { getErrorMessage } from '@/lib/http-errors'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [boolean]
  close: []
  created: [Channel]
}>()

const submitting = ref(false)
const submitError = ref('')
const createdChannel = ref<Channel | null>(null)

const {
  name, handle, handleAvailable, description, categories,
  logo, banner, primaryColor, accentColor, agreements,
  currentStepId, canGoNext,
  reset, buildPayload,
} = useCreateChannelWizard()

watch(() => props.open, (v) => {
  if (!v) {
    setTimeout(reset, 300)
    createdChannel.value = null
    submitError.value = ''
  }
})

async function handleSubmit() {
  submitting.value = true
  submitError.value = ''
  try {
    const channel = await createChannel(buildPayload())
    createdChannel.value = channel
    emit('created', channel)
  } catch (error) {
    submitError.value = getErrorMessage(error, 'Impossible de créer la chaîne pour le moment.')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:open', false)
  emit('close')
}
</script>

<template>
  <!-- État de succès -->
  <AppModal
    v-if="createdChannel"
    :open="open"
    title="Chaîne créée"
    size="sm"
    @update:open="handleClose"
    @close="handleClose"
  >
    <StepChannelSuccess
      :channel-name="createdChannel.profile?.name ?? name"
      :dashboard-path="`/channels/${createdChannel.id}/dashboard`"
      @close="handleClose"
    />
  </AppModal>

  <!-- Wizard -->
  <AppStepModal
    v-else
    :open="open"
    title="Créer une chaîne"
    :steps="CHANNEL_WIZARD_STEPS"
    v-model:current-step-id="currentStepId"
    :can-go-next="canGoNext"
    :loading="submitting"
    size="md"
    @update:open="handleClose"
    @close="handleClose"
    @submit="handleSubmit"
  >
    <template #default="{ step }">
      <StepChannelIdentity
        v-if="step.id === 'identity'"
        v-model:name="name"
        v-model:handle="handle"
        v-model:handle-available="handleAvailable"
      />
      <StepChannelEditorial
        v-else-if="step.id === 'editorial'"
        v-model:description="description"
        v-model:categories="categories"
      />
      <StepChannelVisuals
        v-else-if="step.id === 'visuals'"
        v-model:logo="logo"
        v-model:banner="banner"
        v-model:primary-color="primaryColor"
        v-model:accent-color="accentColor"
        :channel-name="name"
      />
      <template v-else-if="step.id === 'legal'">
        <StepChannelLegal v-model="agreements" />
        <p v-if="submitError" class="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {{ submitError }}
        </p>
      </template>
    </template>
  </AppStepModal>
</template>
