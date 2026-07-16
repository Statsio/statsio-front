<script setup lang="ts">
import type { MaladieSuggestion } from '@/types/maladies'

defineProps<{
  maladie: MaladieSuggestion
}>()
</script>

<template>
  <NuxtLink
    :to="`/medistats/maladies/${maladie.id}`"
    class="group flex w-full items-center gap-3.5 border-b border-slate-100 px-5 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
  >
    <div class="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-sm">
      🩺
    </div>

    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-bold text-slate-900">{{ maladie.name }}</p>
    </div>
  </NuxtLink>
</template>
