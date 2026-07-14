<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import StepChannelLegal from '@/components/channels/steps/StepChannelLegal.vue'
import { createChannel, type Channel } from '@/api/channels'
import { deriveAvailableHandle } from '@/lib/channel-handle'
import { getErrorMessage } from '@/lib/http-errors'

const props = defineProps<{ open: boolean; name: string; color: string }>()
const emit = defineEmits<{
  'update:open': [boolean]
  close: []
  created: [Channel]
}>()

const agreements = ref({ rgpd: false, publicVisibility: false, termsOfService: false })
const submitting = ref(false)
const submitError = ref('')

const canSubmit = computed(() => agreements.value.rgpd && agreements.value.publicVisibility && agreements.value.termsOfService)

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    setTimeout(() => {
      agreements.value = { rgpd: false, publicVisibility: false, termsOfService: false }
      submitError.value = ''
    }, 300)
  }
})

function handleClose() {
  emit('update:open', false)
  emit('close')
}

async function handleSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  submitError.value = ''
  try {
    const handle = await deriveAvailableHandle(props.name)
    const channel = await createChannel({ name: props.name, handle, custom_color_primary: props.color })
    emit('created', channel)
  } catch (error) {
    submitError.value = getErrorMessage(error, 'Impossible de créer la chaîne pour le moment.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppModal :open="open" title="Dernière étape" size="sm" @update:open="handleClose" @close="handleClose">
    <p class="mb-4 text-sm text-slate-500">
      Avant de créer <strong class="text-slate-800">{{ name }}</strong>, confirmez les conditions suivantes.
    </p>

    <StepChannelLegal v-model="agreements" />

    <p v-if="submitError" class="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
      {{ submitError }}
    </p>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          @click="handleClose"
        >
          Annuler
        </button>
        <button
          type="button"
          class="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canSubmit || submitting"
          @click="handleSubmit"
        >
          {{ submitting ? 'Création…' : 'Créer la chaîne' }}
        </button>
      </div>
    </template>
  </AppModal>
</template>
