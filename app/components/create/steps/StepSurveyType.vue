<script setup lang="ts">
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import { SURVEY_KIND_OPTIONS, type SurveyKind } from '@/types/content-creation'

defineProps<{
  kind: SurveyKind
  identity: boolean
}>()

const emit = defineEmits<{
  'update:kind': [SurveyKind]
  'update:identity': [boolean]
}>()
</script>

<template>
  <div class="space-y-5 py-2">
    <div class="space-y-3">
      <p class="text-sm font-semibold text-slate-700">Format de consultation</p>
      <div class="space-y-2.5">
        <button
          v-for="opt in SURVEY_KIND_OPTIONS"
          :key="opt.value"
          type="button"
          class="flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition"
          :class="kind === opt.value
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm'
            : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/40'"
          @click="emit('update:kind', opt.value)"
        >
          <span
            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition"
            :class="kind === opt.value ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300'"
          >
            <span v-if="kind === opt.value" class="h-2 w-2 rounded-full bg-white" />
          </span>
          <span class="min-w-0">
            <span class="flex items-center gap-2">
              <span class="text-base leading-none">{{ opt.icon }}</span>
              <span class="text-sm font-semibold" :class="kind === opt.value ? 'text-[var(--color-primary)]' : 'text-slate-800'">
                {{ opt.label }}
              </span>
            </span>
            <span class="mt-1 block text-xs text-slate-500">{{ opt.description }}</span>
          </span>
        </button>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <AppCheckbox
        :model-value="identity"
        label="Exiger la vérification d'identité des répondants"
        description="Seuls les comptes ayant validé leur identité (KYC via un prestataire tiers) pourront voter. Modifiable ensuite dans les propriétés du sondage."
        @update:model-value="emit('update:identity', $event)"
      />
    </div>
  </div>
</template>
