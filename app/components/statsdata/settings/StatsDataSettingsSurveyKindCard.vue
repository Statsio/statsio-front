<script setup lang="ts">
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'
import { SURVEY_KIND_OPTIONS, type SurveyKind } from '@/types/content-creation'

const kind = defineModel<SurveyKind>({ required: true })
</script>

<template>
  <StatsDataSettingsCard
    title="Format de la consultation"
    description="Change l'affichage de la page publique : vote express, questionnaire ou pétition."
  >
    <div class="space-y-2.5">
      <button
        v-for="opt in SURVEY_KIND_OPTIONS"
        :key="opt.value"
        type="button"
        class="flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition"
        :class="
          kind === opt.value
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm'
            : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/40'
        "
        @click="kind = opt.value"
      >
        <span
          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition"
          :class="
            kind === opt.value
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
              : 'border-slate-300'
          "
        >
          <span v-if="kind === opt.value" class="h-2 w-2 rounded-full bg-white" />
        </span>
        <span class="min-w-0">
          <span class="flex items-center gap-2">
            <span class="text-base leading-none">{{ opt.icon }}</span>
            <span
              class="text-sm font-semibold"
              :class="kind === opt.value ? 'text-[var(--color-primary)]' : 'text-slate-800'"
            >
              {{ opt.label }}
            </span>
          </span>
          <span class="mt-1 block text-xs text-slate-500">{{ opt.description }}</span>
        </span>
      </button>
    </div>
  </StatsDataSettingsCard>
</template>
