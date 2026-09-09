<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import { useAuthStore } from '@/stores/auth'

const requiresIdentity = defineModel<boolean>({ required: true })
const auth = useAuthStore()
</script>

<template>
  <StatsDataSettingsCard
    title="Vérification d'identité"
    description="Répondre à un sondage impose toujours d'être connecté. Cette option ajoute en plus une vérification d'identité (KYC via un prestataire tiers indépendant, Didit)."
  >
    <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <AppCheckbox
        :model-value="requiresIdentity"
        :disabled="!auth.isPremium"
        label="Exiger la vérification d'identité des répondants"
        :description="
          auth.isPremium
            ? 'Seuls les comptes ayant validé leur identité pourront voter. Recommandé pour les pétitions et les consultations à fort enjeu.'
            : 'Réservé à l\'offre Premium.'
        "
        @update:model-value="requiresIdentity = $event"
      />
      <RouterLink
        v-if="!auth.isPremium"
        to="/offres"
        target="_blank"
        class="mt-2 inline-block text-[12px] font-bold text-[var(--color-primary)]"
      >
        Voir l'offre Premium →
      </RouterLink>
    </div>
  </StatsDataSettingsCard>
</template>
