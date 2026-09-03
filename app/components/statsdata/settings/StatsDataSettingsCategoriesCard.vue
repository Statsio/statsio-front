<script setup lang="ts">
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'
import StepCategories from '@/components/create/steps/StepCategories.vue'
import { SUB_BRAND_OPTIONS, type SubBrand } from '@/types/sub-brand'

const categories = defineModel<string[]>('categories', { required: true })
const domain = defineModel<SubBrand>('domain', { required: true })
</script>

<template>
  <StatsDataSettingsCard
    title="Domaine & catégories"
    description="Le domaine détermine sur quel site le contenu est publié et les catégories proposées."
  >
    <div class="mb-4">
      <div class="mb-2 text-sm font-semibold text-slate-700">Domaine</div>
      <div class="flex flex-wrap gap-2.5">
        <button
          v-for="opt in SUB_BRAND_OPTIONS"
          :key="opt.value"
          type="button"
          class="inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition"
          :class="domain === opt.value
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
            : 'border-slate-200 bg-white text-slate-700 hover:border-[var(--color-primary)]/40'"
          @click="domain = opt.value"
        >{{ opt.label }}</button>
      </div>
    </div>

    <StepCategories v-model="categories" :domain="domain" />
  </StatsDataSettingsCard>
</template>
