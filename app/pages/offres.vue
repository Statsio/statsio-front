<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Offres',
  description:
    'Une seule offre premium, sans paliers compliqués : créez et publiez gratuitement, passez à Premium quand votre chaîne grandit.',
})

import { computed } from 'vue'
import OfferComparisonTable from '@/components/offers/OfferComparisonTable.vue'
import OfferPlanCard from '@/components/offers/OfferPlanCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useOffers } from '@/composables/useOffers'
import { useBilling } from '@/composables/useBilling'
import type { Offer } from '@/types/offer'

const auth = useAuthStore()
const { offers, comparisonRows, pending } = useOffers()
const { isRedirecting, goToCheckout } = useBilling()

function isPaidOffer(offer: Offer): boolean {
  return offer.priceCents > 0
}

// Abonné Premium consultant la page : plus de sens à "Passer à Premium" sur sa propre offre.
const displayOffers = computed(() =>
  offers.value.map((offer) => ({
    ...offer,
    ctaLabel: isPaidOffer(offer) && auth.isPremium ? 'Gérer mon abonnement' : offer.ctaLabel,
  })),
)

function ctaHref(offer: Offer): string {
  if (offer.ctaUrl) return offer.ctaUrl
  if (isPaidOffer(offer)) return auth.isPremium ? '/user/parametres' : '/register'
  return auth.isAuthenticated ? '/user' : '/register'
}

// Checkout Stripe direct uniquement pour l'offre payante, connecté, pas déjà Premium,
// et sans lien custom défini en admin (cta_url a priorité — ex. contact commercial).
function shouldCheckout(offer: Offer): boolean {
  return !offer.ctaUrl && isPaidOffer(offer) && auth.isAuthenticated && !auth.isPremium
}

const skeletons = computed(() => (pending.value && offers.value.length === 0 ? [0, 1] : []))
</script>

<template>
  <div class="section">
    <div class="container">
      <div class="mx-auto max-w-[620px] text-center">
        <p class="eyebrow text-[var(--color-primary)]">Pour les créateurs de contenu</p>
        <h1 class="mt-3.5 text-[32px] font-extrabold leading-[1.2] text-slate-950 sm:text-[34px]">
          Une seule offre premium, sans paliers compliqués
        </h1>
        <p class="mt-3.5 text-[15px] leading-[1.6] text-slate-500">
          Créez et publiez gratuitement. Passez à Premium quand votre chaîne grandit — toutes les limites
          disparaissent.
        </p>
      </div>

      <div class="mt-12 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
        <div
          v-for="i in skeletons"
          :key="i"
          class="h-[420px] animate-pulse rounded-[20px] border-[1.5px] border-slate-200 bg-slate-50"
        />
        <OfferPlanCard
          v-for="offer in displayOffers"
          :key="offer.id"
          :offer="offer"
          :href="ctaHref(offer)"
          :checkout="shouldCheckout(offer)"
          :loading="isRedirecting"
          @checkout="goToCheckout"
        />
      </div>

      <div v-if="comparisonRows.length" class="mt-14">
        <OfferComparisonTable :rows="comparisonRows" />
      </div>

      <p class="mt-9 text-center text-[12.5px] text-slate-400">
        Sans engagement — annulez à tout moment depuis vos paramètres de facturation.
      </p>
    </div>
  </div>
</template>
