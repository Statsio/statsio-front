<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { Offer } from '@/types/offer'

const props = defineProps<{
  offer: Offer
  href: string
  /** Le bouton lance un paiement Stripe Checkout au lieu de naviguer vers `href`. */
  checkout?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{ checkout: [] }>()

const isExternal = computed(() => /^https?:\/\//.test(props.href))

const priceLabel = computed(() =>
  props.offer.priceCents === 0
    ? '0 €'
    : (props.offer.priceCents / 100).toLocaleString('fr-FR', {
        minimumFractionDigits: props.offer.priceCents % 100 === 0 ? 0 : 2,
      }) + ' €',
)
</script>

<template>
  <div
    class="flex flex-col rounded-[20px] p-8 sm:p-9"
    :class="
      offer.isHighlighted
        ? 'relative overflow-hidden bg-slate-950 text-white'
        : 'border-[1.5px] border-slate-200 bg-white'
    "
  >
    <div
      v-if="offer.isHighlighted"
      class="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--color-primary)]/20"
      aria-hidden="true"
    />

    <div class="relative flex items-center gap-2.5">
      <span
        class="text-[13px] font-extrabold uppercase tracking-[0.05em]"
        :class="offer.isHighlighted ? 'text-white/60' : 'text-slate-400'"
      >
        {{ offer.name }}
      </span>
      <span
        v-if="offer.badgeLabel"
        class="rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.05em]"
        :class="offer.isHighlighted ? 'bg-[var(--color-primary)]/25 text-[#c4b5fd]' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'"
      >
        {{ offer.badgeLabel }}
      </span>
    </div>

    <div class="relative mt-3.5 flex items-baseline gap-1.5">
      <span class="font-mono text-[38px] font-extrabold">{{ priceLabel }}</span>
      <span class="text-[13px]" :class="offer.isHighlighted ? 'text-white/55' : 'text-slate-400'">
        / {{ offer.period }}
      </span>
    </div>

    <p
      v-if="offer.tagline"
      class="relative mt-1.5 text-[13.5px] leading-[1.55]"
      :class="offer.isHighlighted ? 'text-white/60' : 'text-slate-500'"
    >
      {{ offer.tagline }}
    </p>

    <AppButton
      v-if="checkout"
      as="button"
      type="button"
      :variant="offer.isHighlighted ? 'gradient' : 'outline'"
      full-width
      :disabled="loading"
      class="relative mt-7 !rounded-full"
      @click="emit('checkout')"
    >
      {{ loading ? 'Redirection…' : offer.ctaLabel }}
    </AppButton>
    <AppButton
      v-else
      :as="isExternal ? 'a' : 'router-link'"
      :to="isExternal ? undefined : href"
      :href="isExternal ? href : undefined"
      :variant="offer.isHighlighted ? 'gradient' : 'outline'"
      full-width
      class="relative mt-7 !rounded-full"
    >
      {{ offer.ctaLabel }}
    </AppButton>

    <div class="relative mt-7 flex flex-col gap-3.5">
      <div v-for="feature in offer.features" :key="feature.label" class="flex items-start gap-2.5">
        <span
          class="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          :class="[
            offer.isHighlighted
              ? 'bg-[var(--color-primary)]/25 text-[#c4b5fd]'
              : feature.included
                ? 'bg-emerald-500/15 text-emerald-600'
                : 'bg-slate-100 text-slate-400',
          ]"
        >
          {{ feature.included ? '✓' : '!' }}
        </span>
        <span
          class="text-[13.5px] leading-[1.5]"
          :class="offer.isHighlighted ? 'text-white' : feature.included ? 'text-slate-950' : 'text-slate-500'"
        >
          {{ feature.label }}
        </span>
      </div>
    </div>
  </div>
</template>
