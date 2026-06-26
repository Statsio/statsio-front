<script setup lang="ts">
withDefaults(
  defineProps<{
    signals: { label: string; value: string; detail: string }[]
    badgeLabel?: string
    title?: string
    description?: string
  }>(),
  {
    badgeLabel: 'Espace sécurisé',
    title: 'Connectez-vous à votre espace Statsio.',
    description: 'Retrouvez vos contenus, vos abonnements et vos accès depuis une interface claire, rapide et sécurisée.',
  },
)

const icons = [
  // Clock
  `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/></svg>`,
  // Users
  `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6 5.87H9m6 0v-2a6 6 0 10-12 0v2"/></svg>`,
  // Link
  `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>`,
]
</script>

<template>
  <div class="flex h-full flex-col justify-between gap-10">

    <!-- Text block -->
    <div class="space-y-6">
      <span class="badge bg-white/12 text-white/70 border-white/10 border">{{ badgeLabel }}</span>

      <div class="space-y-4">
        <h1 class="max-w-lg text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
          {{ title }}
        </h1>
        <p class="max-w-md text-sm leading-7 text-slate-400 sm:text-base lg:leading-8">
          {{ description }}
        </p>
      </div>
    </div>

    <!-- Signal cards -->
    <div class="grid gap-3 sm:grid-cols-3">
      <article
        v-for="(signal, i) in signals"
        :key="signal.label"
        class="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:border-white/14 hover:bg-white/8"
      >
        <div class="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-slate-300 transition group-hover:bg-white/14 group-hover:text-white">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="icons[(i as number) % icons.length]" />
        </div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
          {{ signal.label }}
        </p>
        <p class="mt-2 text-2xl font-semibold tracking-tight text-white">
          {{ signal.value }}
        </p>
        <p class="mt-2 text-[13px] leading-5 text-slate-400">
          {{ signal.detail }}
        </p>
      </article>
    </div>
  </div>
</template>
