<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { useBilling } from '@/composables/useBilling'
import { useOffers } from '@/composables/useOffers'

const authStore = useAuthStore()
const notifications = useAppNotifications()
const { isRedirecting, goToCheckout, goToPortal } = useBilling()
const { offers } = useOffers()
const route = useRoute()
const router = useRouter()

const paidOffer = computed(() => offers.value.find((o) => o.priceCents > 0))
const checkoutLabel = computed(() => {
  const offer = paidOffer.value
  if (!offer) return 'Passer à Premium'
  const price = (offer.priceCents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: offer.priceCents % 100 === 0 ? 0 : 2,
  })
  return `Passer à Premium — ${price} €/${offer.period}`
})

/** Poll bref après un retour Checkout : le webhook Stripe active le Premium en général < 2s. */
const activating = ref(false)

const renewalDate = computed(() => {
  const value = authStore.user?.premium_until
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
})

async function pollForActivation() {
  activating.value = true
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await authStore.refreshUser()
    if (authStore.isPremium) break
  }
  activating.value = false

  if (authStore.isPremium) {
    notifications.success('Votre offre Premium est active — merci !')
  } else {
    notifications.info("Paiement reçu, l'activation de votre offre Premium arrive dans quelques instants.")
  }
}

onMounted(async () => {
  const checkout = route.query.checkout
  if (checkout === 'success' || checkout === 'cancel') {
    router.replace({ query: {} })
  }
  if (checkout === 'success') {
    await pollForActivation()
  } else if (checkout === 'cancel') {
    notifications.info('Paiement annulé — vous pouvez réessayer à tout moment.')
  }
})
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.05)] sm:p-7">
    <div class="mb-3 text-xs font-bold uppercase tracking-[0.04em] text-slate-400">Abonnement</div>

    <div class="flex flex-wrap items-center justify-between gap-4 py-2">
      <div>
        <div class="flex items-center gap-2">
          <span
            class="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em]"
            :class="
              authStore.isPremium
                ? 'bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-white'
                : 'bg-slate-100 text-slate-500'
            "
          >
            {{ authStore.isPremium ? 'Premium' : 'Freemium' }}
          </span>
          <span v-if="activating" class="text-[12.5px] text-slate-400">Activation en cours…</span>
        </div>
        <div class="mt-1.5 text-[12.5px] text-slate-500">
          <span v-if="authStore.isPremium && renewalDate">Se renouvelle le {{ renewalDate }}.</span>
          <span v-else-if="authStore.isPremium">Actif, sans date d'expiration.</span>
          <span v-else>Studio limité, 1 chaîne, sans vérification d'identité des sondages.</span>
        </div>
      </div>

      <AppButton
        v-if="authStore.isPremium"
        variant="secondary"
        :disabled="isRedirecting"
        @click="goToPortal"
      >
        {{ isRedirecting ? 'Redirection…' : 'Gérer mon abonnement' }}
      </AppButton>
      <AppButton
        v-else
        variant="gradient"
        :disabled="isRedirecting"
        @click="goToCheckout"
      >
        {{ isRedirecting ? 'Redirection…' : checkoutLabel }}
      </AppButton>
    </div>
  </section>
</template>
