<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { checkHandleAvailability } from '@/api/channels-validation'

const name = defineModel<string>('name', { required: true })
const handle = defineModel<string>('handle', { required: true })
const handleAvailable = defineModel<boolean | null>('handleAvailable', { required: true })

const isCheckingHandle = ref(false)
const handleError = ref('')

let handleCheckTimeout: ReturnType<typeof setTimeout> | null = null

const checkHandle = async () => {
  const value = handle.value.trim()

  if (!value) {
    handleError.value = ''
    handleAvailable.value = null
    return
  }

  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    handleError.value = 'L\'identifiant ne peut contenir que des lettres, chiffres et underscores'
    handleAvailable.value = false
    return
  }

  if (value.length < 3) {
    handleError.value = 'L\'identifiant doit contenir au moins 3 caractères'
    handleAvailable.value = false
    return
  }

  if (value.length > 50) {
    handleError.value = 'L\'identifiant ne doit pas dépasser 50 caractères'
    handleAvailable.value = false
    return
  }

  isCheckingHandle.value = true
  handleError.value = ''

  try {
    const available = await checkHandleAvailability(value)
    handleAvailable.value = available
    if (!available) {
      handleError.value = 'Cet identifiant est déjà utilisé'
    }
  } catch {
    handleError.value = 'Impossible de vérifier la disponibilité'
    handleAvailable.value = null
  } finally {
    isCheckingHandle.value = false
  }
}

const onHandleInput = () => {
  handleAvailable.value = null
  handleError.value = ''

  if (handleCheckTimeout) clearTimeout(handleCheckTimeout)
  handleCheckTimeout = setTimeout(checkHandle, 500)
}

onBeforeUnmount(() => {
  if (handleCheckTimeout) clearTimeout(handleCheckTimeout)
})
</script>

<template>
  <div class="flex flex-col gap-6 py-2">
    <label class="flex flex-col gap-2">
      <span class="text-sm font-semibold text-slate-700">
        Nom de la chaîne <span class="text-rose-500">*</span>
      </span>
      <input
        v-model="name"
        type="text"
        required
        class="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="Ma Chaîne Éditoriale"
      />
      <span class="text-xs text-slate-500">Le nom public de votre chaîne</span>
    </label>

    <label class="flex flex-col gap-2">
      <span class="text-sm font-semibold text-slate-700">
        Identifiant <span class="text-rose-500">*</span>
      </span>
      <div
        class="flex items-center gap-2 rounded-[1.25rem] border bg-white px-4 py-3 transition focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20"
        :class="handleError ? 'border-rose-300' : handleAvailable === true ? 'border-emerald-300' : 'border-slate-200'"
      >
        <span class="text-sm font-semibold text-slate-500">@</span>
        <input
          v-model="handle"
          type="text"
          required
          pattern="[a-zA-Z0-9_]+"
          maxlength="50"
          class="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          placeholder="ma_chaine"
          @input="onHandleInput"
        />
        <svg v-if="isCheckingHandle" class="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <svg v-else-if="handleAvailable === true" class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else-if="handleAvailable === false" class="h-4 w-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <span v-if="handleError" class="text-xs text-rose-500">{{ handleError }}</span>
      <span v-else-if="handleAvailable === true" class="text-xs text-emerald-600">Cet identifiant est disponible</span>
      <span v-else class="text-xs text-slate-500">Votre identifiant unique (lettres, chiffres et underscores uniquement)</span>
    </label>
  </div>
</template>
