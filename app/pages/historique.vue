<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })
import AppButton from '@/components/ui/AppButton.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-8">
      <div class="container flex flex-col gap-8">
        <div class="flex flex-col gap-5">
          <p class="eyebrow text-primary">Mon activité</p>
          <div class="max-w-4xl">
            <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Historique
            </h1>
            <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Retrouvez tous les articles, StatsData et sondages que vous avez consultés.
            </p>
          </div>
        </div>

        <div class="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
          <svg class="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h2 class="text-lg font-semibold text-slate-800">Historique bientôt disponible</h2>
          <p class="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            Le suivi de votre activité de lecture sera disponible dans une prochaine mise à jour.
          </p>
          <div class="mt-6 flex justify-center gap-3">
            <AppButton as="router-link" to="/statsdata" variant="primary" size="sm">
              Explorer les StatsData
            </AppButton>
            <AppButton as="router-link" to="/contenus" variant="secondary" size="sm">
              Mes contenus
            </AppButton>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
