<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { loadGoogleIdentityScript } from '@/lib/google-identity'
import { getErrorMessage } from '@/lib/http-errors'
import { useAuthStore } from '@/stores/auth'
import type { PersistMode } from '@/types/auth'

const props = withDefaults(
  defineProps<{
    context?: 'signin' | 'signup'
    persistMode?: PersistMode
  }>(),
  {
    context: 'signin',
    persistMode: 'local',
  },
)

const emit = defineEmits<{
  success: []
  error: [message: string]
}>()

const authStore = useAuthStore()
const containerRef = ref<HTMLDivElement | null>(null)
const localError = ref('')

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

const buttonText = computed(() => (props.context === 'signup' ? 'signup_with' : 'continue_with'))
const isUnavailable = computed(() => !googleClientId)

const mountGoogleButton = async () => {
  if (!containerRef.value || !googleClientId) {
    return
  }

  await loadGoogleIdentityScript()
  const googleIdentity = window.google?.accounts.id

  if (!googleIdentity) {
    throw new Error("Google Identity Services n'est pas disponible après chargement.")
  }

  googleIdentity.initialize({
    client_id: googleClientId,
    callback: async ({ credential }: GoogleCredentialResponse) => {
      if (!credential) {
        const message = 'Google n’a pas renvoyé de token exploitable.'
        localError.value = message
        emit('error', message)
        return
      }

      localError.value = ''

      try {
        await authStore.authenticateWithGoogle(credential, props.persistMode)
        emit('success')
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Connexion Google impossible pour le moment. Réessayez dans un instant.",
        )
        localError.value = message
        emit('error', message)
      }
    },
    ux_mode: 'popup',
    auto_select: false,
    itp_support: true,
  })

  containerRef.value.innerHTML = ''

  googleIdentity.renderButton(containerRef.value, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: buttonText.value,
    shape: 'pill',
    logo_alignment: 'left',
    width: containerRef.value.offsetWidth,
  })
}

onMounted(async () => {
  if (isUnavailable.value) {
    localError.value = 'Google Auth non configuré: ajoutez VITE_GOOGLE_CLIENT_ID.'
    return
  }

  try {
    await nextTick()
    await mountGoogleButton()
  } catch (error) {
    localError.value = getErrorMessage(error, "Impossible d'initialiser Google Auth.")
  }
})
</script>

<template>
  <div class="grid gap-3">
    <div :class="authStore.isAuthenticating ? 'pointer-events-none opacity-70' : ''">
      <div
        v-if="isUnavailable"
        class="flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-500"
      >
        Google Auth non configuré
      </div>
      <div v-else ref="containerRef" class="w-full" />
    </div>

    <p v-if="localError" class="text-sm text-rose-600">
      {{ localError }}
    </p>
  </div>
</template>
