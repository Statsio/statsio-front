<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { updateChannelProfile, deleteChannel, type Channel } from '@/api/channels'
import { getErrorMessage } from '@/lib/http-errors'

const props = defineProps<{ channelId: number; channel: Channel }>()
const emit = defineEmits<{ reload: [] }>()
const router = useRouter()

const inputClass = 'rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20'

// --- Visibilité ---
const isPrivate = ref(false)
const visibilitySaving = ref(false)
const visibilitySuccess = ref(false)
const visibilityError = ref('')

watch(() => props.channel, (channel) => { isPrivate.value = channel.profile.is_private }, { immediate: true })

const saveVisibility = async (value: boolean) => {
  const previous = isPrivate.value
  isPrivate.value = value
  visibilitySaving.value = true
  visibilityError.value = ''
  visibilitySuccess.value = false
  try {
    await updateChannelProfile(props.channelId, { is_private: value })
    emit('reload')
    visibilitySuccess.value = true
    setTimeout(() => visibilitySuccess.value = false, 3000)
  } catch (e) {
    isPrivate.value = previous
    visibilityError.value = getErrorMessage(e, 'Erreur lors de la sauvegarde.')
  } finally {
    visibilitySaving.value = false
  }
}

// --- Zone dangereuse ---
const deleteConfirm = ref('')
const deleteLoading = ref(false)
const deleteError = ref('')

const handleDelete = async () => {
  if (deleteConfirm.value !== props.channel.profile.name) return
  deleteLoading.value = true
  deleteError.value = ''
  try {
    await deleteChannel(props.channelId)
    router.push('/mes-chaines')
  } catch (e) {
    deleteError.value = getErrorMessage(e, 'Erreur lors de la suppression.')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Visibilité -->
    <div class="card-xl p-6 sm:p-7">
      <p class="eyebrow text-primary">Visibilité</p>
      <div class="mt-5 flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-slate-800">Chaîne privée</p>
          <p class="mt-1 text-[13.5px] leading-6 text-slate-500">
            Une chaîne privée n'apparaît pas dans l'annuaire public et son contenu n'est visible que par son équipe.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="isPrivate"
          :disabled="visibilitySaving"
          class="relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60"
          :class="isPrivate ? 'bg-primary' : 'bg-slate-200'"
          @click="saveVisibility(!isPrivate)"
        >
          <span class="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition" :class="isPrivate ? 'translate-x-5' : ''" />
        </button>
      </div>
      <p v-if="visibilityError" class="mt-3 text-sm text-rose-600">{{ visibilityError }}</p>
      <p v-if="visibilitySuccess" class="mt-3 text-sm font-semibold text-emerald-600">✓ Sauvegardé</p>
    </div>

    <!-- Zone sensible -->
    <div class="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 sm:p-7">
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Zone sensible</p>
      <p class="mt-3 text-sm leading-7 text-slate-600">
        La suppression de la chaîne effacera son profil public, ses contenus et son historique d'abonnés. Cette action est <strong>définitive</strong>.<br />
        Tapez <strong>{{ channel.profile.name }}</strong> pour confirmer.
      </p>
      <input v-model="deleteConfirm" type="text" :class="inputClass + ' mt-4 w-full border-rose-200'" :placeholder="channel.profile.name" />
      <p v-if="deleteError" class="mt-3 text-sm text-rose-700">{{ deleteError }}</p>
      <div class="mt-4">
        <AppButton
          variant="outline"
          size="md"
          class="border-rose-400 text-rose-700 hover:bg-rose-100"
          :disabled="deleteConfirm !== channel.profile.name || deleteLoading"
          @click="handleDelete"
        >
          {{ deleteLoading ? 'Suppression...' : 'Supprimer la chaîne' }}
        </AppButton>
      </div>
    </div>
  </div>
</template>
