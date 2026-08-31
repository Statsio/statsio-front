<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
  ssr: false,
  title: "Vérification d'identité",
  robots: 'noindex,nofollow',
})
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { fetchIdentityStatus } from '@/api/identity'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

/** Chemin de retour transmis par le back dans l'URL de callback Didit (?return=/sondages/xxx). */
const returnPath = computed(() => {
  const raw = String(route.query.return ?? '')
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/sondages'
})

type Phase = 'checking' | 'approved' | 'pending' | 'declined'
const phase = ref<Phase>('checking')

let timer: ReturnType<typeof setTimeout> | undefined
const deadline = Date.now() + 90_000

function classify(status: string | null): Phase {
  if (status === 'Approved') return 'approved'
  if (
    status === 'Declined' ||
    status === 'Expired' ||
    status === 'Abandoned' ||
    status === 'Kyc Expired'
  )
    return 'declined'
  return 'pending'
}

async function poll() {
  try {
    await auth.refreshUser()
    const { verified, status } = await fetchIdentityStatus()
    if (verified) {
      phase.value = 'approved'
      return
    }
    const next = classify(status)
    phase.value = next === 'pending' && Date.now() > deadline ? 'pending' : next
    if (next === 'pending' && Date.now() < deadline) {
      timer = setTimeout(poll, 3000)
    }
  } catch {
    timer = setTimeout(poll, 5000)
  }
}

onMounted(poll)
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

const copy = computed(() => {
  switch (phase.value) {
    case 'approved':
      return {
        icon: '✓',
        tone: 'emerald',
        title: 'Identité vérifiée',
        text: 'Vous pouvez maintenant répondre aux consultations à identité vérifiée.',
      }
    case 'declined':
      return {
        icon: '✕',
        tone: 'rose',
        title: 'Vérification non aboutie',
        text: "La vérification n'a pas pu être confirmée. Vous pouvez réessayer depuis la consultation.",
      }
    case 'pending':
      return {
        icon: '⏳',
        tone: 'amber',
        title: 'Vérification en cours de revue',
        text: "Votre dossier est en cours d'examen. Vous serez pris·e en compte dès qu'il sera validé — repassez plus tard.",
      }
    default:
      return {
        icon: '⏳',
        tone: 'slate',
        title: 'Vérification en cours…',
        text: 'Merci de patienter quelques instants.',
      }
  }
})
</script>

<template>
  <div class="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-6 px-6 py-16">
    <div class="card-xl flex flex-col gap-5 p-8 text-center">
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
        :class="{
          'bg-emerald-100 text-emerald-600': copy.tone === 'emerald',
          'bg-rose-100 text-rose-600': copy.tone === 'rose',
          'bg-amber-100 text-amber-600': copy.tone === 'amber',
          'bg-slate-100 text-slate-500': copy.tone === 'slate',
        }"
      >
        <span :class="{ 'animate-pulse': phase === 'checking' }">{{ copy.icon }}</span>
      </div>

      <div>
        <h1 class="text-xl font-bold text-slate-950">{{ copy.title }}</h1>
        <p class="mt-2 text-sm text-slate-500">{{ copy.text }}</p>
      </div>

      <AppButton
        v-if="phase !== 'checking'"
        variant="primary"
        size="md"
        @click="navigateTo(returnPath)"
      >
        Revenir à la consultation
      </AppButton>
    </div>
  </div>
</template>
