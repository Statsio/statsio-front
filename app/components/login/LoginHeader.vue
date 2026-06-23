<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppWordmark from '@/components/ui/AppWordmark.vue'
</script>

<template>
  <header class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
    <RouterLink to="/" class="inline-flex items-center gap-3 text-white sm:gap-4">
      <img src="@/assets/brand/statsio-logo.svg" alt="Statsio" class="h-10 w-10 rounded-2xl bg-white sm:h-11 sm:w-11" />
      <div>
        <AppWordmark class="text-xs tracking-[0.35em] text-white/60" />
        <p class="text-xs font-semibold text-white/90 sm:text-sm">Media intelligence platform</p>
      </div>
    </RouterLink>

    <AppButton as="router-link" to="/" variant="light-outline" size="md" class="w-full sm:w-auto">
      Retour à l'accueil
    </AppButton>
  </header>
</template>
