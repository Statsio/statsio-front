<script setup lang="ts">
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'
import StepCategories from '@/components/create/steps/StepCategories.vue'

const categories = defineModel<string[]>({ required: true })
</script>

<template>
  <StatsDataSettingsCard title="Catégories" description="Aident les lecteurs à retrouver ce contenu dans les recherches et le catalogue.">
    <StepCategories v-model="categories" />
  </StatsDataSettingsCard>
</template>
