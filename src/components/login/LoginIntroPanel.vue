<script setup lang="ts">
withDefaults(defineProps<{
  signals: {
    label: string
    value: string
    detail: string
  }[]
  badgeLabel?: string
  title?: string
  description?: string
}>(), {
  badgeLabel: 'Espace sécurisé',
  title: 'Connectez-vous à votre espace Statsio.',
  description:
    'Retrouvez vos contenus, vos abonnements et vos accès depuis une interface claire, rapide et sécurisée.',
})
</script>

<template>
  <div class="flex flex-col justify-between gap-6 lg:gap-10">
    <div class="max-w-2xl space-y-5 lg:space-y-6">
      <span class="badge">{{ badgeLabel }}</span>
      <div class="space-y-4">
        <h1 class="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-6xl">
          {{ title }}
        </h1>
        <p class="max-w-xl text-sm leading-7 text-slate-300 sm:text-base lg:text-lg lg:leading-8">
          {{ description }}
        </p>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="signal in signals"
        :key="signal.label"
        class="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm sm:p-5"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{{ signal.label }}</p>
        <p class="mt-3 text-2xl font-semibold text-white sm:mt-4 sm:text-3xl">{{ signal.value }}</p>
        <p class="mt-3 text-sm leading-6 text-slate-300">{{ signal.detail }}</p>
      </article>
    </div>
  </div>
</template>
