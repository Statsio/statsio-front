<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
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
  <div class="panel rounded-[2rem] p-2 text-slate-950 shadow-[0_32px_80px_-36px_rgba(15,23,42,0.75)]">
    <div class="flex flex-col gap-6 rounded-[1.5rem] bg-white p-5 sm:p-8">

      <!-- Header -->
      <div class="flex flex-col gap-2">
        <p class="text-xs font-semibold uppercase tracking-[0.32em] text-primary">Vérification</p>
        <h2 class="text-2xl font-semibold text-slate-950 sm:text-3xl">Vérifiez votre e-mail.</h2>
        <p class="text-sm leading-6 text-slate-500">
          Un code à 6 chiffres a été envoyé à
          <span class="font-semibold text-slate-700">{{ maskedEmail }}</span>.
          Saisissez-le ci-dessous pour activer votre compte.
        </p>
      </div>

      <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
        <!-- Error -->
        <div
          v-if="submitError"
          class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {{ submitError }}
        </div>

        <!-- Resend success -->
        <div
          v-if="resendSuccess"
          class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          Un nouveau code a été envoyé à votre adresse e-mail.
        </div>

        <!-- 6-digit inputs -->
        <div>
          <span class="mb-3 block text-sm font-semibold text-slate-700">Code de vérification</span>
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
              class="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-950 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              :class="{ 'border-rose-300 bg-rose-50/60': submitError && !digits[index] }"
              @input="handleDigitInput(index, $event)"
              @keydown="handleKeydown(index, $event)"
              @paste="handlePaste"
            />
          </div>
        </div>

        <AppButton
          :disabled="!isCodeComplete || authStore.isAuthenticating"
          full-width
          size="lg"
          variant="primary"
          type="submit"
        >
          {{ authStore.isAuthenticating ? 'Vérification...' : 'Confirmer mon compte' }}
        </AppButton>
      </form>

      <!-- Resend -->
      <p class="text-center text-sm text-slate-500">
        Vous n'avez pas reçu le code ?
        <button
          type="button"
          :disabled="isResending || resendCooldown > 0"
          class="font-semibold text-primary transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleResend"
        >
          <template v-if="resendCooldown > 0">Renvoyer dans {{ resendCooldown }}s</template>
          <template v-else>{{ isResending ? 'Envoi...' : 'Renvoyer le code' }}</template>
        </button>
      </p>

    </div>
  </div>
</template>
