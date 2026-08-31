<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{
  title: string
  subtitle: string
  primaryTo: string
  primaryLabel: string
  secondaryTo?: string
  secondaryLabel?: string
}>()
</script>

<template>
  <div class="mt-11 flex flex-wrap items-center gap-4 rounded-[20px] border-l-4 border-accent bg-white px-7 py-6 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
    <div class="min-w-[240px] flex-1">
      <p class="text-lg font-extrabold tracking-[-0.015em] text-slate-950">{{ title }}</p>
      <p class="mt-1.5 max-w-[56ch] text-[13.5px] leading-relaxed text-slate-500">{{ subtitle }}</p>
    </div>
    <AppButton as="router-link" :to="primaryTo" variant="gradient" size="md" class="shrink-0">
      {{ primaryLabel }}
    </AppButton>
    <AppButton
      v-if="secondaryTo && secondaryLabel"
      as="router-link"
      :to="secondaryTo"
      variant="outline"
      size="md"
      class="shrink-0"
    >
      {{ secondaryLabel }}
    </AppButton>
  </div>
</template>
