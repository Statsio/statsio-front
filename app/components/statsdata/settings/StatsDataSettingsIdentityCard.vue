<script setup lang="ts">
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'

const requiresIdentity = defineModel<boolean>({ required: true })
</script>

<template>
  <StatsDataSettingsCard
    title="Vérification d'identité"
    description="Répondre à un sondage impose toujours d'être connecté. Cette option ajoute en plus une vérification d'identité (KYC via un prestataire tiers indépendant, Didit)."
  >
    <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <AppCheckbox
        :model-value="requiresIdentity"
        label="Exiger la vérification d'identité des répondants"
        description="Seuls les comptes ayant validé leur identité pourront voter. Recommandé pour les pétitions et les consultations à fort enjeu."
        @update:model-value="requiresIdentity = $event"
      />
    </div>
  </StatsDataSettingsCard>
</template>
