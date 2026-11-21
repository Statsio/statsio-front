<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import { SURVEY_KIND_OPTIONS, type SurveyKind } from '@/types/content-creation'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  kind: SurveyKind
  identity: boolean
}>()

const emit = defineEmits<{
  'update:kind': [SurveyKind]
  'update:identity': [boolean]
}>()

const auth = useAuthStore()
</script>

<template>
  <div class="flex flex-col gap-5">
    <div>
      <DsLabel class="mb-2">Format de consultation</DsLabel>
      <div class="flex flex-col gap-2">
        <button
          v-for="opt in SURVEY_KIND_OPTIONS"
          :key="opt.value"
          type="button"
          class="flex w-full items-start gap-3 rounded-[4px] border-2 p-3.5 text-left transition-shadow"
          :class="kind === opt.value
            ? 'border-[var(--ds-ol)] bg-[var(--ds-tint)] shadow-[3px_3px_0_var(--ds-sh)]'
            : 'border-[var(--ds-divide)] bg-[var(--ds-surface)] hover:border-[var(--ds-ol)]'"
          @click="emit('update:kind', opt.value)"
        >
          <span
            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
            :class="kind === opt.value ? 'border-[var(--ds-ol)] bg-[var(--ds-action)]' : 'border-[var(--ds-divide)]'"
          >
            <span v-if="kind === opt.value" class="h-2 w-2 rounded-full bg-[var(--ds-action-ink)]" />
          </span>
          <span class="min-w-0">
            <span class="block text-[14px] font-extrabold text-[var(--ds-text)]" style="font-family: var(--ds-display)">
              {{ opt.label }}
            </span>
            <span class="mt-1 block text-[12.5px] leading-snug text-[var(--ds-muted)]">{{ opt.description }}</span>
          </span>
        </button>
      </div>
    </div>

    <div class="rounded-[4px] border-2 border-[var(--ds-divide)] bg-[var(--ds-tint)] p-4">
      <AppCheckbox
        :model-value="identity"
        :disabled="!auth.isPremium"
        label="Exiger la vérification d'identité des répondants"
        :description="
          auth.isPremium
            ? 'Seuls les comptes ayant validé leur identité (KYC via un prestataire tiers) pourront voter. Modifiable ensuite dans les propriétés du sondage.'
            : 'Réservé à l\'offre Premium.'
        "
        @update:model-value="emit('update:identity', $event)"
      />
      <RouterLink
        v-if="!auth.isPremium"
        to="/offres"
        target="_blank"
        class="mt-2 inline-block text-[12.5px] font-extrabold text-[var(--ds-link)]"
      >
        Voir l'offre Premium →
      </RouterLink>
    </div>
  </div>
</template>
