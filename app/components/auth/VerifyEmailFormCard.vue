<script setup lang="ts">
import { computed, ref } from 'vue'
import { getErrorMessage } from '@/lib/http-errors'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const email = computed(() => (route.query.email as string) ?? '')
const maskedEmail = computed(() => {
  const [local, domain] = email.value.split('@')
  if (!local || !domain) return email.value
  const visible = local.slice(0, 2)
  const masked = '*'.repeat(Math.max(0, local.length - 2))
  return `${visible}${masked}@${domain}`
})

const digits = ref<string[]>(Array(6).fill(''))
const inputRefs = ref<HTMLInputElement[]>([])
const submitError = ref('')
const resendSuccess = ref(false)
const isResending = ref(false)
const resendCooldown = ref(0)

const code = computed(() => digits.value.join(''))
const isCodeComplete = computed(() => code.value.length === 6 && digits.value.every((d) => /\d/.test(d)))

const focusInput = (index: number) => {
  inputRefs.value[index]?.focus()
}

const handleDigitInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(-1)
  digits.value[index] = value

  if (value && index < 5) {
    focusInput(index + 1)
  }
}

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace') {
    if (digits.value[index]) {
      digits.value[index] = ''
    } else if (index > 0) {
      digits.value[index - 1] = ''
      focusInput(index - 1)
    }
  } else if (event.key === 'ArrowLeft' && index > 0) {
    focusInput(index - 1)
  } else if (event.key === 'ArrowRight' && index < 5) {
    focusInput(index + 1)
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? ''
  pasted.split('').forEach((char, i) => {
    if (i < 6) digits.value[i] = char
  })
  focusInput(Math.min(pasted.length, 5))
}

const handleSubmit = async () => {
  if (!isCodeComplete.value || authStore.isAuthenticating) return

  submitError.value = ''

  try {
    await authStore.verifyEmail({ email: email.value, code: code.value })
    await router.push('/')
  } catch (error) {
    submitError.value = getErrorMessage(error, 'Code invalide ou expiré. Vérifiez le code et réessayez.')
    digits.value = Array(6).fill('')
    focusInput(0)
  }
}

const startCooldown = () => {
  resendCooldown.value = 60
  const interval = setInterval(() => {
    resendCooldown.value -= 1
    if (resendCooldown.value <= 0) clearInterval(interval)
  }, 1000)
}

const handleResend = async () => {
  if (isResending.value || resendCooldown.value > 0) return

  isResending.value = true
  resendSuccess.value = false
  submitError.value = ''

  try {
    await authStore.resendVerification(email.value)
    resendSuccess.value = true
    startCooldown()
  } catch {
    submitError.value = "Impossible d'envoyer l'e-mail. Réessayez dans un instant."
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <AuthCard>
    <div class="flex flex-col gap-6">
      <AuthCardHeader eyebrow="Activation du compte" :title="[{ text: 'Vérifiez votre ' }, { text: 'e-mail', em: true }]">
        Un code à 6 chiffres a été envoyé à <strong>{{ maskedEmail }}</strong>. Saisissez-le ci-dessous pour activer
        votre compte.
      </AuthCardHeader>

      <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
        <AuthErrorAlert :message="submitError" />
        <AuthErrorAlert v-if="resendSuccess" variant="success" message="Un nouveau code a été envoyé à votre adresse e-mail." />

        <fieldset class="m-0 border-0 p-0">
          <legend class="ds-otp__legend">Code de vérification</legend>
          <div class="flex justify-between gap-2 sm:gap-3">
            <input
              v-for="(_, index) in digits"
              :key="index"
              :ref="(el) => { if (el) inputRefs[index] = el as HTMLInputElement }"
              :value="digits[index]"
              type="text"
              inputmode="numeric"
              maxlength="1"
              autocomplete="one-time-code"
              :aria-label="`Chiffre ${index + 1} sur 6`"
              class="ds-otp"
              :class="{ 'is-error': submitError && !digits[index], 'is-filled': digits[index] }"
              @input="handleDigitInput(index, $event)"
              @keydown="handleKeydown(index, $event)"
              @paste="handlePaste"
            />
          </div>
        </fieldset>

        <DsButton type="submit" block :disabled="!isCodeComplete || authStore.isAuthenticating">
          <template v-if="authStore.isAuthenticating"><AuthSpinner /> Vérification…</template>
          <template v-else>Confirmer mon compte <span aria-hidden="true">→</span></template>
        </DsButton>
      </form>

      <p class="ds-auth-foot">
        Vous n'avez pas reçu le code ?
        <button type="button" class="ds-auth-link" :disabled="isResending || resendCooldown > 0" @click="handleResend">
          <template v-if="resendCooldown > 0">Renvoyer dans {{ resendCooldown }} s</template>
          <template v-else>{{ isResending ? 'Envoi…' : 'Renvoyer le code' }}</template>
        </button>
      </p>
    </div>
  </AuthCard>
</template>

<style scoped>
.ds-otp__legend {
  margin-bottom: 10px;
  padding: 0;
  color: var(--ds-text);
  font-size: 14px;
  font-weight: 700;
}
.ds-otp {
  width: 100%;
  min-width: 0;
  height: 60px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
  box-shadow: 3px 3px 0 var(--ds-sh);
  color: var(--ds-text);
  font: 500 24px var(--ds-num);
  text-align: center;
  outline: none;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.ds-otp.is-filled {
  background: var(--ds-tint);
}
.ds-otp:focus {
  border-color: var(--ds-focus);
  box-shadow:
    3px 3px 0 var(--ds-sh),
    0 0 0 4px color-mix(in srgb, var(--ds-focus) 20%, transparent);
}
.ds-otp.is-error {
  border-color: #be123c;
  box-shadow: 3px 3px 0 #fda4af;
}
:root[data-color-scheme='dark'] .ds-otp.is-error {
  border-color: #fb7185;
  box-shadow: 3px 3px 0 #881337;
}
</style>
